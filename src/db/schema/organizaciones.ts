import { pgTable, serial, varchar, text, jsonb, numeric, timestamp } from "drizzle-orm/pg-core";

/**
 * organizaciones — Raíz del modelo multi-tenant.
 * Cada organización agrupa N fundos.
 *
 * modulos: feature flags por org (ej. { feedlot: true, crianza: true })
 * plan: tier de suscripción LLM (free | pro | enterprise) — AUT-264
 * usageCapUsd: cap mensual de gasto LLM en USD (override opcional del default del plan)
 */
export const organizaciones = pgTable("organizaciones", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  rut: varchar("rut", { length: 20 }).unique(),
  plan: text("plan", { enum: ["free", "pro", "enterprise"] }).notNull().default("pro"),
  usageCapUsd: numeric("usage_cap_usd", { precision: 10, scale: 2 }).notNull().default("50.00"),
  modulos: jsonb("modulos").$type<Record<string, boolean>>().default({}),
  config: jsonb("config").$type<Record<string, unknown>>().default({}),
  creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
});

export type Organizacion = typeof organizaciones.$inferSelect;
export type NuevaOrganizacion = typeof organizaciones.$inferInsert;
