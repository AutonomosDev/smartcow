/**
 * gemini-loop.ts — Tool loop para org 99 (trial) via Gemini Flash-Lite 3.1 (AUT-290).
 *
 * Espejo del loop Anthropic en app/api/chat/route.ts pero usando @google/genai.
 * Emite el MISMO formato SSE (text_delta, tool_use, tool_result, artifact_block, done, error).
 *
 * - Modelo: gemini-3.1-flash-lite-preview
 * - Thinking: low (hardcoded)
 * - Tools: CATTLE_TOOLS (formato FunctionDeclaration nativo)
 * - Cost tracking: tier="trial" → calcCostUsd via router.ts MODELS.trial
 */

import type { Content, FunctionCall, GenerateContentResponse } from "@google/genai";
import type { LangfuseTraceClient } from "langfuse";
import { getGoogleAIClient, CATTLE_TOOLS, ejecutarTool } from "@/src/lib/claude";
import { MODELS } from "@/src/lib/router";
import type { SmartCowSession } from "@/src/lib/auth";

const MAX_TOOL_ITERATIONS = 8;

export interface GeminiLoopInput {
  session: SmartCowSession;
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  prediosPermitidos: number[];
  rolRank: number;
  webSearch: boolean;
  sendEvent: (data: Record<string, unknown>) => void;
  trace?: LangfuseTraceClient | null;
}

export interface GeminiLoopResult {
  finalResponse: string;
  finalArtifact: unknown | null;
  tokensIn: number;
  tokensOut: number;
  toolCallsCount: number;
  hadArtifact: boolean;
  hadWrite: boolean;
  modelId: string;
  iteraciones: number;
}

export const GEMINI_TRIAL_MODEL = MODELS.trial.modelId;

function toGeminiContents(
  msgs: Array<{ role: "user" | "assistant"; content: string }>,
): Content[] {
  return msgs.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

/**
 * Parsea bloques ```artifact del texto acumulado (mismo formato que Anthropic).
 */
function extractArtifacts(text: string): unknown[] {
  const re = /```artifact\s*\n([\s\S]*?)\n```/g;
  const out: unknown[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (parsed && typeof parsed === "object" && (parsed as { type?: unknown }).type) {
        out.push(parsed);
      }
    } catch {
      // JSON malformado — ignorar
    }
  }
  return out;
}

