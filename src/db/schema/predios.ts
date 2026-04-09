import { pgTable, serial, integer, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { organizaciones } from "./organizaciones";

/**
 * predios — Predio / establecimiento ganadero.
 * Pertenece a una organización. Toda tabla de dominio lleva predio_id.
 */
export const predios = pgTable("predios", {
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

export type Predio = typeof predios.$inferSelect;
export type NuevoPredio = typeof predios.$inferInsert;
