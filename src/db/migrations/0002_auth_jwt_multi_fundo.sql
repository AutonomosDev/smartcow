-- Migración AUT-130: Ajustar auth JWT para org + multi-fundo
-- Agrega rol superadmin al enum existente.
-- El JWT ahora incluye fundos[] y modulos — no hay cambios DDL de tablas.

--> statement-breakpoint

-- Agregar superadmin al enum rol
ALTER TYPE "public"."rol" ADD VALUE IF NOT EXISTS 'superadmin';
