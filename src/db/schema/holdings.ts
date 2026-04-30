import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { organizaciones } from "./organizaciones";

/**
 * holdings — Agrupación económica de predios bajo un mismo dueño/razón social.
 * AUT-333: JP Ferrada → Agrícola Los Lagos agrupa fundos físicos + Feedlot.
 */
export const holdings = pgTable("holdings", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizaciones.id, { onDelete: "restrict" }),
  nombre: varchar("nombre", { length: 120 }).notNull(),
  creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
});

export type Holding = typeof holdings.$inferSelect;
export type NuevoHolding = typeof holdings.$inferInsert;
