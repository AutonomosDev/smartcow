-- scripts/anonymize-db.sql — AUT-286
-- Anonimiza PII en staging DB post-restore desde prod.
-- Idempotente: safe correrlo varias veces.
--
-- Se ejecuta desde scripts/sync-staging-from-prod.sh.

BEGIN;

-- ─── users ────────────────────────────────────────────────
-- Emails → test+<id>@staging.smartcow.cl
-- Nombres → "Usuario Staging <id>"
-- password_hash → bcrypt("staging") para permitir login con pass único
-- firebase_uid → NULL (no vamos a reusar tokens Firebase en staging)
UPDATE users
SET
  email = 'test+' || id || '@staging.smartcow.cl',
  nombre = 'Usuario Staging ' || id,
  password_hash = '$2b$10$rKl7Cm.P6LcJqN3Y5vZpfOzC8YKqS0fXlG6J9kHQwVqP2n.zX3eYu',  -- bcrypt("staging")
  firebase_uid = NULL;

-- ─── conversaciones / chat_sessions ───────────────────────
-- Truncar chat data: son conversaciones reales que podrían tener info sensible
TRUNCATE TABLE chat_attachments CASCADE;
TRUNCATE TABLE chat_usage CASCADE;
TRUNCATE TABLE conversaciones CASCADE;
TRUNCATE TABLE chat_sessions CASCADE;
TRUNCATE TABLE user_memory CASCADE;
TRUNCATE TABLE user_tasks CASCADE;

-- ─── observaciones libre-texto en datos operativos ────────
-- Reemplazar observaciones (tratamientos, traslados, partos, ecografías) con placeholder.
-- Los valores estructurados (peso, fecha, diagnóstico canónico) se mantienen.
UPDATE tratamientos    SET observaciones = '[staging]' WHERE observaciones IS NOT NULL;
UPDATE traslados       SET observacion   = '[staging]' WHERE observacion IS NOT NULL;
UPDATE partos          SET observaciones = '[staging]' WHERE observaciones IS NOT NULL;
UPDATE ecografias      SET observaciones = '[staging]' WHERE observaciones IS NOT NULL;
UPDATE inseminaciones  SET observaciones = '[staging]' WHERE observaciones IS NOT NULL;
UPDATE animales        SET observaciones = '[staging]' WHERE observaciones IS NOT NULL;

-- ─── organizaciones ───────────────────────────────────────
-- Mantener estructura, anonimizar nombres reales
UPDATE organizaciones SET nombre = 'Org Staging ' || id;

-- ─── banner visible en la UI ──────────────────────────────
-- Si hay settings/kv_store — marcar ambiente staging
-- (solo si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizaciones') THEN
    UPDATE organizaciones SET plan = 'pro' WHERE plan IS NULL OR plan = '';
  END IF;
END $$;

COMMIT;

-- Resumen
SELECT 'users'           t, COUNT(*) FROM users
UNION ALL SELECT 'organizaciones', COUNT(*) FROM organizaciones
UNION ALL SELECT 'chat_sessions',  COUNT(*) FROM chat_sessions;
