/**
 * app/api/chat/route.ts — Endpoint SSE para chat ganadero con Google AI (Gemini).
 * Ticket: AUT-176
 * Migrado: OpenRouter/OpenAI SDK → Google AI SDK (@google/genai)
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
import type { Content, Part, FunctionCallingConfigMode } from "@google/genai";
import { withAuth, withAuthBearer } from "@/src/lib/with-auth";
import {
  getGoogleAIClient,
  buildSystemPrompt,
  CATTLE_TOOLS,
  ejecutarTool,
  GOOGLE_FLASH_MODEL,
  GOOGLE_REASONING_MODEL,
} from "@/src/lib/claude";
import { getNombrePredio, getPredioKpis, getPrediosNombres } from "@/src/lib/queries/predio";
import { AuthError } from "@/src/lib/with-auth";
import { db } from "@/src/db/client";
import { kbDocuments } from "@/src/db/schema/index";
import { eq, gt } from "drizzle-orm";

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

// FunctionCallingConfigMode.AUTO value
const FUNCTION_CALLING_AUTO = "AUTO" as FunctionCallingConfigMode;

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

  // 4. Inicializar cliente Google AI
  let ai;
  try {
    ai = getGoogleAIClient();
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

        // Cargar documentos KB válidos (no expirados) para este predio
        const now = new Date();
        const kbFiles = await db
          .select()
          .from(kbDocuments)
          .where(eq(kbDocuments.predioId, predioId));

        const validKbFiles = kbFiles.filter((f) => f.expiresAt > now);

        const model = reasoningMode ? GOOGLE_REASONING_MODEL : GOOGLE_FLASH_MODEL;

        // Convertir historial al formato Google AI
        // Gemini usa "model" en vez de "assistant"
        const conversationContents: Content[] = messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

        // Si hay archivos KB válidos, agregarlos como contexto al primer mensaje del usuario
        if (validKbFiles.length > 0) {
          const kbParts: Part[] = validKbFiles.map((f) => ({
            fileData: { fileUri: f.fileUri, mimeType: f.mimeType },
          }));

          // Insertar contexto KB antes de los mensajes como turno de usuario separado
          conversationContents.unshift({
            role: "user",
            parts: [
              ...kbParts,
              {
                text: `[Documentos de la base de conocimiento del predio ${predioId} — usar como referencia]`,
              },
            ],
          });
          // Agregar turno model vacío para mantener alternancia user/model
          conversationContents.splice(1, 0, {
            role: "model",
            parts: [{ text: "Entendido. Usaré estos documentos como referencia." }],
          });
        }

        let iteraciones = 0;
        let currentContents = [...conversationContents];

        while (iteraciones < MAX_TOOL_ITERATIONS) {
          iteraciones++;

          const response = await ai.models.generateContentStream({
            model,
            contents: currentContents,
            config: {
              systemInstruction: systemPrompt,
              tools: [{ functionDeclarations: CATTLE_TOOLS }],
              toolConfig: {
                functionCallingConfig: { mode: FUNCTION_CALLING_AUTO },
              },
              maxOutputTokens: 8192,
            },
          });

          let accumulatedText = "";
          const functionCalls: Array<{ id?: string; name: string; args: Record<string, unknown> }> = [];

          for await (const chunk of response) {
            // Stream texto
            const textDelta = chunk.text;
            if (textDelta) {
              accumulatedText += textDelta;
              sendEvent({ type: "text_delta", delta: textDelta });
            }

            // Recolectar function calls (completos, no incrementales)
            const fcs = chunk.functionCalls;
            if (fcs && fcs.length > 0) {
              for (const fc of fcs) {
                if (fc.name) {
                  functionCalls.push({
                    id: fc.id,
                    name: fc.name,
                    args: (fc.args ?? {}) as Record<string, unknown>,
                  });
                }
              }
            }
          }

          // Sin function calls → respuesta final
          if (functionCalls.length === 0) {
            sendEvent({ type: "done" });
            controller.close();
            return;
          }

          // Agregar turno del modelo con los function calls al historial
          const modelParts: Part[] = [];
          if (accumulatedText) modelParts.push({ text: accumulatedText });
          for (const fc of functionCalls) {
            modelParts.push({ functionCall: { id: fc.id, name: fc.name, args: fc.args } });
          }
          currentContents.push({ role: "model", parts: modelParts });

          // Ejecutar tools y agregar resultados como turno de usuario
          const toolResultParts: Part[] = [];
          for (const fc of functionCalls) {
            sendEvent({ type: "tool_use", tool: fc.name, input: fc.args });

            const result = await ejecutarTool(
              fc.name,
              fc.args,
              prediosPermitidos,
              Number(userId),
              rolRank
            );

            sendEvent({ type: "tool_result", tool: fc.name, result });

            toolResultParts.push({
              functionResponse: {
                id: fc.id,
                name: fc.name,
                response: result as Record<string, unknown>,
              },
            });
          }

          currentContents.push({ role: "user", parts: toolResultParts });
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
