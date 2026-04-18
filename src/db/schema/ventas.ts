import {
  pgTable,
  serial,
  integer,
  numeric,
  date,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { predios } from "./predios";
import { animales } from "./animales";

/**
 * ventas — Registro de ventas de animales (por cabeza).
 * Origen: módulo Venta de AgroApp (endpoint /Venta + /Consulta).
 * Una venta puede incluir N animales en una misma rampa (venta_id).
 *
 * peso_kg: peso individual del animal al momento de la venta.
 * peso_estimado: peso_rampa / n_animales_rampa cuando no hay peso individual.
 * destino: texto libre con comprador y/o feria (de observación AgroApp).
 */
export const ventas = pgTable(
  "ventas",
  {
    id: serial("id").primaryKey(),
    predioId: integer("predio_id")
      .notNull()
      .references(() => predios.id, { onDelete: "restrict" }),
    animalId: integer("animal_id")
      .notNull()
      .references(() => animales.id, { onDelete: "restrict" }),
    fecha: date("fecha").notNull(),
    pesoKg: numeric("peso_kg", { precision: 8, scale: 2 }),
    pesoEstimado: numeric("peso_estimado", { precision: 8, scale: 2 }),
    ventaIdAgroapp: integer("venta_id_agroapp"),
    nAnimalesRampa: integer("n_animales_rampa"),
    destino: varchar("destino", { length: 500 }),
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