export async function runGeminiLoop(input: GeminiLoopInput): Promise<GeminiLoopResult> {
  const { session, systemPrompt, messages, prediosPermitidos, rolRank, webSearch, sendEvent, trace } = input;

  const ai = getGoogleAIClient();

  // Tools activas según toggle (web_search excluido por default).
  // Gemini SDK espera FunctionDeclaration[] dentro de { functionDeclarations: [...] }.
  const activeTools = webSearch
    ? CATTLE_TOOLS
    : CATTLE_TOOLS.filter((t) => t.name !== "web_search");

  // Historial acumulativo: usuario → modelo → usuario(functionResponse) → modelo …
  const runContents: Content[] = toGeminiContents(messages);

  let tokensIn = 0;
  let tokensOut = 0;
  let toolCallsCount = 0;
  let hadArtifact = false;
  let hadWrite = false;
  let finalResponse = "";
  let finalArtifact: unknown | null = null;
  let iteraciones = 0;

  while (iteraciones < MAX_TOOL_ITERATIONS) {
    iteraciones++;

    const iterStart = Date.now();
    const stream = await ai.models.generateContentStream({
      model: GEMINI_TRIAL_MODEL,
      contents: runContents,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: activeTools }],
        thinkingConfig: { thinkingBudget: 0 }, // "low" — sin thinking extra, minimiza latencia/costo
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });

    let accumulatedText = "";
    const functionCalls: FunctionCall[] = [];
    let lastChunk: GenerateContentResponse | null = null;

    for await (const chunk of stream) {
      lastChunk = chunk;

      // Texto: usar chunk.text (getter que concatena partes de texto).
      const chunkText = chunk.text ?? "";
      if (chunkText) {
        accumulatedText += chunkText;
        sendEvent({ type: "text_delta", delta: chunkText });
      }

      // Function calls: chunk.functionCalls es array de FunctionCall
      const calls = chunk.functionCalls;
      if (calls && calls.length > 0) {
        for (const fc of calls) {
          functionCalls.push(fc);
        }
      }
    }

    // Acumular tokens del último chunk (Gemini emite usageMetadata en el chunk final).
    const usage = lastChunk?.usageMetadata;
    const iterTokensIn = usage?.promptTokenCount ?? 0;
    const iterTokensOut = usage?.candidatesTokenCount ?? 0;
    const iterCachedTokens = usage?.cachedContentTokenCount ?? 0;
    tokensIn += iterTokensIn;
    tokensOut += iterTokensOut;

    // Generation: gemini_call (AUT-291) — 1 por iteración, paridad con Anthropic.
    // Langfuse no tiene pricing table para gemini-3.1-flash-lite-preview;
    // costos se calculan en writeChatUsage via MODELS.trial pricing.
    trace?.generation({
      name: "gemini_call",
      model: GEMINI_TRIAL_MODEL,
      input: runContents.slice(-3),
      output: accumulatedText || functionCalls.map((fc) => ({ type: "function_call", name: fc.name })),
      usage: {
        input: iterTokensIn,
        output: iterTokensOut,
        unit: "TOKENS",
      },
      usageDetails: {
        input: iterTokensIn,
        output: iterTokensOut,
        cached_content_token_count: iterCachedTokens,
      },
      metadata: {
        provider: "google",
        iteration: iteraciones,
        latencyMs: Date.now() - iterStart,
        cached: iterCachedTokens > 0,
        toolsRequested: functionCalls.length,
      },
    });

    // Sin function calls → respuesta final
    if (functionCalls.length === 0) {
      finalResponse = accumulatedText;
      const artifacts = extractArtifacts(accumulatedText);
      for (const art of artifacts) {
        hadArtifact = true;
        if (finalArtifact === null) finalArtifact = art;
        sendEvent({ type: "artifact_block", artifact: art });
      }
      sendEvent({ type: "done" });
      break;
    }

    // Agregar turno del modelo al historial: texto + functionCall parts
    const modelParts: Array<{ text?: string; functionCall?: FunctionCall }> = [];
    if (accumulatedText) modelParts.push({ text: accumulatedText });
    for (const fc of functionCalls) modelParts.push({ functionCall: fc });
    runContents.push({ role: "model", parts: modelParts });

    // Ejecutar cada function call y construir un turno user con functionResponses
    const responseParts: Array<{ functionResponse: { name: string; response: Record<string, unknown> } }> = [];

    for (const fc of functionCalls) {
      toolCallsCount++;
      const name = fc.name ?? "";
      const args = (fc.args ?? {}) as Record<string, unknown>;

      if (name === "registrar_pesaje" || name === "registrar_parto") {
        hadWrite = true;
      }

      sendEvent({ type: "tool_use", tool: name, input: args });

      const toolSpanStart = Date.now();
      let result: unknown;
      try {
        result = await ejecutarTool(name, args, prediosPermitidos, Number(session.user.id), rolRank);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result = { error: msg };
      }

      if (result && typeof result === "object" && (result as Record<string, unknown>).code === "FORBIDDEN") {
        result = { mensaje: "Predio fuera de tu alcance." };
      }

      // Span: tool:<name> (AUT-291) — paridad con path Anthropic.
      trace?.span({
        name: `tool:${name}`,
        input: args,
        output: result as Record<string, unknown>,
        metadata: { latencyMs: Date.now() - toolSpanStart, provider: "google" },
      });

      sendEvent({ type: "tool_result", tool: name, result });

      responseParts.push({
        functionResponse: {
          name,
          response: (result && typeof result === "object")
            ? (result as Record<string, unknown>)
            : { value: result },
        },
      });
    }

    runContents.push({ role: "user", parts: responseParts });
  }

  // Salimos por MAX_TOOL_ITERATIONS sin done
  if (iteraciones >= MAX_TOOL_ITERATIONS && !finalResponse) {
    sendEvent({ type: "done" });
  }

  return {
    finalResponse,
    finalArtifact,
    tokensIn,
    tokensOut,
    toolCallsCount,
    hadArtifact,
    hadWrite,
    modelId: GEMINI_TRIAL_MODEL,
    iteraciones,
  };
}
