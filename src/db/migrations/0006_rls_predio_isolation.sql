-- Migration: 0006_rls_predio_isolation
-- Implements PostgreSQL Row Level Security (RLS) for multi-tenant predio isolation.
-- Context var: app.current_predio (integer) — set per request via withPredioContext().
-- Superadmin bypass: when app.current_predio is not set, RLS is bypassed (returns true).
-- This is intentional — system-level queries (ETL, migrations) run without isolation.
-- Application layer (withAuth) enforces access BEFORE DB queries. RLS is a second layer.

-- ────────────────────────────────────────────────────────────
-- animales
-- ────────────────────────────────────────────────────────────
ALTER TABLE "animales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "animales" FORCE ROW LEVEL SECURITY;

CREATE POLICY "predio_isolation" ON "animales"
  USING (
    current_setting('app.current_predio', true) IS NULL
    OR current_setting('app.current_predio', true) = ''
    OR predio_id = current_setting('app.current_predio', true)::integer
  );

-- ────────────────────────────────────────────────────────────
-- lotes
-- ────────────────────────────────────────────────────────────
ALTER TABLE "lotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lotes" FORCE ROW LEVEL SECURITY;

CREATE POLICY "predio_isolation" ON "lotes"
  USING (
    current_setting('app.current_predio', true) IS NULL
    OR current_setting('app.current_predio', true) = ''
    OR predio_id = current_setting('app.current_predio', true)::integer
  );

-- ────────────────────────────────────────────────────────────
-- pesajes
-- ────────────────────────────────────────────────────────────
ALTER TABLE "pesajes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pesajes" FORCE ROW LEVEL SECURITY;

CREATE POLICY "predio_isolation" ON "pesajes"
  USING (
    current_setting('app.current_predio', true) IS NULL
    OR current_setting('app.current_predio', true) = ''
    OR predio_id = current_setting('app.current_predio', true)::integer
  );

-- ────────────────────────────────────────────────────────────
-- partos
-- ────────────────────────────────────────────────────────────
ALTER TABLE "partos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "partos" FORCE ROW LEVEL SECURITY;

CREATE POLICY "predio_isolation" ON "partos"
  USING (
    current_setting('app.current_predio', true) IS NULL
    OR current_setting('app.current_predio', true) = ''
    OR predio_id = current_setting('app.current_predio', true)::integer
  );

-- ────────────────────────────────────────────────────────────
-- inseminaciones
-- ────────────────────────────────────────────────────────────
ALTER TABLE "inseminaciones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inseminaciones" FORCE ROW LEVEL SECURITY;

CREATE POLICY "predio_isolation" ON "inseminaciones"
  USING (
    current_setting('app.current_predio', true) IS NULL
    OR current_setting('app.current_predio', true) = ''
    OR predio_id = current_setting('app.current_predio', true)::integer
  );

-- ────────────────────────────────────────────────────────────
-- ecografias
-- ────────────────────────────────────────────────────────────
ALTER TABLE "ecografias" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ecografias" FORCE ROW LEVEL SECURITY;

CREATE POLICY "predio_isolation" ON "ecografias"
  USING (
    current_setting('app.current_predio', true) IS NULL
    OR current_setting('app.current_predio', true) = ''
    OR predio_id = current_setting('app.current_predio', true)::integer
  );

-- ────────────────────────────────────────────────────────────
-- areteos
-- ────────────────────────────────────────────────────────────
ALTER TABLE "areteos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "areteos" FORCE ROW LEVEL SECURITY;

CREATE POLICY "predio_isolation" ON "areteos"
  USING (
    current_setting('app.current_predio', true) IS NULL
    OR current_setting('app.current_predio', true) = ''
    OR predio_id = current_setting('app.current_predio', true)::integer
  );

-- ────────────────────────────────────────────────────────────
-- bajas
-- ────────────────────────────────────────────────────────────
ALTER TABLE "bajas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bajas" FORCE ROW LEVEL SECURITY;

