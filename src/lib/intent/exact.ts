/**
 * exact.ts — Capa 1 del router intent: matching exacto/substring (AUT-287).
 *
 * Compara el mensaje normalizado contra las variantes de cada intent.
 * Match = variante es substring del mensaje normalizado, o viceversa si
 * la variante es >= 80% del msg.
 *
 * Cost: 0 tokens. Latencia: <10ms (iteración sobre ~N*M strings).
 */

import { INTENTS, normalize, type IntentDefinition } from "./catalog";

export interface IntentMatch {
  layer: "L1";
  intent: IntentDefinition;
  variant: string;
  score: 1.0;
}

/**
 * Intenta match exacto del mensaje contra las variantes del catálogo.
 * Retorna el primer match o null.
 */
export function matchExactIntent(message: string): IntentMatch | null {
  const norm = normalize(message);
  if (norm.length < 3) return null;

  for (const intent of INTENTS) {
    for (const variante of intent.variantes) {
      const vn = normalize(variante);
      if (!vn) continue;

      // Match 1: variante es substring del mensaje
      if (norm.includes(vn)) {
        return { layer: "L1", intent, variant: variante, score: 1.0 };
      }

      // Match 2: mensaje es substring corto de variante (usuario escribe menos)
      if (norm.length >= 8 && vn.includes(norm) && norm.length / vn.length >= 0.6) {
        return { layer: "L1", intent, variant: variante, score: 1.0 };
      }
    }
  }

  return null;
}
