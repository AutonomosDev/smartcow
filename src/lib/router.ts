/**
 * router.ts — Heurística de routing de modelos LLM (AUT-262, AUT-287).
 * Fuente de verdad: .claude/references/config/llm-routing-and-budget.yaml
 *
 * Simplificado a 2 tiers (AUT-287): opus/heavy removido — sonnet es techo.
 * Tier por debajo del LLM: intercept (L1/L2/L3) — ver src/lib/intent/.
 */

export type TierName = "light" | "standard";

export interface ModelConfig {
  modelId: string;
  tier: TierName;
  costPerMtokIn: number;
  costPerMtokOut: number;
  cacheWritePerMtok: number;
  cacheReadPerMtok: number;
}

// Precios: .claude/references/config/llm-routing-and-budget.yaml § models
export const MODELS: Record<TierName, ModelConfig> = {
  light: {
    modelId: "claude-haiku-4-5",
    tier: "light",
    costPerMtokIn: 1.00,
    costPerMtokOut: 5.00,
    cacheWritePerMtok: 1.25,
    cacheReadPerMtok: 0.10,
  },
  standard: {
    modelId: "claude-sonnet-4-6",
    tier: "standard",
    costPerMtokIn: 3.00,
    costPerMtokOut: 15.00,
    cacheWritePerMtok: 3.75,
    cacheReadPerMtok: 0.30,
  },
};

interface PickModelInput {
  lastMessage: string;
  webSearchActive?: boolean;
  prediosEnScope?: number;
  toolCallsPrevistos?: number;
}

export interface PickedModel {
  tier: TierName;
  modelId: string;
  reason: string;
  costPerMtokIn: number;
  costPerMtokOut: number;
  cacheWritePerMtok: number;
  cacheReadPerMtok: number;
}

// Light: conversación corta, saludos, confirmaciones, follow-ups sin tool.
// Se amplió en AUT-287 para capturar ~20% del tráfico conversacional
// que hoy cae a sonnet sin necesidad (ver análisis Langfuse 2026-04-21).
const LIGHT_REGEX = /^(hola|hey|buenas|gracias|ok|okay|sí|si|no|dale|perfecto|listo|bien|genial|alo|donde|cuantos?|que|como|cual|sigue|arranca|procede|continua|mientes|por\s+que|👍|👌)\b/i;

const TOOL_HINT_REGEX = /\b(animales?|pesajes?|partos?|lotes?|predios?|gdp|preñez|tratamientos?|vacunaci|ventas?|ecograf|inseminaci|bajas?|mortalidad|potreros?|grafic|dashboard|informe|resumen|análisis|analisis|tendencia|comparar|evolución|histórico)\b/i;

export function pickModel(input: PickModelInput): PickedModel {
  // Override temporal via env — usado mientras se testea infra.
  // Valores: light | standard. Prioridad sobre toda heurística.
  const forced = process.env.CHAT_FORCE_TIER as TierName | undefined;
  if (forced && forced in MODELS) {
    return { ...MODELS[forced], reason: `forced via CHAT_FORCE_TIER=${forced}` };
  }

  const { lastMessage, webSearchActive = false, toolCallsPrevistos = 0 } = input;
  const msg = lastMessage.trim();
  const msgLen = msg.length;

  // web_search o multi-tool previstos → sonnet
  if (webSearchActive || toolCallsPrevistos > 2) {
    return { ...MODELS.standard, reason: webSearchActive ? "web_search activo" : "multi-tool" };
  }

  // Hints de dominio que requieren tools/SQL → sonnet
  if (TOOL_HINT_REGEX.test(msg)) {
    return { ...MODELS.standard, reason: "tool hint detected" };
  }

  // Conversación corta sin hint de dominio → haiku
  if (msgLen < 80 || LIGHT_REGEX.test(msg)) {
    return { ...MODELS.light, reason: "short/conversational" };
  }

  // fallback sonnet
  return { ...MODELS.standard, reason: "default" };
}

/**
 * Calcula el costo estimado en USD dado el tier y los tokens usados.
 * Incluye cache read/write pricing (AUT-263) — prompt caching activo en route.ts.
 */
export function calcCostUsd(
  tier: TierName,
  tokensIn: number,
  tokensOut: number,
  cacheReadTokens: number = 0,
  cacheWriteTokens: number = 0,
): number {
  const cfg = MODELS[tier];
  return (
    tokensIn * cfg.costPerMtokIn +
    tokensOut * cfg.costPerMtokOut +
    cacheReadTokens * cfg.cacheReadPerMtok +
    cacheWriteTokens * cfg.cacheWritePerMtok
  ) / 1_000_000;
}
