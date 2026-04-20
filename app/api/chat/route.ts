/**
 * app/api/chat/route.ts — Endpoint SSE del chat ganadero.
 * Tickets: AUT-261 (Anthropic SDK), AUT-262 (router), AUT-263 (tracking), AUT-264 (budget)
 *
 * Proveedor: Anthropic SDK (@anthropic-ai/sdk). Modelos aprobados: ver llm-routing-and-budget.yaml.
 * Tools declaradas en src/lib/claude.ts (formato Google AI SDK FunctionDeclaration),
 * convertidas a formato Anthropic tool por toAnthropicTools().
 *
 * POST /api/chat
 * Body: { messages: {role, content}[], predio_id: number, attachment_ids?: number[], webSearch?: boolean }
 * Response: text/event-stream (SSE)
 *
 * Eventos SSE:
 *   data: { type: "text_delta", delta: string }
 *   data: { type: "tool_use", tool: string, input: unknown }
 *   data: { type: "tool_result", tool: string, result: unknown }
 *   data: { type: "done" }
 *   data: { type: "error", message: string }
 */

import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { withAuth, withAuthBearer } from "@/src/lib/with-auth";
import {
  buildSystemPrompt,
  CATTLE_TOOLS,
  ejecutarTool,
  type AttachmentMeta,
} from "@/src/lib/claude";
import { getNombrePredio, getPredioKpis, getPrediosNombres, getUltimoPesajePorLote, getTodosPrediosDeOrg, getPredioIdsDeOrg } from "@/src/lib/queries/predio";
import { AuthError } from "@/src/lib/with-auth";
import { db } from "@/src/db/client";
import { kbDocuments, chatAttachments, type KbDocument } from "@/src/db/schema/index";
import { eq, inArray } from "drizzle-orm";
import { pickModel, type TierName } from "@/src/lib/router";
import { checkBudget, writeChatUsage } from "@/src/lib/budget";

// Jerarquía de roles
const ROL_RANK: Record<string, number> = {
  viewer: 0,
  operador: 1,
  veterinario: 2,
  admin_fundo: 3,
  admin_org: 4,
  superadmin: 5,
};

const MAX_TOOL_ITERATIONS = 8;

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no configurada");
  return new Anthropic({ apiKey });
}

// Convertir CATTLE_TOOLS (formato Google FunctionDeclaration) al formato Anthropic tool
function toAnthropicTools(cattleTools: typeof CATTLE_TOOLS): Anthropic.Tool[] {
  return cattleTools
    .filter((t) => t.name && t.description)
    .map((t) => ({
      name: t.name as string,
      description: t.description as string,
      input_schema: (t.parameters ?? { type: "object", properties: {} }) as Anthropic.Tool["input_schema"],
    }));
}

