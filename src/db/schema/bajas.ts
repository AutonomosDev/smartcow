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
import { fundos } from "./fundos.js";
import { animales } from "./animales.js";
import { bajaMotivo, bajaCausa } from "./catalogos.js";
import { users } from "./users.js";

/**
 * bajas — Registro de bajas de animales (muerte, venta forzosa, descarte).
 * Origen: módulo Baja de AgroApp.
 * Al registrar una baja, el animal pasa a estado = 'baja' en la tabla animales.
 */
export const bajas = pgTable(
  "bajas",
  {
    id: serial("id").primaryKey(),
    fundoId: integer("fundo_id")
      .notNull()
      .references(() => fundos.id, { onDelete: "restrict" }),
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
    index("bajas_fundo_fecha_idx").on(t.fundoId, t.fecha),
  ]
);

export type Baja = typeof bajas.$inferSelect;
export type NuevaBaja = typeof bajas.$inferInsert;
