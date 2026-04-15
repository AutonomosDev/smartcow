-- Migration: 0008_nextauth_remove_firebase
-- Migración AUT-215: volver de Firebase Auth a Next-Auth + bcrypt
-- 
-- 1. Restaura password_hash (eliminada en 0005_firebase_auth.sql)
-- 2. Marca firebase_uid como nullable (ya lo es) — se puede borrar después
--    del primer deploy exitoso una vez confirmada la migración
--
-- NOTA: firebase_uid se deja en la tabla temporalmente para rollback seguro.
--       Borrar en migración posterior (0009) una vez confirmado el deploy.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" varchar(255);

-- Los usuarios existentes con Firebase login vía Google no tendrán password_hash
-- (NULL). Solo aplica a usuarios email/password.
-- El admin debe resetear passwords post-migración vía script.
