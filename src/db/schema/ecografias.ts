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

export const resultadoEcografiaEnum = pgEnum("resultado_ecografia", [
  "preñada",
  "vacia",
  "dudosa",
]);

/**
 * ecografias — Registro de ecografías reproductivas (confirmación de preñez).
 * Origen: módulo Ecografia de AgroApp.
 */
export const ecografias = pgTable(
  "ecografias",
  {
    id: serial("id").primaryKey(),
    fundoId: integer("fundo_id")
      .notNull()
      .references(() => fundos.id, { onDelete: "restrict" }),
    animalId: integer("animal_id")
      .notNull()
      .references(() => animales.id, { onDelete: "restrict" }),
    fecha: date("fecha").notNull(),
    resultado: resultadoEcografiaEnum("resultado").notNull(),
    diasGestacion: integer("dias_gestacion"),
    observaciones: varchar("observaciones", { length: 500 }),
    usuarioId: integer("usuario_id").references(() => users.id, { onDelete: "set null" }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("ecografias_animal_fecha_idx").on(t.animalId, t.fecha),
    index("ecografias_fundo_fecha_idx").on(t.fundoId, t.fecha),
  ]
);

export type Ecografia = typeof ecografias.$inferSelect;
export type NuevaEcografia = typeof ecografias.$inferInsert;
