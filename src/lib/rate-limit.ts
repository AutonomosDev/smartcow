/**
 * src/lib/rate-limit.ts — Rate limit in-memory por userId.
 * Ticket: AUT-274
 *
 * Map<userId, { count, resetAt }> con cleanup pasivo.
 * MVP: in-memory (un container en Hostinger). Si escala a múltiples
 * instancias → migrar a Upstash/Redis.
 *
 * Uso:
 *   const rl = checkRateLimit(userId);
 *   if (!rl.allowed) return 429 con Retry-After: Math.ceil(rl.resetIn/1000)
 *   // headers informativos en respuestas exitosas:
 *   X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string | number, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetIn: number; // ms hasta reset
  resetAt: number; // epoch ms
};

/**
 * Chequea y consume 1 request del bucket del userId.
 * - Si bucket no existe o expiró → crea/reinicia (count=1, resetAt=now+windowMs)
 * - Si existe y count < limit → incrementa
 * - Si existe y count >= limit → denegado
 */
export function checkRateLimit(
  userId: string | number,
  limit = 20,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(userId);

  // Cleanup pasivo: bucket expirado → reiniciar
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(userId, { count: 1, resetAt });
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetIn: windowMs,
      resetAt,
    };
  }

  // Bucket activo
  if (existing.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetIn: Math.max(0, existing.resetAt - now),
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    limit,
    remaining: limit - existing.count,
    resetIn: Math.max(0, existing.resetAt - now),
    resetAt: existing.resetAt,
  };
}

/**
 * Headers informativos X-RateLimit-* para respuestas exitosas.
 * `resetAt` está en ms → exponemos en segundos epoch (convención HTTP).
 */
export function rateLimitHeaders(rl: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(rl.limit),
    "X-RateLimit-Remaining": String(rl.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)),
  };
}

/**
 * Solo para tests: limpia todos los buckets.
 */
export function __resetRateLimitBuckets(): void {
  buckets.clear();
}
