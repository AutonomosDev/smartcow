-- Migration: 0019_ventas_tratamientos_traslados
-- AUT-283: Crear tablas declaradas en src/db/schema/ pero nunca migradas.
-- Detectado como drift: schema TS las importa, prod no las tiene.
-- SQL derivado directamente de ventas.ts / tratamientos.ts / traslados.ts.
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ventas" (
  "id" serial PRIMARY KEY NOT NULL,
  "predio_id" integer NOT NULL,
  "animal_id" integer NOT NULL,
  "fecha" date NOT NULL,
  "peso_kg" numeric(8,2),
  "peso_estimado" numeric(8,2),
  "venta_id_agroapp" integer,
  "n_animales_rampa" integer,
  "destino" varchar(500),
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ventas"
  ADD CONSTRAINT "ventas_predio_id_predios_id_fk"
  FOREIGN KEY ("predio_id") REFERENCES "predios"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "ventas"
  ADD CONSTRAINT "ventas_animal_id_animales_id_fk"
  FOREIGN KEY ("animal_id") REFERENCES "animales"("id") ON DELETE RESTRICT;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ventas_animal_idx" ON "ventas" ("animal_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ventas_predio_fecha_idx" ON "ventas" ("predio_id", "fecha");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ventas_rampa_idx" ON "ventas" ("venta_id_agroapp");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tratamientos" (
  "id" serial PRIMARY KEY NOT NULL,
  "predio_id" integer NOT NULL,
  "animal_id" integer NOT NULL,
  "fecha" date NOT NULL,
  "hora_registro" time,
  "id_agroapp" varchar(20),
  "diagnostico" varchar(300),
  "observaciones" varchar(500),
  "medicamentos" jsonb,
  "usuario_id" integer,
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tratamientos"
  ADD CONSTRAINT "tratamientos_predio_id_predios_id_fk"
  FOREIGN KEY ("predio_id") REFERENCES "predios"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "tratamientos"
  ADD CONSTRAINT "tratamientos_animal_id_animales_id_fk"
  FOREIGN KEY ("animal_id") REFERENCES "animales"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "tratamientos"
  ADD CONSTRAINT "tratamientos_usuario_id_users_id_fk"
  FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tratamientos_animal_fecha_idx" ON "tratamientos" ("animal_id", "fecha");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tratamientos_predio_fecha_idx" ON "tratamientos" ("predio_id", "fecha");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tratamientos_diagnostico_idx" ON "tratamientos" ("diagnostico");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "traslados" (
  "id" serial PRIMARY KEY NOT NULL,
  "animal_id" integer NOT NULL,
  "fecha" date NOT NULL,
  "id_agroapp" varchar(20),
  "predio_origen_id" integer,
  "predio_destino_id" integer,
  "fundo_origen_nombre" varchar(200),
  "fundo_destino_nombre" varchar(200),
  "observacion" varchar(500),
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "traslados"
  ADD CONSTRAINT "traslados_animal_id_animales_id_fk"
  FOREIGN KEY ("animal_id") REFERENCES "animales"("id") ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE "traslados"
  ADD CONSTRAINT "traslados_predio_origen_id_predios_id_fk"
  FOREIGN KEY ("predio_origen_id") REFERENCES "predios"("id") ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE "traslados"
  ADD CONSTRAINT "traslados_predio_destino_id_predios_id_fk"
  FOREIGN KEY ("predio_destino_id") REFERENCES "predios"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "traslados_animal_fecha_idx" ON "traslados" ("animal_id", "fecha");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "traslados_destino_idx" ON "traslados" ("predio_destino_id", "fecha");
