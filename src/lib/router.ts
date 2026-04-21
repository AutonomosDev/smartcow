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
}

// Precios: .claude/references/config/llm-routing-and-budget.yaml § models
export const MODELS: Record<TierName, ModelConfig> = {
  light: {
    modelId: "claude-haiku-4-5",
    tier: "light",
    costPerMtokIn: 1.00,
    costPerMtokOut: 5.00,
  },
  standard: {
    modelId: "claude-sonnet-4-6",
    tier: "standard",
    costPerMtokIn: 3.00,
    costPerMtokOut: 15.00,
  },
  heavy: {
    modelId: "claude-opus-4-7",
    tier: "heavy",
    costPerMtokIn: 5.00,
    costPerMtokOut: 25.00,
  },
};

interface PickModelInput {
  lastMessage: string;
  webSearchActive?: boolean;
  prediosEnScope?: number;
  toolCallsPrevistos?: number;
}

const HEAVY_REGEX = /(compara.*todos|histórico completo|últimos \d+ años|desde 20[12]\d)/i;
const LIGHT_REGEX = /^(hola|gracias|ok|sí|si|no|dale|perfecto|listo|bien)/i;

export function pickModel(input: PickModelInput): ModelConfig {
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
      return MODELS.heavy;
    }
    return MODELS.standard;
  }

  // heavy_triggers
  if (
    HEAVY_REGEX.test(lastMessage) ||
    prediosEnScope > 3 ||
    toolCallsPrevistos > 5
  ) {
    return MODELS.heavy;
  }

  // light_triggers
  if (
    msgLen < 30 ||
    LIGHT_REGEX.test(lastMessage.trim())
  ) {
    return MODELS.light;
  }

  // fallback
  return MODELS.standard;
}

/**
 * Calcula el costo estimado en USD dado el tier y los tokens usados.
 */
export function calcCostUsd(tier: TierName, tokensIn: number, tokensOut: number): number {
  const cfg = MODELS[tier];
  return (tokensIn * cfg.costPerMtokIn + tokensOut * cfg.costPerMtokOut) / 1_000_000;
}
