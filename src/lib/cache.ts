/**
 * cache.ts — Query caching del chat ganadero (AUT-265).
 * Fuente de verdad: .claude/references/config/llm-routing-and-budget.yaml
 *
 * Estrategia:
 *   - Hash sha256 sobre (predio_id, pregunta normalizada).
 *   - TTL dinámico según tipo de query:
 *       count/total → 15 min (datos cambian seguido)
 *       chart/distribución/ranking/gdp → 30 min
 *       listar → 60 min
 *       otros → 15 min (conservador)
 *   - tryCache antes del LLM, writeCache después (sólo si no hay tool de escritura).
 *   - invalidatePredio al final de registrar_pesaje/registrar_parto.
 *   - Bypass vía header X-Cache-Bypass: 1.
 */

import crypto from "crypto";
import { db } from "@/src/db/client";
import { chatCache } from "@/src/db/schema/chat-cache";
import { and, eq, gt, desc, sql } from "drizzle-orm";

export interface CacheHit {
  response: string;
  artifact: unknown | null;
  modelUsed: string;
  cachedAt: Date;
  hits: number;
}

export function normalizeQuestion(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[¿?.,;:!¡]/g, "")
    .replace(/\s+/g, " ");
}

export function cacheKey(predioId: number | null, normalized: string): string {
  return crypto
    .createHash("sha256")
    .update(`${predioId ?? "null"}::${normalized}`)
    .digest("hex");
}

export function ttlMinutesForQuestion(normalized: string): number {
  if (/(cuánto|cuanto|cuánta|cuanta|cuántos|cuantos|total|count|suma)/.test(normalized)) return 15;
  if (/(listar|todos los|mis |listá|lista)/.test(normalized)) return 60;
  if (/(gdp|distribución|distribucion|compar|promedio|ranking|histograma)/.test(normalized)) return 30;
  return 15;
}

/**
 * Busca una respuesta cacheada válida (no expirada) para la pregunta.
 * Si hay hit, incrementa el contador de hits y retorna la respuesta.
 */
export async function tryCache(
  predioId: number | null,
  userId: number,
  question: string
): Promise<CacheHit | null> {
  try {
    const normalized = normalizeQuestion(question);
    if (!normalized) return null;
    const hash = cacheKey(predioId, normalized);

    const rows = await db
      .select()
      .from(chatCache)
      .where(and(eq(chatCache.questionHash, hash), gt(chatCache.expiresAt, new Date())))
      .orderBy(desc(chatCache.createdAt))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    // Fire-and-forget: incrementar hits sin bloquear
    await db
      .update(chatCache)
      .set({ hits: sql`${chatCache.hits} + 1` })
      .where(eq(chatCache.id, row.id))
      .catch((err) => console.warn("[cache] increment hits failed:", err));

    return {
      response: row.responseText,
      artifact: row.artifactJson ?? null,
      modelUsed: row.modelUsed,
      cachedAt: row.createdAt,
      hits: (row.hits ?? 0) + 1,
    };
  } catch (err) {
    console.warn("[cache] tryCache error:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Guarda una nueva entrada de caché con TTL según tipo de pregunta.
 * No bloquea el caller: errores se loguean como warn.
 */
export async function writeCache(
  predioId: number | null,
  userId: number,
  question: string,
  response: string,
  artifact: unknown | null,
  modelUsed: string,
  tokensEstimate: number
): Promise<void> {
  try {
    const normalized = normalizeQuestion(question);
    if (!normalized || !response) return;
    const hash = cacheKey(predioId, normalized);
    const ttlMin = ttlMinutesForQuestion(normalized);
    const expiresAt = new Date(Date.now() + ttlMin * 60_000);

    await db.insert(chatCache).values({
      predioId: predioId ?? null,
      userId,
      questionHash: hash,
      questionText: question,
      responseText: response,
      artifactJson: artifact as unknown as NewArtifactJson,
      modelUsed,
      tokensSavedEstimate: tokensEstimate > 0 ? tokensEstimate : 0,
      hits: 1,
      expiresAt,
    });
  } catch (err) {
    console.warn("[cache] writeCache error:", err instanceof Error ? err.message : err);
  }
}

// Type helper para el campo jsonb (drizzle infiere unknown).
type NewArtifactJson = typeof chatCache.$inferInsert["artifactJson"];

/**
 * Invalidación on write: borra todas las entradas del caché asociadas al predio.
 * Se llama al final de tools de escritura (registrar_pesaje, registrar_parto).
 */
export async function invalidatePredio(predioId: number): Promise<void> {
  try {
    await db.delete(chatCache).where(eq(chatCache.predioId, predioId));
  } catch (err) {
    console.warn("[cache] invalidatePredio error:", err instanceof Error ? err.message : err);
  }
}
