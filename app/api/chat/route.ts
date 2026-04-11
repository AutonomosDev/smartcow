/**
 * app/api/chat/route.ts — Endpoint SSE para chat ganadero con OpenRouter/Gemma.
 * Ticket: AUT-112
 * Migrado: Anthropic SDK → OpenRouter (OpenAI-compatible) + Gemma
 *
 * POST /api/chat
 * Body: { messages: {role, content}[], predio_id: number, web_search?: boolean }
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
import type OpenAI from "openai";
import { withAuth } from "@/src/lib/with-auth";
import {
  getOpenRouterClient,
  buildSystemPrompt,
  CATTLE_TOOLS,
  ejecutarTool,
  OPENROUTER_FLASH_MODEL,
  OPENROUTER_REASONING_MODEL,
} from "@/src/lib/claude";
import { getNombrePredio, getPredioKpis, getPrediosNombres } from "@/src/lib/queries/predio";
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
  let body: {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    predio_id: number;
    web_search?: boolean;
    reasoning_mode?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body inválido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, predio_id: predioId, reasoning_mode: reasoningMode } = body;

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
  let client: OpenAI;
  try {
    client = getOpenRouterClient();
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
        // Pre-fetch contexto real del predio para eliminar alucinaciones
        const [nombrePredio, prediosNombres, kpis] = await Promise.all([
          getNombrePredio(predioId),
          getPrediosNombres(session.user.predios),
          getPredioKpis(predioId),
        ]);

        const systemPrompt = buildSystemPrompt(session, predioId, {
          nombrePredio: nombrePredio ?? `Predio ${predioId}`,
          prediosNombres,
          kpis,
        });

        const model = reasoningMode ? OPENROUTER_REASONING_MODEL : OPENROUTER_FLASH_MODEL;

        // Historial de conversación en formato OpenAI
        const conversationMessages: OpenAI.Chat.ChatCompletionMessageParam[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        let iteraciones = 0;

        while (iteraciones < MAX_TOOL_ITERATIONS) {
          iteraciones++;

          const aiStream = await client.chat.completions.create({
            model,
            max_tokens: 4096,
            messages: [
              { role: "system", content: systemPrompt },
              ...conversationMessages,
            ],
            tools: CATTLE_TOOLS,
            tool_choice: "auto",
            stream: true,
          });

          let accumulatedText = "";
          // índice → { id, name, arguments }
          const pendingToolCalls: Record<number, { id: string; name: string; arguments: string }> = {};
          let finishReason = "";

          for await (const chunk of aiStream) {
            const choice = chunk.choices[0];
            if (!choice) continue;

            const delta = choice.delta;

            // Texto streameado
            if (delta.content) {
              accumulatedText += delta.content;
              sendEvent({ type: "text_delta", delta: delta.content });
            }

            // Acumular tool call deltas
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index;
                if (!pendingToolCalls[idx]) {
                  pendingToolCalls[idx] = { id: "", name: "", arguments: "" };
                }
                if (tc.id) pendingToolCalls[idx].id = tc.id;
                if (tc.function?.name) pendingToolCalls[idx].name = tc.function.name;
                if (tc.function?.arguments) pendingToolCalls[idx].arguments += tc.function.arguments;
              }
            }

            if (choice.finish_reason) {
              finishReason = choice.finish_reason;
            }
          }

          const toolCalls = Object.values(pendingToolCalls);

          // Sin tool calls → respuesta final
          if (finishReason !== "tool_calls" || toolCalls.length === 0) {
            sendEvent({ type: "done" });
            controller.close();
            return;
          }

          // Agregar turno del asistente con tool calls al historial
          conversationMessages.push({
            role: "assistant",
            content: accumulatedText || null,
            tool_calls: toolCalls.map((tc) => ({
              id: tc.id,
              type: "function" as const,
              function: { name: tc.name, arguments: tc.arguments },
            })),
          });

          // Ejecutar tools y agregar resultados
          for (const tc of toolCalls) {
            let parsedInput: Record<string, unknown> = {};
            try {
              parsedInput = JSON.parse(tc.arguments);
            } catch {
              parsedInput = {};
            }

            sendEvent({ type: "tool_use", tool: tc.name, input: parsedInput });

            const result = await ejecutarTool(
              tc.name,
              parsedInput,
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
