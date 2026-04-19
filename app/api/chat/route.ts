/**
 * app/api/chat/route.ts — Endpoint SSE para chat ganadero con OpenRouter/Gemma 4.
 * Ticket: AUT-176
 * Migrado: Google AI SDK → OpenRouter (OpenAI-compatible SDK)
 * Modelo: google/gemma-4-31b-it via OpenRouter
 *
 * POST /api/chat
 * Body: { messages: {role, content}[], predio_id: number, reasoning_mode?: boolean }
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
import { withAuth, withAuthBearer } from "@/src/lib/with-auth";
import {
  buildSystemPrompt,
  CATTLE_TOOLS,
  ejecutarTool,
} from "@/src/lib/claude";
import { getNombrePredio, getPredioKpis, getPrediosNombres } from "@/src/lib/queries/predio";
import { AuthError } from "@/src/lib/with-auth";
import { db } from "@/src/db/client";
import { kbDocuments, type KbDocument } from "@/src/db/schema/index";
import { eq } from "drizzle-orm";

// ⚠️ PROHIBIDO CAMBIAR ESTE MODELO SIN APROBACIÓN DE CÉSAR
const OR_MODEL = "google/gemma-4-31b-it";

// Jerarquía de roles
const ROL_RANK: Record<string, number> = {
  viewer: 0,
  operador: 1,
  veterinario: 2,
  admin_fundo: 3,
  admin_org: 4,
  superadmin: 5,
};

const MAX_TOOL_ITERATIONS = 5;

function getOpenRouterClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY no configurada");
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": "https://smartcow.cl",
      "X-Title": "SmartCow",
    },
  });
}

// Convertir CATTLE_TOOLS (formato Google) al formato OpenAI function calling
function toOpenAITools(cattleTools: typeof CATTLE_TOOLS): OpenAI.Chat.ChatCompletionTool[] {
  return cattleTools
    .filter((t) => t.name && t.description)
    .map((t) => ({
      type: "function" as const,
      function: {
        name: t.name as string,
        description: t.description as string,
        parameters: t.parameters as Record<string, unknown>,
      },
    }));
}

export async function POST(req: NextRequest) {
  // 1. Autenticación — Bearer (mobile) o cookie (web)
  let session;
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      session = await withAuthBearer(req);
    } else {
      session = await withAuth();
    }
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
        // Pre-fetch contexto real del predio
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

        // Cargar documentos KB válidos — como texto en el system prompt
        // (OpenRouter no soporta Google Files API fileData)
        let kbContext = "";
        try {
          const now = new Date();
          const kbFiles: KbDocument[] = await db
            .select()
            .from(kbDocuments)
            .where(eq(kbDocuments.predioId, predioId));
          const validKbFiles = kbFiles.filter((f) => f.expiresAt > now);
          if (validKbFiles.length > 0) {
            kbContext = `\n\n[BASE DE CONOCIMIENTO — ${validKbFiles.length} documento(s) disponibles: ${validKbFiles.map((f) => f.nombre).join(", ")}]`;
          }
        } catch {
          // kb_documents tabla no disponible — continuar sin KB
        }

        // Construir historial en formato OpenAI
        const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: "system", content: systemPrompt + kbContext },
          ...messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ];

        const tools = toOpenAITools(CATTLE_TOOLS);
        let iteraciones = 0;

        while (iteraciones < MAX_TOOL_ITERATIONS) {
          iteraciones++;

          const response = await client.chat.completions.create({
            model: OR_MODEL,
            messages: chatMessages,
            tools,
            tool_choice: "auto",
            stream: true,
            max_tokens: 8192,
          });

          let accumulatedText = "";
          const toolCallsMap: Map<number, { id: string; name: string; args: string }> = new Map();

          for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta;
            if (!delta) continue;

            // Stream texto
            if (delta.content) {
              accumulatedText += delta.content;
              sendEvent({ type: "text_delta", delta: delta.content });
            }

            // Acumular tool calls (llegan en fragmentos)
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index;
                if (!toolCallsMap.has(idx)) {
                  toolCallsMap.set(idx, { id: tc.id ?? "", name: tc.function?.name ?? "", args: "" });
                }
                const existing = toolCallsMap.get(idx)!;
                if (tc.id) existing.id = tc.id;
                if (tc.function?.name) existing.name = tc.function.name;
                if (tc.function?.arguments) existing.args += tc.function.arguments;
              }
            }
          }

          const toolCalls = Array.from(toolCallsMap.values());

          // Sin tool calls → respuesta final
          if (toolCalls.length === 0) {
            // Parsear bloques ```artifact\n{...}\n``` del texto acumulado
            const artifactRe = /```artifact\s*\n([\s\S]*?)\n```/g;
            let match: RegExpExecArray | null;
            while ((match = artifactRe.exec(accumulatedText)) !== null) {
              try {
                const parsed = JSON.parse(match[1].trim());
                if (parsed && typeof parsed === "object" && parsed.type) {
                  sendEvent({ type: "artifact_block", artifact: parsed });
                }
              } catch {
                // JSON malformado — ignorar silenciosamente
              }
            }
            sendEvent({ type: "done" });
            controller.close();
            return;
          }

          // Agregar turno del asistente con tool calls al historial
          chatMessages.push({
            role: "assistant",
            content: accumulatedText || null,
            tool_calls: toolCalls.map((tc) => ({
              id: tc.id,
              type: "function" as const,
              function: { name: tc.name, arguments: tc.args },
            })),
          });

          // Ejecutar tools y agregar resultados
          for (const tc of toolCalls) {
            let args: Record<string, unknown> = {};
            try {
              args = JSON.parse(tc.args);
            } catch {
              args = {};
            }

            sendEvent({ type: "tool_use", tool: tc.name, input: args });

            const result = await ejecutarTool(
              tc.name,
              args,
              prediosPermitidos,
              Number(userId),
              rolRank
            );

            sendEvent({ type: "tool_result", tool: tc.name, result });

            chatMessages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify(result),
            });
          }
        }

        sendEvent({ type: "done" });
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : JSON.stringify(err);
        console.error("[chat] error en stream:", msg);
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
