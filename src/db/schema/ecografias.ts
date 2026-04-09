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
import { predios } from "./predios";
import { animales } from "./animales";
import { users } from "./users";

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
    predioId: integer("predio_id")
      .notNull()
      .references(() => predios.id, { onDelete: "restrict" }),
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
    index("ecografias_predio_fecha_idx").on(t.predioId, t.fecha),
  ]
);

export type Ecografia = typeof ecografias.$inferSelect;
export type NuevaEcografia = typeof ecografias.$inferInsert;
