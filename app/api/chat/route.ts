/**
 * app/api/chat/route.ts — Endpoint SSE para chat ganadero con Claude.
 * Ticket: AUT-112
 *
 * POST /api/chat
 * Body: { messages: MessageParam[], predio_id: number }
 * Response: text/event-stream (SSE)
 *
 * Eventos SSE:
 *   data: { type: "text_delta", delta: string }
 *   data: { type: "tool_use", tool: string, input: unknown }
 *   data: { type: "tool_result", tool: string, result: unknown }
 *   data: { type: "done" }
 *   data: { type: "error", message: string }
 *
 * Seguridad:
 *   - withAuth() en cada request
 *   - predioId validado contra predios del usuario
 *   - No PII en logs
 */

import { NextRequest } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { withAuth } from "@/src/lib/with-auth";
import {
  getAnthropicClient,
  buildSystemPrompt,
  CATTLE_TOOLS,
  ejecutarTool,
} from "@/src/lib/claude";
import { AuthError } from "@/src/lib/with-auth";

// Jerarquía de roles — sincronizada con with-auth.ts
const ROL_RANK: Record<string, number> = {
  viewer: 0,
  operador: 1,
  veterinario: 2,
  admin_fundo: 3,
  admin_org: 4,
  superadmin: 5,
};

// Máximo de iteraciones de tool use por request (evitar loops infinitos)
const MAX_TOOL_ITERATIONS = 5;

export async function POST(req: NextRequest) {
  // 1. Autenticación
  let session;
  try {
    session = await withAuth();
  } catch (err) {
    if (err instanceof AuthError) {
      return new Response(
        JSON.stringify({ error: err.message, code: err.code }),
        { status: err.code === "UNAUTHENTICATED" ? 401 : 403, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(JSON.stringify({ error: "Error de autenticación" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Parsear body
  let body: { messages: Anthropic.MessageParam[]; predio_id: number };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body inválido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, predio_id: predioId } = body;

  if (!predioId || typeof predioId !== "number") {
    return new Response(JSON.stringify({ error: "predio_id requerido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages requerido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Validar acceso al predio
  const { rol, predios, id: userId } = session.user;
  const tieneAccesoTotal = rol === "superadmin" || rol === "admin_org";

  if (!tieneAccesoTotal && !predios.includes(predioId)) {
    return new Response(JSON.stringify({ error: "Sin acceso a este predio", code: "FORBIDDEN" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // prediosPermitidos vacío = acceso total (superadmin / admin_org)
  const prediosPermitidos = tieneAccesoTotal ? [] : predios;
  const rolRank = ROL_RANK[rol] ?? 0;

  // 4. Inicializar cliente Anthropic
  let anthropic;
  try {
    anthropic = getAnthropicClient();
  } catch {
    return new Response(JSON.stringify({ error: "Servicio no disponible" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 5. Construir SSE stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      function sendError(message: string) {
        sendEvent({ type: "error", message });
        controller.close();
      }

      try {
        const systemPrompt = buildSystemPrompt(session, predioId);
        const conversationMessages: Anthropic.MessageParam[] = [...messages];

        let iteraciones = 0;

        while (iteraciones < MAX_TOOL_ITERATIONS) {
          iteraciones++;

          const stream = anthropic.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            system: systemPrompt,
            tools: CATTLE_TOOLS,
            messages: conversationMessages,
          });

          let fullText = "";
          const toolUses: Anthropic.ToolUseBlock[] = [];

          stream.on("text", (delta) => {
            fullText += delta;
            sendEvent({ type: "text_delta", delta });
          });

          const finalMessage = await stream.finalMessage();

          for (const block of finalMessage.content) {
            if (block.type === "tool_use") {
              toolUses.push(block);
            }
          }

          if (toolUses.length === 0 || finalMessage.stop_reason !== "tool_use") {
            sendEvent({ type: "done" });
            controller.close();
            return;
          }

          conversationMessages.push({
            role: "assistant",
            content: finalMessage.content,
          });

          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const toolUse of toolUses) {
            sendEvent({
              type: "tool_use",
              tool: toolUse.name,
              input: toolUse.input,
            });

            const result = await ejecutarTool(
              toolUse.name,
              toolUse.input as Record<string, unknown>,
              prediosPermitidos,
              Number(userId),
              rolRank
            );

            sendEvent({
              type: "tool_result",
              tool: toolUse.name,
              result,
            });

            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: JSON.stringify(result),
            });
          }

          conversationMessages.push({
            role: "user",
            content: toolResults,
          });
        }

        sendEvent({ type: "done" });
        controller.close();
      } catch (err) {
        console.error("[chat] error en stream:", err instanceof Error ? err.message : "unknown");
        sendError("Error procesando la consulta");
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
