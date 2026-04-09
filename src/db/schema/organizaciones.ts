import { pgTable, serial, varchar, text, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * organizaciones — Raíz del modelo multi-tenant.
 * Cada organización agrupa N fundos.
 *
 * modulos: feature flags por org (ej. { feedlot: true, crianza: true })
 * plan: tier de suscripción (ej. "basic", "pro", "enterprise")
 */
export const organizaciones = pgTable("organizaciones", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  rut: varchar("rut", { length: 20 }).unique(),
  plan: varchar("plan", { length: 50 }).notNull().default("basic"),
  modulos: jsonb("modulos").$type<Record<string, boolean>>().default({}),
  config: jsonb("config").$type<Record<string, unknown>>().default({}),
  creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
});

export type Organizacion = typeof organizaciones.$inferSelect;
export type NuevaOrganizacion = typeof organizaciones.$inferInsert;
