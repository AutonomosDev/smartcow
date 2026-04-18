import {
  pgTable,
  serial,
  integer,
  varchar,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { predios } from "./predios";
import { animales } from "./animales";

/**
 * traslados — Movimientos de animales entre fundos (predios).
 * Origen: módulo Traslado de AgroApp (/Consulta por animal).
 *
 * Distinto de movimientos_potrero (que es dentro del mismo predio).
 * fundo_origen_nombre / fundo_destino_nombre: texto de AgroApp.
 * predio_origen_id / predio_destino_id: FK resueltas contra predios.
 *
 * Con estos datos se puede calcular:
 *   - días en feedlot por animal (traslado_entrada → fecha_venta)
 *   - ADG feedlot (peso_salida - peso_entrada) / días
 */
export const traslados = pgTable(
  "traslados",
  {
    id: serial("id").primaryKey(),
    animalId: integer("animal_id")
      .notNull()
      .references(() => animales.id, { onDelete: "restrict" }),
    fecha: date("fecha").notNull(),
    idAgroapp: varchar("id_agroapp", { length: 20 }),
    predioOrigenId: integer("predio_origen_id").references(() => predios.id, {
      onDelete: "set null",
    }),
    predioDestinoId: integer("predio_destino_id").references(() => predios.id, {
      onDelete: "set null",
    }),
    fundoOrigenNombre: varchar("fundo_origen_nombre", { length: 200 }),
    fundoDestinoNombre: varchar("fundo_destino_nombre", { length: 200 }),
    observacion: varchar("observacion", { length: 500 }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("traslados_animal_fecha_idx").on(t.animalId, t.fecha),
    index("traslados_destino_idx").on(t.predioDestinoId, t.fecha),
  ]
);

export type Traslado = typeof traslados.$inferSelect;
export type NuevoTraslado = typeof traslados.$inferInsert;
