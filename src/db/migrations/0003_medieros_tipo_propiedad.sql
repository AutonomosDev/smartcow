-- Migración AUT-135: Schema medieros + tipo_propiedad en animales
-- Modela el concepto de mediería: terceros propietarios de animales
-- que operan dentro de un fundo. Sus animales se distinguen con
-- tipo_propiedad = 'medieria'.

--> statement-breakpoint

-- Enum tipo_propiedad
CREATE TYPE "public"."tipo_propiedad" AS ENUM ('propio', 'medieria');

--> statement-breakpoint

-- Tabla medieros
CREATE TABLE "medieros" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" integer NOT NULL,
	"fundo_id" integer NOT NULL,
	"nombre" varchar(120) NOT NULL,
	"rut" varchar(12),
	"contacto" varchar(80),
	"porcentaje_part" numeric(5, 2),
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint

ALTER TABLE "medieros" ADD CONSTRAINT "medieros_org_id_organizaciones_id_fk"
  FOREIGN KEY ("org_id") REFERENCES "public"."organizaciones"("id") ON DELETE restrict ON UPDATE no action;

--> statement-breakpoint

ALTER TABLE "medieros" ADD CONSTRAINT "medieros_fundo_id_fundos_id_fk"
  FOREIGN KEY ("fundo_id") REFERENCES "public"."fundos"("id") ON DELETE restrict ON UPDATE no action;

--> statement-breakpoint

-- Agregar tipo_propiedad a animales (con default 'propio' para backfill)
ALTER TABLE "animales" ADD COLUMN "tipo_propiedad" "tipo_propiedad" NOT NULL DEFAULT 'propio';

--> statement-breakpoint

-- Agregar mediero_id a animales (nullable — solo para tipo_propiedad = 'medieria')
ALTER TABLE "animales" ADD COLUMN "mediero_id" integer;

--> statement-breakpoint

ALTER TABLE "animales" ADD CONSTRAINT "animales_mediero_id_medieros_id_fk"
  FOREIGN KEY ("mediero_id") REFERENCES "public"."medieros"("id") ON DELETE set null ON UPDATE no action;
