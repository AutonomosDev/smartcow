/**
 * llm-routing.ts — Routing de provider por email (AUT-290).
 *
 * JP + Cesar          → Anthropic (claude-sonnet-4-6 / haiku vía router.ts)
 * Resto (org 99)      → Google (gemini-3.1-flash-lite-preview)
 *
 * Ver .claude/references/config/llm-routing-and-budget.yaml § trial_routing
 */

export type ChatProvider = "anthropic" | "google";

export const SONNET_ALLOWLIST: ReadonlySet<string> = new Set([
  "cesar@autonomos.dev",
  "jpferrada@sevillainversiones.cl",
]);

export const TRIAL_ORG_ID = 99;

export interface PickProviderInput {
  email: string;
  orgId: number;
}

export interface PickedProvider {
  provider: ChatProvider;
  reason: string;
}

/**
 * Decide qué provider usar para este turno.
 *
 * - Allowlist (JP/Cesar) → siempre anthropic (full features).
 * - Org 99 (demo/trial)  → google (flash-lite barato, solo texto).
 * - Resto                → anthropic (comportamiento legacy).
 */
export function pickProvider(input: PickProviderInput): PickedProvider {
  const email = input.email.toLowerCase().trim();

  if (SONNET_ALLOWLIST.has(email)) {
    return { provider: "anthropic", reason: "sonnet_allowlist" };
  }

  if (input.orgId === TRIAL_ORG_ID) {
    return { provider: "google", reason: "trial_org_99" };
  }

  return { provider: "anthropic", reason: "default" };
}
