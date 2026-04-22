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
  getUserMemoryForPrompt,
  type AttachmentMeta,
} from "@/src/lib/claude";
import { getNombrePredio, getPredioKpis, getPrediosNombres, getUltimoPesajePorLote, getTodosPrediosDeOrg, getPredioIdsDeOrg } from "@/src/lib/queries/predio";
import { AuthError } from "@/src/lib/with-auth";
import { db } from "@/src/db/client";
import { kbDocuments, chatAttachments, type KbDocument } from "@/src/db/schema/index";
import { eq, inArray } from "drizzle-orm";
import { pickModel, MODELS, type TierName } from "@/src/lib/router";
import { checkBudget, writeChatUsage, canUseTier, highestAllowedTier } from "@/src/lib/budget";
import { tryCache, writeCache } from "@/src/lib/cache";
import { checkRateLimit, rateLimitHeaders } from "@/src/lib/rate-limit";
import { ejecutarReportarFeedback, type FeedbackArgs } from "@/src/lib/linear-feedback";
import { langfuse } from "@/src/lib/langfuse";

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

// Convertir CATTLE_TOOLS (formato Google FunctionDeclaration) al formato Anthropic tool.
// Google SDK emite Type.OBJECT="OBJECT" (uppercase) — Anthropic exige JSON Schema lowercase
// ("object", "string", etc.). Normalizamos recursivamente todos los `type` strings.
function normalizeSchemaTypes(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(normalizeSchemaTypes);
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      out[k] = k === "type" && typeof v === "string" ? v.toLowerCase() : normalizeSchemaTypes(v);
    }
    return out;
  }
  return node;
}

