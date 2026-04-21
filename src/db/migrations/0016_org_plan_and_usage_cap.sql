-- Migration: 0016_org_plan_and_usage_cap
-- AUT-264: Budget enforcement por organización.
-- Agrega usage_cap_usd y normaliza plan a enum free|pro|enterprise.
-- Default seguro: plan=pro, cap=50 USD/mes. Ver .claude/references/config/llm-routing-and-budget.yaml § budget.
--> statement-breakpoint
ALTER TABLE "organizaciones"
  ADD COLUMN IF NOT EXISTS "usage_cap_usd" numeric(10, 2) DEFAULT '50.00' NOT NULL;
--> statement-breakpoint
-- Normalizar planes existentes hacia los permitidos (free|pro|enterprise).
-- "basic" legacy → "pro". Cualquier valor no reconocido → "pro".
UPDATE "organizaciones"
SET "plan" = 'pro'
WHERE "plan" NOT IN ('free', 'pro', 'enterprise');
--> statement-breakpoint
-- Enforce enum vía CHECK (compat con drizzle text-enum, sin crear tipo nuevo).
ALTER TABLE "organizaciones"
  DROP CONSTRAINT IF EXISTS "organizaciones_plan_check";
--> statement-breakpoint
ALTER TABLE "organizaciones"
  ADD CONSTRAINT "organizaciones_plan_check"
  CHECK ("plan" IN ('free', 'pro', 'enterprise'));
--> statement-breakpoint
-- Actualizar default del plan a 'pro' (antes 'basic').
ALTER TABLE "organizaciones"
  ALTER COLUMN "plan" SET DEFAULT 'pro';
