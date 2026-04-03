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
import { fundos } from "./fundos.js";
import { organizaciones } from "./organizaciones.js";

export const tipoPotrero = pgEnum("tipo_potrero", [
  "pradera",
  "cultivo",
  "forestal",
  "otro",
]);

/**
 * potreros — Subdivisiones de un fundo donde pastan los animales.
 * Permite responder: "¿dónde están las vacas preñadas ahora?".
 * Solo aplica si org.modulos.crianza = true.
 */
export const potreros = pgTable(
  "potreros",
  {
    id: serial("id").primaryKey(),
    fundoId: integer("fundo_id")
      .notNull()
      .references(() => fundos.id, { onDelete: "restrict" }),
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
    index("potreros_fundo_idx").on(t.fundoId),
  ]
);

export type Potrero = typeof potreros.$inferSelect;
export type NuevoPotrero = typeof potreros.$inferInsert;
