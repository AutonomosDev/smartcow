import { pgTable, serial, varchar, text, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * fundos — Predio / establecimiento ganadero.
 * Unidad organizacional raíz. Toda tabla de dominio lleva fundo_id.
 */
export const fundos = pgTable("fundos", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  region: varchar("region", { length: 100 }),
  config: jsonb("config").$type<Record<string, unknown>>().default({}),
  creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true }).defaultNow().notNull(),
});

export type Fundo = typeof fundos.$inferSelect;
export type NuevoFundo = typeof fundos.$inferInsert;