CREATE POLICY "predio_isolation" ON "bajas"
  USING (
    current_setting('app.current_predio', true) IS NULL
    OR current_setting('app.current_predio', true) = ''
    OR predio_id = current_setting('app.current_predio', true)::integer
  );

-- ────────────────────────────────────────────────────────────
-- medieros
-- ────────────────────────────────────────────────────────────
ALTER TABLE "medieros" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "medieros" FORCE ROW LEVEL SECURITY;

CREATE POLICY "predio_isolation" ON "medieros"
  USING (
    current_setting('app.current_predio', true) IS NULL
    OR current_setting('app.current_predio', true) = ''
    OR predio_id = current_setting('app.current_predio', true)::integer
  );

-- ────────────────────────────────────────────────────────────
-- potreros
-- ────────────────────────────────────────────────────────────
ALTER TABLE "potreros" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "potreros" FORCE ROW LEVEL SECURITY;

CREATE POLICY "predio_isolation" ON "potreros"
  USING (
    current_setting('app.current_predio', true) IS NULL
    OR current_setting('app.current_predio', true) = ''
    OR predio_id = current_setting('app.current_predio', true)::integer
  );

-- ────────────────────────────────────────────────────────────
-- movimientos_potrero
-- ────────────────────────────────────────────────────────────
ALTER TABLE "movimientos_potrero" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "movimientos_potrero" FORCE ROW LEVEL SECURITY;

CREATE POLICY "predio_isolation" ON "movimientos_potrero"
  USING (
    current_setting('app.current_predio', true) IS NULL
    OR current_setting('app.current_predio', true) = ''
    OR predio_id = current_setting('app.current_predio', true)::integer
  );

-- ────────────────────────────────────────────────────────────
-- kb_documents
-- ────────────────────────────────────────────────────────────
ALTER TABLE "kb_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "kb_documents" FORCE ROW LEVEL SECURITY;

CREATE POLICY "predio_isolation" ON "kb_documents"
  USING (
    current_setting('app.current_predio', true) IS NULL
    OR current_setting('app.current_predio', true) = ''
    OR predio_id = current_setting('app.current_predio', true)::integer
  );

-- ────────────────────────────────────────────────────────────
-- semen (catálogo scoped por predio)
-- ────────────────────────────────────────────────────────────
ALTER TABLE "semen" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "semen" FORCE ROW LEVEL SECURITY;

CREATE POLICY "predio_isolation" ON "semen"
  USING (
    current_setting('app.current_predio', true) IS NULL
    OR current_setting('app.current_predio', true) = ''
    OR predio_id = current_setting('app.current_predio', true)::integer
  );

-- ────────────────────────────────────────────────────────────
-- inseminadores (catálogo scoped por predio)
-- ────────────────────────────────────────────────────────────
ALTER TABLE "inseminadores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inseminadores" FORCE ROW LEVEL SECURITY;

CREATE POLICY "predio_isolation" ON "inseminadores"
  USING (
    current_setting('app.current_predio', true) IS NULL
    OR current_setting('app.current_predio', true) = ''
    OR predio_id = current_setting('app.current_predio', true)::integer
  );

-- ────────────────────────────────────────────────────────────
-- Grant SELECT/INSERT/UPDATE/DELETE to the app role (postgres default)
-- RLS applies to all roles except table owner. The app uses the default
-- postgres user (DATABASE_URL owner), so we must bypass for owner
-- OR grant privileges to a restricted role. For now, bypass owner check
-- by explicitly granting to PUBLIC (policy handles the filtering).
-- In prod, create a dedicated app role with BYPASSRLS=false.
-- ────────────────────────────────────────────────────────────
-- No explicit grants needed — policy applies to non-superuser connections.
-- Drizzle uses the DATABASE_URL user which owns the tables,
-- so FORCE ROW LEVEL SECURITY above is REQUIRED to enforce RLS on owners.
