/**
 * app/api/chat/route.ts — Endpoint SSE para chat ganadero con Gemma 4.
 * Ticket: AUT-112 (migrado de Anthropic → OpenRouter/Gemma 4 26B A4B)
 *
 * POST /api/chat
 * Body: { messages: Array<{role: string, content: string}>, predio_id: number }
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
import OpenAI from "openai";
import { withAuth } from "@/src/lib/with-auth";
import {
  getOpenRouterClient,
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

const GEMMA_MODEL = "google/gemma-4-26b-a4b-it";

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
  let body: { messages: Array<{ role: string; content: string }>; predio_id: number };
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

  const prediosPermitidos = tieneAccesoTotal ? [] : predios;
  const rolRank = ROL_RANK[rol] ?? 0;

  // 4. Inicializar cliente OpenRouter
  let openrouter: OpenAI;
  try {
    openrouter = getOpenRouterClient();
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

        // Historial en formato OpenAI
        const conversationMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({
            role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
            content: m.content,
          })),
        ];

        let iteraciones = 0;

        while (iteraciones < MAX_TOOL_ITERATIONS) {
          iteraciones++;

          const streamResponse = await openrouter.chat.completions.create({
            model: GEMMA_MODEL,
            messages: conversationMessages,
            tools: CATTLE_TOOLS,
            stream: true,
          });

          // Acumular tool calls parciales y emitir text deltas
          const accToolCalls: Record<number, { id: string; name: string; arguments: string }> = {};
          let finishReason = "";

          for await (const chunk of streamResponse) {
            const choice = chunk.choices[0];
            if (!choice) continue;

            const delta = choice.delta;

            if (delta.content) {
              sendEvent({ type: "text_delta", delta: delta.content });
            }

            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (!accToolCalls[tc.index]) {
                  accToolCalls[tc.index] = { id: "", name: "", arguments: "" };
                }
                if (tc.id) accToolCalls[tc.index].id = tc.id;
                if (tc.function?.name) accToolCalls[tc.index].name = tc.function.name;
                if (tc.function?.arguments) accToolCalls[tc.index].arguments += tc.function.arguments;
              }
            }

            if (choice.finish_reason) {
              finishReason = choice.finish_reason;
            }
          }

          // Sin tool calls → terminado
          const toolCallsList = Object.values(accToolCalls);
          if (finishReason !== "tool_calls" || toolCallsList.length === 0) {
            sendEvent({ type: "done" });
            controller.close();
            return;
          }

          // Agregar mensaje del asistente con tool calls al historial
          conversationMessages.push({
            role: "assistant",
            content: null,
            tool_calls: toolCallsList.map((tc) => ({
              id: tc.id,
              type: "function" as const,
              function: { name: tc.name, arguments: tc.arguments },
            })),
          });

          // Ejecutar cada tool y agregar resultado al historial
          for (const tc of toolCallsList) {
            let toolInput: Record<string, unknown>;
            try {
              toolInput = JSON.parse(tc.arguments);
            } catch {
              toolInput = {};
            }

            sendEvent({ type: "tool_use", tool: tc.name, input: toolInput });

            const result = await ejecutarTool(
              tc.name,
              toolInput,
              prediosPermitidos,
              Number(userId),
              rolRank
            );

            sendEvent({ type: "tool_result", tool: tc.name, result });

            conversationMessages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify(result),
            });
          }
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
