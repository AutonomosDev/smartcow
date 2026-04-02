import {
  pgTable,
  serial,
  integer,
  date,
  varchar,
  pgEnum,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { fundos } from "./fundos.js";
import { animales } from "./animales.js";
import { users } from "./users.js";

export const tipoAreteoEnum = pgEnum("tipo_areteo", ["alta", "aparicion", "cambio_diio"]);

/**
 * areteos — Historial de asignación y cambio de DIIO/arete.
 * Origen: módulo Areteo de AgroApp (alta, aparición, cambio DIIO).
 *
 * diio_nuevo: número de arete asignado en esta operación.
 * diio_anterior: número previo (null en alta inicial).
 */
export const areteos = pgTable(
  "areteos",
  {
    id: serial("id").primaryKey(),
    fundoId: integer("fundo_id")
      .notNull()
      .references(() => fundos.id, { onDelete: "restrict" }),
    animalId: integer("animal_id")
      .notNull()
      .references(() => animales.id, { onDelete: "restrict" }),
    tipo: tipoAreteoEnum("tipo").notNull(),
    fecha: date("fecha").notNull(),
    diioNuevo: varchar("diio_nuevo", { length: 50 }).notNull(),
    diioAnterior: varchar("diio_anterior", { length: 50 }),
    observaciones: varchar("observaciones", { length: 500 }),
    usuarioId: integer("usuario_id").references(() => users.id, { onDelete: "set null" }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("areteos_animal_fecha_idx").on(t.animalId, t.fecha),
    index("areteos_fundo_tipo_idx").on(t.fundoId, t.tipo),
  ]
);

export type Areteo = typeof areteos.$inferSelect;
export type NuevoAreteo = typeof areteos.$inferInsert;
