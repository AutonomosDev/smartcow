-- Migration: 0024_tratamientos_sag_fields
-- AUT-298 (W3): Extender tratamientos con trazabilidad SAG completa del xlsx
-- "Tratamientos_Historial_18-04-2026_1.xlsx" (74,778 filas, 22 columnas originales).
--
-- Campos que antes se ignoraban y ahora se guardan en medicamentos[] jsonb:
--   Medicamento-Reg. SAG, Serie-Venc., Vía, Dosis, Repetir cada, Repetir total,
--   Resguardo carne, Liberación carne.
--
-- Columnas nuevas a nivel tratamiento:
--   inicio, fin — fechas del rango del tratamiento (AgroApp "Inicio" / "Fin")
--   liberacion_carne_max — fecha máxima de liberación entre todos los medicamentos,
--     denormalizada para responder rápido "¿qué animales están en resguardo hoy?"
--
-- Excluidos intencionalmente (Agrícola Los Lagos no es lechero):
--   Resguardo leche, Liberación leche.
--> statement-breakpoint
ALTER TABLE "tratamientos" ADD COLUMN IF NOT EXISTS "inicio" date;
--> statement-breakpoint
ALTER TABLE "tratamientos" ADD COLUMN IF NOT EXISTS "fin" date;
--> statement-breakpoint
ALTER TABLE "tratamientos" ADD COLUMN IF NOT EXISTS "liberacion_carne_max" date;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tratamientos_liberacion_carne_idx" ON "tratamientos" ("liberacion_carne_max");
