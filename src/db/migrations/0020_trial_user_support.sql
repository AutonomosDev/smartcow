-- Migration: 0020_trial_user_support
-- AUT-289: Agregar rol 'trial' al enum y columna trial_until a users.
-- Trial users (Google SSO auto-created) tienen acceso read-only por 48h a org_id=99.
--> statement-breakpoint
ALTER TYPE "rol" ADD VALUE IF NOT EXISTS 'trial';
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trial_until" timestamp with time zone;
