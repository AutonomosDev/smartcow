import { pgTable, serial, integer, varchar, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { fundos } from "./fundos.js";

export const rolEnum = pgEnum("rol", ["admin_fundo", "operador", "veterinario", "viewer"]);

/**
 * users — Usuarios del sistema con rol por fundo.
 * passwordHash: bcrypt hash de la contraseña. Nunca exponer en logs ni responses.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fundoId: integer("fundo_id")
    .notNull()
    .references(() => fundos.id, { onDelete: "restrict" }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  rol: rolEnum("rol").notNull().default("operador"),
  creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NuevoUser = typeof users.$inferInsert;
