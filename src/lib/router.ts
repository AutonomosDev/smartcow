/**
 * router.ts — Heurística de routing de modelos LLM (AUT-262).
 * Fuente de verdad: .claude/references/config/llm-routing-and-budget.yaml
 *
 * Orden de evaluación: heavy_triggers → light_triggers → fallback (standard).
 * Nunca downgrade manual; upgrade = automático por heurística.
 */

export type TierName = "light" | "standard" | "heavy";

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
  heavy: {
    modelId: "claude-opus-4-7",
    tier: "heavy",
    costPerMtokIn: 5.00,
    costPerMtokOut: 25.00,
    cacheWritePerMtok: 6.25,
    cacheReadPerMtok: 0.50,
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

// Heavy: análisis profundo, multi-predio, históricos largos, informes completos.
// Triggers realistas observados en el uso: "dashboard completo", "informe/resumen general",
// "evolución histórica", "comparativa entre todos los predios/lotes", "últimos N años/meses",
// "correlación", "proyección", "análisis completo".
const HEAVY_REGEX = new RegExp(
  [
    "compara.*(todos|entre\\s+(predios|lotes|razas|fundos))",
    "(informe|resumen|análisis|analisis|dashboard)\\s+(completo|general|integral|profundo)",
    "evoluci[oó]n\\s+(hist[oó]rica|completa|de\\s+los\\s+últimos)",
    "hist[oó]rico\\s+completo",
    "últimos?\\s+\\d+\\s+(años|meses|trimestres)",
    "desde\\s+20[12]\\d",
    "(correlaci[oó]n|tendencia\\s+a\\s+largo|proyecci[oó]n|forecast)",
    "análisis\\s+multi(-|\\s)?(predio|fundo|lote)",
  ].join("|"),
  "i"
);
const LIGHT_REGEX = /^(hola|hey|buenas|gracias|ok|okay|sí|si|no|dale|perfecto|listo|bien|genial|👍|👌)\b/i;

export function pickModel(input: PickModelInput): PickedModel {
  // Override temporal via env — usado mientras se testea infra.
  // Valores: light | standard | heavy. Prioridad sobre toda heurística.
  const forced = process.env.CHAT_FORCE_TIER as TierName | undefined;
  if (forced && forced in MODELS) {
    return { ...MODELS[forced], reason: `forced via CHAT_FORCE_TIER=${forced}` };
  }

  const { lastMessage, webSearchActive = false, prediosEnScope = 1, toolCallsPrevistos = 0 } = input;
  const msgLen = lastMessage.trim().length;

  // web_search activo → standard mínimo (tool use complejo)
  if (webSearchActive) {
    // puede ser heavy si también cumple heavy_triggers
    if (
      HEAVY_REGEX.test(lastMessage) ||
      prediosEnScope > 3 ||
      toolCallsPrevistos > 5
    ) {
      return { ...MODELS.heavy, reason: "web_search + multi-predio/histórico" };
    }
    return { ...MODELS.standard, reason: "web_search activo" };
  }

  // heavy_triggers
  if (
    HEAVY_REGEX.test(lastMessage) ||
    prediosEnScope > 3 ||
    toolCallsPrevistos > 5
  ) {
    return { ...MODELS.heavy, reason: "multi-predio/histórico" };
  }

  // light_triggers
  if (
    msgLen < 30 ||
    LIGHT_REGEX.test(lastMessage.trim())
  ) {
    return { ...MODELS.light, reason: "saludo/short" };
  }

  // fallback
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
