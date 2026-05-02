import {
  pgTable,
  serial,
  integer,
  numeric,
  date,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { predios } from "./predios";

/**
 * kpi_diario — Snapshot diario de KPIs por predio.
 *
 * AUT-391: Calculado por scripts/etl/carga_15_kpi_diario.py.
 * 1 fila por (fecha, predio_id). UNIQUE para idempotencia.
 *
 * Métricas:
 *   · poblacionales (total_animales, vacas_prenadas/vacias, listos_venta)
 *   · peso (promedio por etapa)
 *   · operativas (pesajes_dia, outliers, sin_pesaje_60d)
 */
export const kpiDiario = pgTable(
  "kpi_diario",
  {
    id: serial("id").primaryKey(),
    fecha: date("fecha").notNull(),
    predioId: integer("predio_id")
      .notNull()
      .references(() => predios.id, { onDelete: "cascade" }),
    totalAnimales: integer("total_animales"),
    vacasPrenadas: integer("vacas_prenadas"),
    vacasVacias: integer("vacas_vacias"),
    animalesListosVenta: integer("animales_listos_venta"),
    pesoPromedioEngorda: numeric("peso_promedio_engorda", { precision: 8, scale: 2 }),
    pesoPromedioRecria: numeric("peso_promedio_recria", { precision: 8, scale: 2 }),
    pesajesDia: integer("pesajes_dia"),
    outliersDetectados: integer("outliers_detectados"),
    animalesSinPesaje60d: integer("animales_sin_pesaje_60d"),
    computedAt: timestamp("computed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("kpi_diario_fecha_predio_uq").on(t.fecha, t.predioId),
  ]
);

export type KpiDiario = typeof kpiDiario.$inferSelect;
export type NuevoKpiDiario = typeof kpiDiario.$inferInsert;
