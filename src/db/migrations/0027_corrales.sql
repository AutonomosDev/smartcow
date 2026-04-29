-- Migration: 0027_corrales
-- AUT-333 Capa 4: tablas corrales + corral_animales + seed 36 corrales Feedlot
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corrales" (
  "id"        serial PRIMARY KEY NOT NULL,
  "predio_id" integer NOT NULL,
  "galpon"    integer NOT NULL,
  "letra"     varchar(2) NOT NULL,
  "nombre"    varchar(20) NOT NULL,
  "capacidad" integer NOT NULL DEFAULT 100,
  "activo"    boolean NOT NULL DEFAULT true,
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "uq_corrales_predio_galpon_letra" UNIQUE ("predio_id", "galpon", "letra"),
  CONSTRAINT "corrales_predio_id_predios_id_fk"
    FOREIGN KEY ("predio_id") REFERENCES "predios"("id") ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "corral_animales" (
  "id"                serial PRIMARY KEY NOT NULL,
  "corral_id"         integer NOT NULL,
  "animal_id"         integer NOT NULL,
  "unidad_negocio_id" integer,
  "fecha_entrada"     date NOT NULL,
  "fecha_salida"      date,
  "observaciones"     text,
  "creado_en"         timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "corral_animales_corral_id_corrales_id_fk"
    FOREIGN KEY ("corral_id") REFERENCES "corrales"("id") ON DELETE RESTRICT,
  CONSTRAINT "corral_animales_animal_id_animales_id_fk"
    FOREIGN KEY ("animal_id") REFERENCES "animales"("id") ON DELETE RESTRICT,
  CONSTRAINT "corral_animales_unidad_negocio_id_predios_id_fk"
    FOREIGN KEY ("unidad_negocio_id") REFERENCES "predios"("id") ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corral_animales_animal_activo_idx"
  ON "corral_animales" ("animal_id")
  WHERE "fecha_salida" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "corral_animales_corral_activo_idx"
  ON "corral_animales" ("corral_id")
  WHERE "fecha_salida" IS NULL;
--> statement-breakpoint

-- ──────────────────────────────────────────────────────────
-- SEED: 36 corrales del Feedlot (predio_id=14)
-- Galpón 1: 1A-1F (6)  Galpón 2: 2A-2F (6)
-- Galpón 3: 3A-3F (6)  Galpón 4: 4A-4F (6)
-- Galpón 5: 5A-5L (12)  — confirmar A-L(12) vs A-K(11) con JP
-- ──────────────────────────────────────────────────────────
INSERT INTO "corrales" ("predio_id", "galpon", "letra", "nombre", "capacidad") VALUES
  -- Galpón 1
  (14, 1, 'A', '1A', 100),
  (14, 1, 'B', '1B', 100),
  (14, 1, 'C', '1C', 100),
  (14, 1, 'D', '1D', 100),
  (14, 1, 'E', '1E', 100),
  (14, 1, 'F', '1F', 100),
  -- Galpón 2
  (14, 2, 'A', '2A', 100),
  (14, 2, 'B', '2B', 100),
  (14, 2, 'C', '2C', 100),
  (14, 2, 'D', '2D', 100),
  (14, 2, 'E', '2E', 100),
  (14, 2, 'F', '2F', 100),
  -- Galpón 3
  (14, 3, 'A', '3A', 100),
  (14, 3, 'B', '3B', 100),
  (14, 3, 'C', '3C', 100),
  (14, 3, 'D', '3D', 100),
  (14, 3, 'E', '3E', 100),
  (14, 3, 'F', '3F', 100),
  -- Galpón 4
  (14, 4, 'A', '4A', 100),
  (14, 4, 'B', '4B', 100),
  (14, 4, 'C', '4C', 100),
  (14, 4, 'D', '4D', 100),
  (14, 4, 'E', '4E', 100),
  (14, 4, 'F', '4F', 100),
  -- Galpón 5 (A-L = 12 corrales — confirmar con JP)
  (14, 5, 'A', '5A', 100),
  (14, 5, 'B', '5B', 100),
  (14, 5, 'C', '5C', 100),
  (14, 5, 'D', '5D', 100),
  (14, 5, 'E', '5E', 100),
  (14, 5, 'F', '5F', 100),
  (14, 5, 'G', '5G', 100),
  (14, 5, 'H', '5H', 100),
  (14, 5, 'I', '5I', 100),
  (14, 5, 'J', '5J', 100),
  (14, 5, 'K', '5K', 100),
  (14, 5, 'L', '5L', 100)
ON CONFLICT ON CONSTRAINT "uq_corrales_predio_galpon_letra" DO NOTHING;
