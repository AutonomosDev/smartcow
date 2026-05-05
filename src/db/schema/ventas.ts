import {
  pgTable,
  serial,
  integer,
  numeric,
  date,
  varchar,
  timestamp,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { predios } from "./predios";
import { animales } from "./animales";

/**
 * ventas — Registros de venta de ganado.
 *
 * AUT-390: animal_id es NULLABLE para soportar ventas por LOTE
 * sin DIIO individual (mayoría de ventas en archivos AgroApp).
 *
 *   animal_id NOT NULL → venta individual con DIIO real
 *   animal_id NULL     → venta por lote, ver `animales_lote`
 *                        para desglose por tipo de ganado
 */
export const ventas = pgTable(
  "ventas",
  {
    id: serial("id").primaryKey(),
    predioId: integer("predio_id")
      .notNull()
      .references(() => predios.id, { onDelete: "restrict" }),
    animalId: integer("animal_id").references(() => animales.id, {
      onDelete: "restrict",
    }),
    fecha: date("fecha").notNull(),
    pesoKg: numeric("peso_kg", { precision: 8, scale: 2 }),
    pesoEstimado: numeric("peso_estimado", { precision: 8, scale: 2 }),
    ventaIdAgroapp: integer("venta_id_agroapp"),
    nAnimalesRampa: integer("n_animales_rampa"),
    destino: varchar("destino", { length: 500 }),
    /**
     * animales_lote — Desglose por tipo cuando la venta es por lote.
     * Ejemplo: { "Novillo": 10, "Vaquilla": 5 }
     * NULL si la venta es individual (animal_id != NULL).
     */
    animalesLote: jsonb("animales_lote").$type<Record<string, number>>(),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("ventas_animal_idx").on(t.animalId),
    index("ventas_predio_fecha_idx").on(t.predioId, t.fecha),
    index("ventas_rampa_idx").on(t.ventaIdAgroapp),
  ]
);

export type Venta = typeof ventas.$inferSelect;
export type NuevaVenta = typeof ventas.$inferInsert;
