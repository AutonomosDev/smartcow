-- Migration: 0021_agroapp_tenencia_negocio
-- AUT-296 (W1): Modelar cliente vs predio vs mediería para consolidación
-- de datos AgroApp legacy de Agrícola Los Lagos (único cliente real).
--
-- Cambios:
--   1) predios.tipo_tenencia  → enum (propio, arriendo)
--      Distingue fundos del cliente (San Pedro, feedlot, Recría)
--      de arriendos temporales (Arriendo Santa Isabel, Arriendo las quebradas).
--
--   2) medieros.tipo_negocio  → enum (medieria, hoteleria)
--      medieria  = contrato de cría compartida (Medieria FT/Frival/Oller, Corrales del Sur)
--      hoteleria = renta/engorda de animales de terceros (Mollendo)
--
-- Defaults conservadores: todo lo existente queda 'propio'/'medieria'.
-- El seed AUT-296 actualiza los registros reales.
--
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "tipo_tenencia" AS ENUM ('propio', 'arriendo');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "tipo_negocio" AS ENUM ('medieria', 'hoteleria');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "predios"
  ADD COLUMN IF NOT EXISTS "tipo_tenencia" "tipo_tenencia" NOT NULL DEFAULT 'propio';
--> statement-breakpoint
ALTER TABLE "medieros"
  ADD COLUMN IF NOT EXISTS "tipo_negocio" "tipo_negocio" NOT NULL DEFAULT 'medieria';
