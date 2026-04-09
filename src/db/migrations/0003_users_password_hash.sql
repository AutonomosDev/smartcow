-- Migration: add password_hash column to users
-- Missing from initial migrations (was in schema but not in SQL).

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" varchar(255) NOT NULL DEFAULT '';
