/**
 * budget.ts — Enforcement de presupuesto mensual por organización (AUT-264).
 * Fuente de verdad: .claude/references/config/llm-routing-and-budget.yaml § budget + enforcement
 *
 * Planes (defaults):
 *   free:       $5/mes  — solo light
 *   pro:        $50/mes — light + standard
 *   enterprise: $500/mes — todos
 *
 * El cap real se lee de organizaciones.usage_cap_usd (override por org).
 * hard_block_at: 1.00 (100% del cap) → 402 antes de llamar Anthropic.
 * soft_alert_at: 0.85 → SSE budget_warn al 85%.
 */

import { db } from "@/src/db/client";
import { chatUsage } from "@/src/db/schema/chat_usage";
import { organizaciones } from "@/src/db/schema/organizaciones";
import { eq, and, gte, sum } from "drizzle-orm";
import { calcCostUsd, type TierName } from "./router";

export type PlanName = "free" | "pro" | "enterprise";

const PLAN_CAPS: Record<PlanName, number> = {
  free: 5,
  pro: 50,
  enterprise: 500,
};

const TIERS_BY_PLAN: Record<PlanName, TierName[]> = {
  free: ["light"],
  pro: ["light", "standard"],
  enterprise: ["light", "standard"],
};

const SOFT_ALERT_AT = 0.85;
const DEFAULT_PLAN: PlanName = "pro";

export interface BudgetStatus {
  ok: boolean;
  spent: number;
  cap: number;
  percent: number;
  plan: PlanName;
  warn: boolean;
  message?: string;
}

// Backwards compat con AUT-263 route.ts: { ok, message, usedUsd, capUsd }
export interface BudgetCheckResult {
  ok: boolean;
  message?: string;
  usedUsd?: number;
  capUsd?: number;
  status?: BudgetStatus;
}

/**
 * Suma cost_usd de chat_usage para la org en el mes calendario UTC actual.
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

function normalizePlan(raw: string | null | undefined): PlanName {
  if (raw === "free" || raw === "pro" || raw === "enterprise") return raw;
  return DEFAULT_PLAN;
}

/**
 * Retorna el tier más alto permitido por el plan.
 */
export function highestAllowedTier(plan: PlanName): TierName {
  const tiers = TIERS_BY_PLAN[plan];
  return tiers[tiers.length - 1];
}

/**
 * ¿Puede el plan usar el tier? (Para downgrade automático.)
 */
export function canUseTier(plan: PlanName, tier: TierName): boolean {
  return TIERS_BY_PLAN[plan].includes(tier);
}

/**
 * Verifica el budget MTD de la org contra el cap configurado.
 * No chequea tier (eso se resuelve por separado con canUseTier/highestAllowedTier).
 *
 * Sobrecarga para compat con route.ts existente (AUT-263): permite pasar tier
 * que se ignora para el cálculo de budget (el downgrade se maneja en route.ts).
 */
export async function checkBudget(orgId: number, _tier?: TierName): Promise<BudgetStatus & BudgetCheckResult> {
  try {
    const orgRows = await db
      .select({ plan: organizaciones.plan, capUsd: organizaciones.usageCapUsd })
      .from(organizaciones)
      .where(eq(organizaciones.id, orgId))
      .limit(1);

    const plan = normalizePlan(orgRows[0]?.plan);
    // Preferir cap específico de la org; fallback al default del plan.
    const orgCap = orgRows[0]?.capUsd != null ? Number(orgRows[0].capUsd) : NaN;
    const cap = Number.isFinite(orgCap) && orgCap > 0 ? orgCap : PLAN_CAPS[plan];

    const spent = await getUsageMTD(orgId);
    const percent = cap > 0 ? spent / cap : 0;
    const ok = spent < cap;
    const warn = percent >= SOFT_ALERT_AT;

    return {
      ok,
      spent,
      cap,
      percent,
      plan,
      warn,
      message: ok ? undefined : "Cuota del mes agotada. Contacta al admin.",
      // Compat AUT-263
      usedUsd: spent,
      capUsd: cap,
    };
  } catch (err) {
    // Tracking-first: no bloquear sin datos. Log y permitir.
    console.warn("[budget] checkBudget error — permitiendo request:", err instanceof Error ? err.message : err);
    return {
      ok: true,
      spent: 0,
      cap: PLAN_CAPS[DEFAULT_PLAN],
      percent: 0,
      plan: DEFAULT_PLAN,
      warn: false,
      usedUsd: 0,
      capUsd: PLAN_CAPS[DEFAULT_PLAN],
    };
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
 * Escribe una fila en chat_usage al final de cada request (AUT-263).
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
