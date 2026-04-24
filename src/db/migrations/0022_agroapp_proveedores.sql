-- Migration: 0022_agroapp_proveedores
-- AUT-296 (extensión W1): tabla `proveedores` para evaluar origen comercial
-- del ganado (ferias, criadores, intermediarios) a partir de los ~34 nombres
-- canónicos detectados en Traslados::Origen y GanadoActual::Origen.
--
-- Uso negocio:
--   - % bajas por proveedor
--   - ADG post-llegada por proveedor
--   - Ranking calidad / confiabilidad
--
-- Seed posterior con scripts/seed-agroapp-predios-medieros.ts
--
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "tipo_proveedor" AS ENUM ('feria', 'criador', 'intermediario', 'desconocido');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proveedores" (
  "id"              serial PRIMARY KEY NOT NULL,
  "org_id"          integer NOT NULL,
  "nombre"          varchar(120) NOT NULL,
  "tipo"            "tipo_proveedor" NOT NULL DEFAULT 'desconocido',
  "rut"             varchar(12),
  "contacto"        varchar(80),
  "activo"          boolean NOT NULL DEFAULT true,
  "notas"           text,
  "creado_en"       timestamp with time zone NOT NULL DEFAULT now(),
  "actualizado_en"  timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "proveedores"
    ADD CONSTRAINT "proveedores_org_id_organizaciones_id_fk"
    FOREIGN KEY ("org_id") REFERENCES "organizaciones"("id")
    ON DELETE restrict;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_proveedores_org_nombre"
  ON "proveedores" ("org_id", "nombre");
