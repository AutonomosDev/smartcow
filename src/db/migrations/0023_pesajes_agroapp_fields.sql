-- AUT-297 (W2) — Agregar campos AgroApp a pesajes + índice de idempotencia.
-- Permite rescatar los 163k pesajes históricos faltantes mapeando todas las columnas
-- del xlsx (edad, observaciones, primer pesaje como peso_llegada).

ALTER TABLE "pesajes"
  ADD COLUMN IF NOT EXISTS "edad_meses" numeric(5, 1);

ALTER TABLE "pesajes"
  ADD COLUMN IF NOT EXISTS "observaciones" text;

ALTER TABLE "pesajes"
  ADD COLUMN IF NOT EXISTS "es_peso_llegada" boolean NOT NULL DEFAULT false;

-- Idempotencia: mismo animal + fecha + peso ≡ duplicado.
-- AgroApp no expone un id estable en el xlsx Pesajes, así que usamos esta tupla.
CREATE UNIQUE INDEX IF NOT EXISTS "uq_pesajes_animal_fecha_peso"
  ON "pesajes" ("animal_id", "fecha", "peso_kg");