function toAnthropicTools(cattleTools: typeof CATTLE_TOOLS): Anthropic.Tool[] {
  return cattleTools
    .filter((t) => t.name && t.description)
    .map((t) => ({
      name: t.name as string,
      description: t.description as string,
      input_schema: normalizeSchemaTypes(
        t.parameters ?? { type: "object", properties: {} },
      ) as Anthropic.Tool["input_schema"],
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

  // 3.5 Rate limit (AUT-274) — 20 req/min por usuario. Después de auth, antes de cache/budget/router.
  const rl = checkRateLimit(userId, 20, 60_000);
  if (!rl.allowed) {
    console.warn(`[rate-limit] 429 userId=${userId} path=/api/chat resetIn=${rl.resetIn}ms`);
    return new Response(
      JSON.stringify({ error: "Rate limit", resetIn: rl.resetIn, code: "RATE_LIMITED" }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(rl.resetIn / 1000)),
          ...rateLimitHeaders(rl),
        },
      }
    );
  }
  const rlHeaders = rateLimitHeaders(rl);

  const prediosDelScope = tieneAccesoTotal ? await getPredioIdsDeOrg(orgId) : predios;
  const prediosPermitidos = tieneAccesoTotal ? [] : predios;
  const rolRank = ROL_RANK[rol] ?? 0;

  const lastMessage = messages[messages.length - 1]?.content ?? "";

  // 4. Query cache (AUT-265) — ANTES de budget/router
  // Bypass con header X-Cache-Bypass: 1. Skip si webSearch activo.
  const cacheBypass = req.headers.get("x-cache-bypass") === "1";
  const cacheEligible = !cacheBypass && !webSearch && lastMessage.length > 0;
  const cachedHit = cacheEligible
    ? await tryCache(predioId, Number(userId), lastMessage)
    : null;

  if (cachedHit) {
    console.log(`[cache] HIT predio=${predioId} hits=${cachedHit.hits}`);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };
        send({ type: "text_delta", delta: cachedHit.response });
        if (cachedHit.artifact) {
          send({ type: "artifact_block", artifact: cachedHit.artifact });
        }
        send({
          type: "done",
          cached: true,
          cachedAt: cachedHit.cachedAt.toISOString(),
          modelUsed: cachedHit.modelUsed,
        });
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        ...rlHeaders,
      },
    });
  }

  // 5. Routing + Budget (AUT-262, AUT-264)
  const picked = pickModel({
    lastMessage,
    webSearchActive: webSearch,
    prediosEnScope: prediosDelScope.length,
  });
  let { modelId, tier } = picked;
  const { reason: pickReason } = picked;
  console.log(`[router] tier=${tier} model=${modelId} reason=${pickReason}`);

  // Budget hard-block (402 antes de llamar Anthropic)
  const budgetStatus = await checkBudget(orgId, tier);
  if (!budgetStatus.ok) {
    return new Response(
      JSON.stringify({
        error: "Budget mensual alcanzado",
        spent: budgetStatus.spent,
        cap: budgetStatus.cap,
        plan: budgetStatus.plan,
        code: "BUDGET_EXCEEDED",
      }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    );
  }

  // Tier downgrade si plan no lo permite (AUT-264 enforcement.order=2)
  let downgradeInfo: { from: TierName; to: TierName; reason: string } | null = null;
  if (!canUseTier(budgetStatus.plan, tier)) {
    const target = highestAllowedTier(budgetStatus.plan);
    downgradeInfo = { from: tier, to: target, reason: `plan=${budgetStatus.plan}` };
    tier = target;
    modelId = MODELS[target].modelId;
    console.log(`[budget] tier_downgraded from=${downgradeInfo.from} to=${downgradeInfo.to} reason=${downgradeInfo.reason}`);
  }

  // 5. Construir SSE stream
  const encoder = new TextEncoder();

  // Langfuse trace — 1 trace por request (AUT-272)
  const traceId = `${userId}-${startMs}`;
  const trace = langfuse?.trace({
    id: traceId,
    name: "chat.turn",
    userId: String(userId),
    metadata: { orgId, predioId, tier, modelId },
    tags: [`predio:${predioId}`, `model:${modelId}`, `tier:${tier}`],
    input: lastMessage,
  }) ?? null;

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
      let cacheReadTokens = 0;
      let cacheWriteTokens = 0;
      let toolCallsCount = 0;
      let hadArtifact = false;
      let trackingError: string | null = null;
      // Para writeCache (AUT-265) — sólo se llena en respuesta final exitosa
      let finalResponse: string | null = null;
      let finalArtifact: unknown | null = null;
      let hadWrite = false;

      // Emitir selección de modelo ANTES del primer text_delta (AUT-262)
      sendEvent({ type: "model_selected", tier, modelId, reason: pickReason });

      // Downgrade de tier por plan (AUT-264) — emitir después de model_selected
      if (downgradeInfo) {
        sendEvent({
          type: "tier_downgraded",
          from: downgradeInfo.from,
          to: downgradeInfo.to,
          reason: downgradeInfo.reason,
        });
      }

      // Soft alert de budget al 85% (AUT-264)
      if (budgetStatus.warn) {
        sendEvent({
          type: "budget_warn",
          spent: budgetStatus.spent,
          cap: budgetStatus.cap,
          percent: budgetStatus.percent,
        });
      }

      // Span: pickModel (AUT-272)
      trace?.span({
        name: "pickModel",
        input: { lastMessage: lastMessage.slice(0, 200), webSearchActive: webSearch },
        output: { tier, modelId, reason: pickReason },
        metadata: { downgrade: downgradeInfo },
      });

      // Span: cache_lookup (AUT-272)
      trace?.span({
        name: "cache_lookup",
        input: { predioId, userId, bypass: cacheBypass, webSearch },
        output: { hit: false },
        metadata: { eligible: cacheEligible },
      });

      try {
        // Pre-fetch contexto real del predio + memoria persistente del usuario (AUT-270)
        const [nombrePredio, prediosNombres, kpis, ultimoPesajePorLote, rawAttachments, userMemoryRows] = await Promise.all([
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
          getUserMemoryForPrompt(Number(userId)).catch(() => []),
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
          userMemory: userMemoryRows.length > 0 ? userMemoryRows : undefined,
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

          // Prompt caching ephemeral sobre system prompt (TTL 5min, ahorro ~90%)
          // Ref: .claude/references/config/llm-routing-and-budget.yaml § prompt_caching
          const anthropicSpanStart = Date.now();
          const response = await client.messages.create({
            model: modelId,
            max_tokens: 8192,
            system: [
              {
                type: "text",
                text: systemPrompt + kbContext,
                cache_control: { type: "ephemeral" },
              },
            ],
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

          // Usage por iteración — necesario para que cada generation Langfuse
          // tenga su usage específico (no acumulado del turno).
          let iterTokensIn = 0;
          let iterTokensOut = 0;
          let iterCacheRead = 0;
          let iterCacheWrite = 0;

          for await (const event of response) {
            if (event.type === "message_start") {
              const usage = event.message.usage;
              iterTokensIn += usage?.input_tokens ?? 0;
              iterCacheRead += usage?.cache_read_input_tokens ?? 0;
              iterCacheWrite += usage?.cache_creation_input_tokens ?? 0;
            } else if (event.type === "message_delta") {
              iterTokensOut += event.usage?.output_tokens ?? 0;
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

          // Acumular al turno (para chat_usage + metadata final del trace)
          tokensIn += iterTokensIn;
          tokensOut += iterTokensOut;
          cacheReadTokens += iterCacheRead;
          cacheWriteTokens += iterCacheWrite;

          // Generation: anthropic_call (AUT-272 + costos Langfuse)
          // Langfuse calcula costos SOLO sobre observations tipo GENERATION con
          // el campo `model` matcheando su tabla de pricing. Spans no cuentan.
          trace?.generation({
            name: "anthropic_call",
            model: modelId,
            input: runMessages,
            output: accumulatedText || toolUseBlocks.map((t) => ({ type: "tool_use", name: t.name })),
            usage: {
              input: iterTokensIn,
              output: iterTokensOut,
              unit: "TOKENS",
            },
            usageDetails: {
              input: iterTokensIn,
              output: iterTokensOut,
              cache_read_input_tokens: iterCacheRead,
              cache_creation_input_tokens: iterCacheWrite,
            },
            metadata: {
              iteration: iteraciones,
              latencyMs: Date.now() - anthropicSpanStart,
              cached: iterCacheRead > 0,
              toolsRequested: toolUseBlocks.length,
            },
          });

          // Sin tool calls → respuesta final
          if (toolUseBlocks.length === 0) {
            // Guardar texto final para writeCache (AUT-265)
            finalResponse = accumulatedText;
            // Parsear bloques ```artifact del texto acumulado
            const artifactRe = /```artifact\s*\n([\s\S]*?)\n```/g;
            let match: RegExpExecArray | null;
            while ((match = artifactRe.exec(accumulatedText)) !== null) {
              try {
                const parsed = JSON.parse(match[1].trim());
                if (parsed && typeof parsed === "object" && parsed.type) {
                  hadArtifact = true;
                  if (finalArtifact === null) finalArtifact = parsed;
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
            if (tb.name === "registrar_pesaje" || tb.name === "registrar_parto") {
              hadWrite = true;
            }
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(tb.input || "{}"); } catch { args = {}; }

            sendEvent({ type: "tool_use", tool: tb.name, input: args });

            // AUT-275 — capturamos errores "naturales" (ej. tabla sistema bloqueada
            // en query-db.ts) y los convertimos en tool_result natural para que
            // el LLM los reciba como texto, no como 500.
            const toolSpanStart = Date.now();
            let result: unknown;
            try {
              // AUT-277 — reportar_feedback requiere contexto del request (email, predio)
              // que no viaja a ejecutarTool, por eso se maneja inline aquí.
              if (tb.name === "reportar_feedback") {
                result = await ejecutarReportarFeedback(args as unknown as FeedbackArgs, {
                  email: session.user.email,
                  nombre: session.user.nombre,
                  predioNombre: nombrePredio ?? `Predio ${predioId}`,
                });
              } else {
                result = await ejecutarTool(tb.name, args, prediosPermitidos, Number(userId), rolRank);
              }
            } catch (toolErr) {
              const msg = toolErr instanceof Error ? toolErr.message : String(toolErr);
              result = { error: msg };
            }

            if (result && typeof result === "object" && (result as Record<string, unknown>).code === "FORBIDDEN") {
              const prediosNombresList = Array.from(prediosNombres.values());
              result = {
                mensaje: `Predio fuera de tu alcance. Accesibles: ${prediosNombresList.join(", ") || "ninguno"}.`,
              };
            }

            // Span: tool_call (AUT-272) — 1 span por tool ejecutada
            trace?.span({
              name: `tool:${tb.name}`,
              input: args,
              output: result as Record<string, unknown>,
              metadata: { latencyMs: Date.now() - toolSpanStart, toolId: tb.id },
            });

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

        // Span: sse_emit (AUT-272) — cierre del turno
        trace?.span({
          name: "sse_emit",
          input: { toolCallsCount, hadArtifact, hadWrite },
          output: { finalResponseLength: finalResponse?.length ?? 0, error: trackingError },
          metadata: { latencyMs, tokensIn, tokensOut, cacheReadTokens, cacheWriteTokens },
        });

        // Cerrar trace Langfuse con output final
        if (trace) {
          trace.update({
            output: finalResponse?.slice(0, 500) ?? trackingError ?? "",
            metadata: { latencyMs, tokensIn, tokensOut, toolCallsCount, tier, modelId, cached: cacheReadTokens > 0 },
          });
        }

        try {
          await writeChatUsage({
            orgId,
            userId: Number(userId),
            predioId,
            modelId,
            tier,
            tokensIn,
            tokensOut,
            cacheReadTokens,
            cacheWriteTokens,
            toolCalls: toolCallsCount,
            hadArtifact,
            latencyMs,
            error: trackingError,
          });
        } catch (trackErr) {
          console.warn("[chat] tracking write failed:", trackErr instanceof Error ? trackErr.message : trackErr);
        }

        // Query cache write (AUT-265) — sólo si hubo respuesta final exitosa,
        // no fue bypass, no hay webSearch, no tool de escritura, no error.
        if (
          !cacheBypass &&
          !webSearch &&
          !hadWrite &&
          !trackingError &&
          finalResponse
        ) {
          try {
            await writeCache(
              predioId,
              Number(userId),
              lastMessage,
              finalResponse,
              finalArtifact,
              modelId,
              tokensIn + tokensOut,
            );
          } catch (cacheErr) {
            console.warn("[cache] writeCache failed:", cacheErr instanceof Error ? cacheErr.message : cacheErr);
          }
        }

        // Langfuse flush (AUT-272) — enviar todos los eventos al servidor Langfuse
        try {
          await langfuse?.flushAsync();
        } catch (lfErr) {
          console.warn("[langfuse] flush failed:", lfErr instanceof Error ? lfErr.message : lfErr);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...rlHeaders,
    },
  });
}
