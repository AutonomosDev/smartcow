-- Migration: 0025_traslados_inventarios_agregados
-- AUT-299 (W4):
--   1. Extender tabla `traslados` para soportar imports agregados por lote
--      desde AgroApp (sin DIIO individual). Hace animal_id nullable y agrega
--      n_animales, tipo_ganado_desglose jsonb, n_guia SAG, estado, usuario_id,
--      mediero_origen_id, mediero_destino_id.
--   2. Crear tabla nueva `inventarios` para snapshots del hato por predio/mediería.
--
--   Datos objetivo:
--     Traslados_Historial_18-04-2026.xlsx  = 198 filas
--     Inventarios_Historial_18-04-2026.xlsx = 27 filas
--
--> statement-breakpoint
ALTER TABLE "traslados" ALTER COLUMN "animal_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "traslados" ADD COLUMN IF NOT EXISTS "mediero_origen_id" integer;
--> statement-breakpoint
ALTER TABLE "traslados" ADD COLUMN IF NOT EXISTS "mediero_destino_id" integer;
--> statement-breakpoint
ALTER TABLE "traslados" ADD COLUMN IF NOT EXISTS "n_animales" integer;
--> statement-breakpoint
ALTER TABLE "traslados" ADD COLUMN IF NOT EXISTS "tipo_ganado_desglose" jsonb;
--> statement-breakpoint
ALTER TABLE "traslados" ADD COLUMN IF NOT EXISTS "n_guia" varchar(50);
--> statement-breakpoint
ALTER TABLE "traslados" ADD COLUMN IF NOT EXISTS "estado" varchar(20);
--> statement-breakpoint
ALTER TABLE "traslados" ADD COLUMN IF NOT EXISTS "usuario_id" integer;
--> statement-breakpoint
ALTER TABLE "traslados"
  ADD CONSTRAINT "traslados_mediero_origen_id_medieros_id_fk"
  FOREIGN KEY ("mediero_origen_id") REFERENCES "medieros"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "traslados"
  ADD CONSTRAINT "traslados_mediero_destino_id_medieros_id_fk"
  FOREIGN KEY ("mediero_destino_id") REFERENCES "medieros"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "traslados"
  ADD CONSTRAINT "traslados_usuario_id_users_id_fk"
  FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "traslados_fecha_idx" ON "traslados" ("fecha");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "traslados_n_guia_idx" ON "traslados" ("n_guia");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inventarios" (
  "id" serial PRIMARY KEY NOT NULL,
  "id_agroapp" varchar(20),
  "predio_id" integer NOT NULL,
  "mediero_id" integer,
  "fecha" date NOT NULL,
  "n_encontrados" integer,
  "tg_encontrados" jsonb,
  "n_faltantes" integer,
  "tg_faltantes" jsonb,
  "estado" varchar(20),
  "usuario_id" integer,
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventarios"
  ADD CONSTRAINT "inventarios_predio_id_predios_id_fk"
  FOREIGN KEY ("predio_id") REFERENCES "predios"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "inventarios"
  ADD CONSTRAINT "inventarios_mediero_id_medieros_id_fk"
  FOREIGN KEY ("mediero_id") REFERENCES "medieros"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "inventarios"
  ADD CONSTRAINT "inventarios_usuario_id_users_id_fk"
  FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inventarios_predio_fecha_idx" ON "inventarios" ("predio_id", "fecha");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inventarios_mediero_idx" ON "inventarios" ("mediero_id");
