/**
 * intent/ — Pre-LLM intent routing (AUT-287).
 *
 * Arquitectura en capas:
 *   L1 (exact)     — regex/substring contra variantes del catálogo  <10ms  $0
 *   L2 (semantic)  — pgvector cosine (futuro)                       <100ms $0
 *   L3 (classify)  — haiku tool_choice forzado (futuro)              <1s   $0.001
 *   L4 (sonnet)    — fallback con tools completas                   2-5s  $0.05
 *
 * Esta fase implementa solo L1 + delegación a L4.
 *
 * Export principal: tryIntercept(message, predioId) → resultado o null.
 * Si retorna null, el caller debe continuar con el flujo normal de sonnet.
 */

import { matchExactIntent } from "./exact";
import { QUICK_HANDLERS } from "./handlers";

export interface InterceptResult {
  layer: "L1" | "L2" | "L3";
  intentId: string;
  handlerCommand: string;
  label: string;
  data: unknown;
  artifact: unknown;
  latencyMs: number;
}

/**
 * Intenta resolver el mensaje sin llamar al LLM.
 * Retorna null si ninguna capa puede resolverlo — el caller debe usar sonnet.
 */
export async function tryIntercept(
  message: string,
  predioId: number,
): Promise<InterceptResult | null> {
  const startMs = Date.now();

  // L1 — exact/substring match
  const l1 = matchExactIntent(message);
  if (l1) {
    const handler = QUICK_HANDLERS[l1.intent.handler];
    if (!handler) {
      console.warn(
        `[intent] L1 match intent=${l1.intent.id} pero handler=${l1.intent.handler} no registrado`,
      );
      return null;
    }
    try {
      const out = await handler(predioId);
      return {
        layer: "L1",
        intentId: l1.intent.id,
        handlerCommand: l1.intent.handler,
        label: out.label,
        data: out.data,
        artifact: out.artifact,
        latencyMs: Date.now() - startMs,
      };
    } catch (err) {
      console.warn(
        `[intent] L1 handler ${l1.intent.handler} falló:`,
        err instanceof Error ? err.message : err,
      );
      return null;
    }
  }

  // L2/L3 — pendiente (v2)
  return null;
}

export { INTENTS } from "./catalog";
export { matchExactIntent } from "./exact";
export { QUICK_HANDLERS } from "./handlers";
