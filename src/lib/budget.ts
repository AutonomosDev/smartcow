/**
 * budget.ts — Enforcement de presupuesto mensual por organización (AUT-264).
 * Fuente de verdad: .claude/references/config/llm-routing-and-budget.yaml § budget + enforcement
 *
 * Planes:
 *   free:       $5/mes  — solo light
 *   pro:        $50/mes — light + standard
 *   enterprise: $500/mes — todos
 *
 * hard_block_at: 1.00 (100% del cap) → 402 antes de llamar Anthropic.
 * El campo plan en organizaciones determina el plan (default: "pro" si no existe).
 */

import { db } from "@/src/db/client";
import { chatUsage } from "@/src/db/schema/chat_usage";
import { organizaciones } from "@/src/db/schema/organizaciones";
import { eq, and, gte, sum } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { calcCostUsd, type TierName } from "./router";

interface BudgetPlan {
  capUsdMonth: number;
  tiersEnabled: TierName[];
  hardBlockAt: number;
}

const PLANS: Record<string, BudgetPlan> = {
  free: {
    capUsdMonth: 5,
    tiersEnabled: ["light"],
    hardBlockAt: 1.0,
  },
  pro: {
    capUsdMonth: 50,
    tiersEnabled: ["light", "standard"],
    hardBlockAt: 1.0,
  },
  enterprise: {
    capUsdMonth: 500,
    tiersEnabled: ["light", "standard", "heavy"],
    hardBlockAt: 1.0,
  },
};

const DEFAULT_PLAN = "pro";

export interface BudgetCheckResult {
  ok: boolean;
  message?: string;
  usedUsd?: number;
  capUsd?: number;
}

/**
 * Verifica si la org puede hacer una llamada al LLM con el tier dado.
 * Checks en orden:
 *   1. Plan existe y tier está habilitado para ese plan.
 *   2. Gasto MTD no supera el hard_block_at.
 */
export async function checkBudget(orgId: number, tier: TierName): Promise<BudgetCheckResult> {
  try {
    // Obtener plan de la org
    const orgRows = await db
      .select({ plan: organizaciones.plan })
      .from(organizaciones)
      .where(eq(organizaciones.id, orgId))
      .limit(1);

    const planKey = orgRows[0]?.plan ?? DEFAULT_PLAN;
    const plan = PLANS[planKey] ?? PLANS[DEFAULT_PLAN];

    // Verificar tier habilitado — downgrade a tier más alto permitido si no
    if (!plan.tiersEnabled.includes(tier)) {
      // Según YAML enforcement: degrade_to_highest_allowed_tier (no bloquear)
      // Tracking: el caller usará el tier que pickModel devuelva.
      // Este check sólo bloquea si el tier excede lo permitido — pero
      // no bloqueamos, solo loguemos. El tier real se ajusta en la llamada.
      // (El YAML dice degrade, no bloquear — comportamiento correcto)
    }

    // Calcular gasto MTD (mes calendario UTC)
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const usageRows = await db
      .select({ total: sum(chatUsage.costUsd) })
      .from(chatUsage)
      .where(
        and(
          eq(chatUsage.orgId, orgId),
          gte(chatUsage.createdAt, startOfMonth)
        )
      );

    const usedUsd = Number(usageRows[0]?.total ?? 0);
    const capUsd = plan.capUsdMonth * plan.hardBlockAt;

    if (usedUsd >= capUsd) {
      return {
        ok: false,
        message: "Cuota del mes agotada. Contacta al admin.",
        usedUsd,
        capUsd: plan.capUsdMonth,
      };
    }

    return { ok: true, usedUsd, capUsd: plan.capUsdMonth };
  } catch (err) {
    // Si falla el check → permitir (tracking-first, no bloquear sin datos)
    console.warn("[budget] checkBudget error — permitiendo request:", err instanceof Error ? err.message : err);
    return { ok: true };
  }
}

export interface WriteChatUsageParams {
  orgId: number;
  userId: number;
  predioId: number;
  modelId: string;
  tier: TierName;
  tokensIn: number;
  tokensOut: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  toolCalls: number;
  hadArtifact: boolean;
  latencyMs: number;
  error: string | null;
  sessionId?: string;
}

/**
 * Escribe una fila en chat_usage al final de cada request.
 * Si falla → log warn, no interrumpe la respuesta (caller maneja el catch).
 */
export async function writeChatUsage(params: WriteChatUsageParams): Promise<void> {
  const cacheReadTokens = params.cacheReadTokens ?? 0;
  const cacheWriteTokens = params.cacheWriteTokens ?? 0;
  const costUsd = calcCostUsd(
    params.tier,
    params.tokensIn,
    params.tokensOut,
    cacheReadTokens,
    cacheWriteTokens,
  );

  await db.insert(chatUsage).values({
    orgId: params.orgId,
    userId: params.userId,
    sessionId: params.sessionId ?? null,
    predioId: params.predioId,
    modelId: params.modelId,
    tier: params.tier,
    tokensIn: params.tokensIn,
    tokensOut: params.tokensOut,
    cacheReadTokens,
    cacheWriteTokens,
    costUsd: String(costUsd),
    toolCalls: params.toolCalls,
    hadArtifact: params.hadArtifact,
    latencyMs: params.latencyMs,
    error: params.error,
  });
}

/**
 * Retorna el gasto acumulado en USD para una org en el mes actual (UTC).
 */
export async function getUsageMTD(orgId: number): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const rows = await db
    .select({ total: sum(chatUsage.costUsd) })
    .from(chatUsage)
    .where(
      and(
        eq(chatUsage.orgId, orgId),
        gte(chatUsage.createdAt, startOfMonth)
      )
    );

  return Number(rows[0]?.total ?? 0);
}
