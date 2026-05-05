-- AUT-390 · ventas: soportar lotes sin DIIO individual
-- 91% de las ventas en archivos AgroApp son por lote sin DIIO.

ALTER TABLE "ventas" ALTER COLUMN "animal_id" DROP NOT NULL;
ALTER TABLE "ventas" ADD COLUMN IF NOT EXISTS "animales_lote" jsonb;
