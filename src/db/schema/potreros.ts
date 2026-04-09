import {
  pgTable,
  serial,
  integer,
  varchar,
  decimal,
  pgEnum,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { predios } from "./predios";
import { organizaciones } from "./organizaciones";

export const tipoPotrero = pgEnum("tipo_potrero", [
  "pradera",
  "cultivo",
  "forestal",
  "otro",
]);

/**
 * potreros — Subdivisiones de un predio donde pastan los animales.
 * Permite responder: "¿dónde están las vacas preñadas ahora?".
 * Solo aplica si org.modulos.crianza = true.
 */
export const potreros = pgTable(
  "potreros",
  {
    id: serial("id").primaryKey(),
    predioId: integer("predio_id")
      .notNull()
      .references(() => predios.id, { onDelete: "restrict" }),
    orgId: integer("org_id")
      .notNull()
      .references(() => organizaciones.id, { onDelete: "restrict" }),
    nombre: varchar("nombre", { length: 200 }).notNull(),
    hectareas: decimal("hectareas", { precision: 10, scale: 2 }),
    capacidadAnimales: integer("capacidad_animales"),
    tipo: tipoPotrero("tipo"),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("potreros_predio_idx").on(t.predioId),
  ]
);

export type Potrero = typeof potreros.$inferSelect;
export type NuevoPotrero = typeof potreros.$inferInsert;
