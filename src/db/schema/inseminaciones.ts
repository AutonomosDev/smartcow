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
import { semen, inseminadores } from "./catalogos";
import { users } from "./users";

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
    predioId: integer("predio_id")
      .notNull()
      .references(() => predios.id, { onDelete: "restrict" }),
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
    index("inseminaciones_predio_fecha_idx").on(t.predioId, t.fecha),
  ]
);

export type Inseminacion = typeof inseminaciones.$inferSelect;
export type NuevaInseminacion = typeof inseminaciones.$inferInsert;
