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
import { semen, inseminadores } from "./catalogos.js";
import { users } from "./users.js";

export const resultadoInseminacionEnum = pgEnum("resultado_inseminacion", [
  "preñada",
  "vacia",
  "pendiente",
]);

/**
 * inseminaciones — Registro de inseminaciones artificiales (IA).
 * Origen: módulo Inseminacion de AgroApp.
 * total_ia se calcula por conteo de registros — no se almacena.
 */
export const inseminaciones = pgTable(
  "inseminaciones",
  {
    id: serial("id").primaryKey(),
    fundoId: integer("fundo_id")
      .notNull()
      .references(() => fundos.id, { onDelete: "restrict" }),
    animalId: integer("animal_id")
      .notNull()
      .references(() => animales.id, { onDelete: "restrict" }),
    fecha: date("fecha").notNull(),
    semenId: integer("semen_id").references(() => semen.id, { onDelete: "set null" }),
    inseminadorId: integer("inseminador_id").references(() => inseminadores.id, {
      onDelete: "set null",
    }),
    resultado: resultadoInseminacionEnum("resultado").notNull().default("pendiente"),
    observaciones: varchar("observaciones", { length: 500 }),
    usuarioId: integer("usuario_id").references(() => users.id, { onDelete: "set null" }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("inseminaciones_animal_fecha_idx").on(t.animalId, t.fecha),
    index("inseminaciones_fundo_fecha_idx").on(t.fundoId, t.fecha),
  ]
);

export type Inseminacion = typeof inseminaciones.$inferSelect;
export type NuevaInseminacion = typeof inseminaciones.$inferInsert;