export async function POST(req: NextRequest) {
  const startMs = Date.now();

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
    attachment_ids?: number[];
    webSearch?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body inválido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, predio_id: predioId, attachment_ids: attachmentIds, webSearch = false } = body;

  if (!predioId || typeof predioId !== "number") {
    return new Response(
      JSON.stringify({
        error: `predio_id requerido (recibido: ${typeof predioId}, valor: ${predioId})`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "messages requerido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Validar acceso al predio
  const { rol, predios, id: userId, orgId } = session.user;
  const tieneAccesoTotal = rol === "superadmin" || rol === "admin_org";

  if (!tieneAccesoTotal && !predios.includes(predioId)) {
    return new Response(JSON.stringify({ error: "Sin acceso a este predio", code: "FORBIDDEN" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const prediosDelScope = tieneAccesoTotal ? await getPredioIdsDeOrg(orgId) : predios;
  const prediosPermitidos = tieneAccesoTotal ? [] : predios;
  const rolRank = ROL_RANK[rol] ?? 0;

  // 4. Routing + Budget (AUT-262, AUT-264)
  const lastMessage = messages[messages.length - 1]?.content ?? "";
  const { modelId, tier } = pickModel({
    lastMessage,
    webSearchActive: webSearch,
    prediosEnScope: prediosDelScope.length,
  });

  const budgetCheck = await checkBudget(orgId, tier);
  if (!budgetCheck.ok) {
    return new Response(
      JSON.stringify({ error: budgetCheck.message, code: "BUDGET_EXCEEDED" }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    );
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

      let tokensIn = 0;
      let tokensOut = 0;
      let toolCallsCount = 0;
      let hadArtifact = false;
      let trackingError: string | null = null;

      try {
        // Pre-fetch contexto real del predio
        const [nombrePredio, prediosNombres, kpis, ultimoPesajePorLote, rawAttachments] = await Promise.all([
          getNombrePredio(predioId),
          tieneAccesoTotal
            ? getTodosPrediosDeOrg(orgId)
            : getPrediosNombres(session.user.predios),
          getPredioKpis(predioId),
          getUltimoPesajePorLote(predioId).catch(() => []),
          attachmentIds && attachmentIds.length > 0
            ? db
                .select({
                  id: chatAttachments.id,
                  filename: chatAttachments.filename,
                  columnas: chatAttachments.columnas,
                  filasCount: chatAttachments.filasCount,
                  predioId: chatAttachments.predioId,
                })
                .from(chatAttachments)
                .where(inArray(chatAttachments.id, attachmentIds))
            : Promise.resolve([]),
        ]);

        const attachmentsMeta: AttachmentMeta[] = rawAttachments.filter((a) =>
          tieneAccesoTotal || prediosPermitidos.includes(a.predioId)
        );

        const systemPrompt = buildSystemPrompt(session, predioId, {
          nombrePredio: nombrePredio ?? `Predio ${predioId}`,
          prediosNombres,
          kpis,
          ultimoPesajePorLote,
          attachmentsMeta: attachmentsMeta.length > 0 ? attachmentsMeta : undefined,
          webSearch,
        });

        // Cargar documentos KB válidos
        let kbContext = "";
        try {
          const now = new Date();
          const kbFiles: KbDocument[] = await db.select().from(kbDocuments).where(eq(kbDocuments.predioId, predioId));
          const validKbFiles = kbFiles.filter((f) => f.expiresAt > now);
          if (validKbFiles.length > 0) {
            kbContext = `\n\n[BASE DE CONOCIMIENTO — ${validKbFiles.length} documento(s) disponibles: ${validKbFiles.map((f) => f.nombre).join(", ")}]`;
          }
        } catch {
          // kb_documents tabla no disponible — continuar sin KB
        }

        // Construir historial en formato Anthropic
        const chatMessages: Anthropic.MessageParam[] = messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        // Tools activas según toggle webSearch
        const activeTools = webSearch
          ? CATTLE_TOOLS
          : CATTLE_TOOLS.filter((t) => t.name !== "web_search");
        const anthropicTools = toAnthropicTools(activeTools);

        const client = getAnthropicClient();
        let iteraciones = 0;

        // Historial acumulativo para multi-turn con tool use
        const runMessages: Anthropic.MessageParam[] = [...chatMessages];

        while (iteraciones < MAX_TOOL_ITERATIONS) {
          iteraciones++;

          const response = await client.messages.create({
            model: modelId,
            max_tokens: 8192,
            system: systemPrompt + kbContext,
            messages: runMessages,
            tools: anthropicTools,
            tool_choice: { type: "auto" },
            stream: true,
          });

          let accumulatedText = "";
          const toolUseBlocks: Array<{ id: string; name: string; input: string }> = [];
          let currentToolId = "";
          let currentToolName = "";
          let currentToolInput = "";

          for await (const event of response) {
            if (event.type === "message_start") {
              tokensIn += event.message.usage?.input_tokens ?? 0;
            } else if (event.type === "message_delta") {
              tokensOut += event.usage?.output_tokens ?? 0;
            } else if (event.type === "content_block_start") {
              if (event.content_block.type === "tool_use") {
                currentToolId = event.content_block.id;
                currentToolName = event.content_block.name;
                currentToolInput = "";
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                accumulatedText += event.delta.text;
                sendEvent({ type: "text_delta", delta: event.delta.text });
              } else if (event.delta.type === "input_json_delta") {
                currentToolInput += event.delta.partial_json;
              }
            } else if (event.type === "content_block_stop") {
              if (currentToolId) {
                toolUseBlocks.push({
                  id: currentToolId,
                  name: currentToolName,
                  input: currentToolInput,
                });
                currentToolId = "";
                currentToolName = "";
                currentToolInput = "";
              }
            }
          }

          // Sin tool calls → respuesta final
          if (toolUseBlocks.length === 0) {
            // Parsear bloques ```artifact del texto acumulado
            const artifactRe = /```artifact\s*\n([\s\S]*?)\n```/g;
            let match: RegExpExecArray | null;
            while ((match = artifactRe.exec(accumulatedText)) !== null) {
              try {
                const parsed = JSON.parse(match[1].trim());
                if (parsed && typeof parsed === "object" && parsed.type) {
                  hadArtifact = true;
                  sendEvent({ type: "artifact_block", artifact: parsed });
                }
              } catch {
                // JSON malformado — ignorar
              }
            }
            sendEvent({ type: "done" });
            controller.close();
            break;
          }

          // Agregar turno del asistente al historial
          const assistantContent: Array<Anthropic.Messages.TextBlockParam | Anthropic.Messages.ToolUseBlockParam> = [];
          if (accumulatedText) {
            assistantContent.push({ type: "text", text: accumulatedText });
          }
          for (const tb of toolUseBlocks) {
            let parsedInput: Record<string, unknown> = {};
            try { parsedInput = JSON.parse(tb.input || "{}"); } catch { parsedInput = {}; }
            assistantContent.push({ type: "tool_use", id: tb.id, name: tb.name, input: parsedInput });
          }
          runMessages.push({ role: "assistant", content: assistantContent });

          // Ejecutar tools y construir tool_result turn
          const toolResultContent: Anthropic.ToolResultBlockParam[] = [];

          for (const tb of toolUseBlocks) {
            toolCallsCount++;
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(tb.input || "{}"); } catch { args = {}; }

            sendEvent({ type: "tool_use", tool: tb.name, input: args });

            let result = await ejecutarTool(tb.name, args, prediosPermitidos, Number(userId), rolRank);

            if (result && typeof result === "object" && (result as Record<string, unknown>).code === "FORBIDDEN") {
              const prediosNombresList = Array.from(prediosNombres.values());
              result = {
                mensaje: `Predio fuera de tu alcance. Accesibles: ${prediosNombresList.join(", ") || "ninguno"}.`,
              };
            }

            sendEvent({ type: "tool_result", tool: tb.name, result });

            toolResultContent.push({
              type: "tool_result",
              tool_use_id: tb.id,
              content: JSON.stringify(result),
            });
          }

          runMessages.push({ role: "user", content: toolResultContent });
        }

        // Si salimos por MAX_TOOL_ITERATIONS sin break
        if (iteraciones >= MAX_TOOL_ITERATIONS) {
          sendEvent({ type: "done" });
          controller.close();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : JSON.stringify(err);
        console.error("[chat] error en stream:", msg);
        trackingError = msg;
        sendError("Error procesando la consulta");
      } finally {
        // Tracking (AUT-263) — ANTES de cerrar stream, no bloquea respuesta
        const latencyMs = Date.now() - startMs;
        try {
          await writeChatUsage({
            orgId,
            userId: Number(userId),
            predioId,
            modelId,
            tier,
            tokensIn,
            tokensOut,
            toolCalls: toolCallsCount,
            hadArtifact,
            latencyMs,
            error: trackingError,
          });
        } catch (trackErr) {
          console.warn("[chat] tracking write failed:", trackErr instanceof Error ? trackErr.message : trackErr);
        }
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
