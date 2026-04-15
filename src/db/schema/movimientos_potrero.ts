import {
  pgTable,
  serial,
  integer,
  date,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { predios } from "./predios";
import { organizaciones } from "./organizaciones";
import { animales } from "./animales";
import { potreros } from "./potreros";

/**
 * movimientos_potrero — Historial de ubicación de cada animal por potrero.
 * Un registro abierto (fecha_salida IS NULL) = ubicación actual del animal.
 * Permite responder: "¿dónde están las vacas preñadas ahora?".
 * Solo aplica si org.modulos.crianza = true.
 */
export const movimientosPotrero = pgTable(
  "movimientos_potrero",
  {
    id: serial("id").primaryKey(),
    animalId: integer("animal_id")
      .notNull()
      .references(() => animales.id, { onDelete: "restrict" }),
    predioId: integer("predio_id")
      .notNull()
      .references(() => predios.id, { onDelete: "restrict" }),
    orgId: integer("org_id")
      .notNull()
      .references(() => organizaciones.id, { onDelete: "restrict" }),
    potreroId: integer("potrero_id")
      .notNull()
      .references(() => potreros.id, { onDelete: "restrict" }),
    fechaEntrada: date("fecha_entrada").notNull(),
    fechaSalida: date("fecha_salida"),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("movimientos_potrero_animal_idx").on(t.animalId),
    index("movimientos_potrero_potrero_predio_idx").on(t.potreroId, t.predioId),
  ]
);

export type MovimientoPotrero = typeof movimientosPotrero.$inferSelect;
export type NuevoMovimientoPotrero = typeof movimientosPotrero.$inferInsert;
