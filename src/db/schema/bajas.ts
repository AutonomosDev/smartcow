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
import { bajaMotivo, bajaCausa } from "./catalogos";
import { users } from "./users";

/**
 * bajas — Registro de bajas de animales (muerte, venta forzosa, descarte).
 * Origen: módulo Baja de AgroApp.
 * Al registrar una baja, el animal pasa a estado = 'baja' en la tabla animales.
 */
export const bajas = pgTable(
  "bajas",
  {
    id: serial("id").primaryKey(),
    predioId: integer("predio_id")
      .notNull()
      .references(() => predios.id, { onDelete: "restrict" }),
    animalId: integer("animal_id")
      .notNull()
      .references(() => animales.id, { onDelete: "restrict" }),
    fecha: date("fecha").notNull(),
    motivoId: integer("motivo_id")
      .notNull()
      .references(() => bajaMotivo.id, { onDelete: "restrict" }),
    causaId: integer("causa_id").references(() => bajaCausa.id, { onDelete: "set null" }),
    pesoKg: numeric("peso_kg", { precision: 8, scale: 2 }),
    observaciones: varchar("observaciones", { length: 500 }),
    usuarioId: integer("usuario_id").references(() => users.id, { onDelete: "set null" }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("bajas_animal_idx").on(t.animalId),
    index("bajas_predio_fecha_idx").on(t.predioId, t.fecha),
  ]
);

export type Baja = typeof bajas.$inferSelect;
export type NuevaBaja = typeof bajas.$inferInsert;
