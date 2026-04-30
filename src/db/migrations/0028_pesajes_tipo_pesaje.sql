-- Migration: 0028_pesajes_tipo_pesaje
-- AUT-333 Capa 1: agregar tipo_pesaje a pesajes
-- Valores: rutina | llegada | destete | salida_venta
-- El campo es_peso_llegada existente se mantiene por compatibilidad retroactiva.
--> statement-breakpoint
ALTER TABLE "pesajes"
  ADD COLUMN IF NOT EXISTS "tipo_pesaje" varchar(20) NOT NULL DEFAULT 'rutina';
--> statement-breakpoint
-- Backfill: los pesajes marcados como llegada pasan a tipo_pesaje='llegada'
UPDATE "pesajes" SET "tipo_pesaje" = 'llegada' WHERE "es_peso_llegada" = true;
