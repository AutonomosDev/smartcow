import { pgTable, serial, integer, varchar, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { organizaciones } from "./organizaciones.js";

/**
 * fundos — Predio / establecimiento ganadero.
 * Pertenece a una organización. Toda tabla de dominio lleva fundo_id.
 */
export const fundos = pgTable("fundos", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizaciones.id, { onDelete: "restrict" }),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  region: varchar("region", { length: 100 }),
  config: jsonb("config").$type<Record<string, unknown>>().default({}),
  creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true }).defaultNow().notNull(),
});

export type Fundo = typeof fundos.$inferSelect;
export type NuevoFundo = typeof fundos.$inferInsert;
