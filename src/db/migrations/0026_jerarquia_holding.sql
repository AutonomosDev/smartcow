-- Migration: 0026_jerarquia_holding
-- AUT-333 Capa 2: jerarquía operación → fundo → unidad de negocio
-- + tabla holdings
-- + seed JP Ferrada (Agrícola Los Lagos)
--
-- NO DESTRUCTIVA: solo agrega columnas y una fila nueva (predio id=14).
-- El histórico (animales, pesajes, etc.) queda intacto apuntando al predio_id original.
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "holdings" (
  "id"        serial PRIMARY KEY NOT NULL,
  "org_id"    integer NOT NULL,
  "nombre"    varchar(120) NOT NULL,
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "holdings_org_id_organizaciones_id_fk"
    FOREIGN KEY ("org_id") REFERENCES "organizaciones"("id") ON DELETE RESTRICT
);
--> statement-breakpoint
ALTER TABLE "predios"
  ADD COLUMN IF NOT EXISTS "tipo_entidad"    varchar(20) NOT NULL DEFAULT 'fundo_fisico',
  ADD COLUMN IF NOT EXISTS "parent_predio_id" integer,
  ADD COLUMN IF NOT EXISTS "tipo_negocio"    varchar(30),
  ADD COLUMN IF NOT EXISTS "holding_id"      integer;
--> statement-breakpoint
ALTER TABLE "predios"
  ADD CONSTRAINT IF NOT EXISTS "predios_parent_predio_id_predios_id_fk"
    FOREIGN KEY ("parent_predio_id") REFERENCES "predios"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "predios"
  ADD CONSTRAINT IF NOT EXISTS "predios_holding_id_holdings_id_fk"
    FOREIGN KEY ("holding_id") REFERENCES "holdings"("id") ON DELETE SET NULL;
--> statement-breakpoint

-- ──────────────────────────────────────────────────
-- SEED: Holding Agrícola Los Lagos (org_id=1)
-- ──────────────────────────────────────────────────
INSERT INTO "holdings" ("id", "org_id", "nombre")
VALUES (1, 1, 'Agrícola Los Lagos')
ON CONFLICT DO NOTHING;
--> statement-breakpoint

-- Crear predio Feedlot (operación) si no existe como id=14
-- Usamos nextval solo si la secuencia no ha llegado a 14 aún;
-- si ya hay predios con id >= 14 el INSERT falla — se usa INSERT con id explícito.
INSERT INTO "predios" ("id", "org_id", "nombre", "tipo_tenencia", "tipo_entidad", "tipo_negocio", "holding_id")
VALUES (14, 1, 'Feedlot', 'propio', 'operacion', NULL, 1)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint

-- Avanzar la secuencia para que el próximo INSERT auto use id >= 15
SELECT setval(pg_get_serial_sequence('predios', 'id'), GREATEST(nextval(pg_get_serial_sequence('predios', 'id')), 15) - 1);
--> statement-breakpoint

-- ──────────────────────────────────────────────────
-- SEED: Clasificación predios existentes JP Ferrada
-- ──────────────────────────────────────────────────
-- id=1  Aguas Buenas          → fundo_fisico / arriendo_pasto
-- id=2  Arriendo las quebradas→ fundo_fisico / arriendo_pasto
-- id=3  Arriendo Santa Isabel → fundo_fisico / arriendo_pasto
-- id=4  feedlot (existente)   → unidad_negocio / interno       parent=14
-- id=5  Medieria FT           → unidad_negocio / medieria       parent=14
-- id=6  Mollendo              → unidad_negocio / hoteleria      parent=14
-- id=7  Recría Feedlot        → unidad_negocio / recria_propia  parent=14
-- id=8  Recría FT             → unidad_negocio / recria_terceros parent=14
-- id=9  San Pedro             → fundo_fisico   / interno
-- id=10 Medieria Frival       → fundo_fisico   / medieria
-- id=11 Medieria Chacaipulli  → fundo_fisico   / medieria
-- id=12 Corrales del Sur      → fundo_fisico   / medieria
-- id=13 Medieria Oller        → fundo_fisico   / medieria

UPDATE "predios" SET
  "tipo_entidad"     = 'fundo_fisico',
  "tipo_negocio"     = 'arriendo_pasto',
  "holding_id"       = 1
WHERE "id" IN (1, 2, 3);
--> statement-breakpoint

UPDATE "predios" SET
  "tipo_entidad"      = 'unidad_negocio',
  "tipo_negocio"      = 'interno',
  "parent_predio_id"  = 14,
  "holding_id"        = 1
WHERE "id" = 4;
--> statement-breakpoint

UPDATE "predios" SET
  "tipo_entidad"      = 'unidad_negocio',
  "tipo_negocio"      = 'medieria',
  "parent_predio_id"  = 14,
  "holding_id"        = 1
WHERE "id" = 5;
--> statement-breakpoint

UPDATE "predios" SET
  "tipo_entidad"      = 'unidad_negocio',
  "tipo_negocio"      = 'hoteleria',
  "parent_predio_id"  = 14,
  "holding_id"        = 1
WHERE "id" = 6;
--> statement-breakpoint

UPDATE "predios" SET
  "tipo_entidad"      = 'unidad_negocio',
  "tipo_negocio"      = 'recria_propia',
  "parent_predio_id"  = 14,
  "holding_id"        = 1
WHERE "id" = 7;
--> statement-breakpoint

UPDATE "predios" SET
  "tipo_entidad"      = 'unidad_negocio',
  "tipo_negocio"      = 'recria_terceros',
  "parent_predio_id"  = 14,
  "holding_id"        = 1
WHERE "id" = 8;
--> statement-breakpoint

UPDATE "predios" SET
  "tipo_entidad"  = 'fundo_fisico',
  "tipo_negocio"  = 'interno',
  "holding_id"    = 1
WHERE "id" = 9;
--> statement-breakpoint

UPDATE "predios" SET
  "tipo_entidad"  = 'fundo_fisico',
  "tipo_negocio"  = 'medieria',
  "holding_id"    = 1
WHERE "id" IN (10, 11, 12, 13);
