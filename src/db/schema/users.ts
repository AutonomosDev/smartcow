import { pgTable, serial, integer, varchar, pgEnum, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { organizaciones } from "./organizaciones.js";
import { fundos } from "./fundos.js";

export const rolEnum = pgEnum("rol", ["superadmin", "admin_org", "admin_fundo", "operador", "veterinario", "viewer"]);

/**
 * users — Usuarios del sistema.
 * Pertenecen a una organización. El acceso a fundos específicos se gestiona via user_fundos.
 * passwordHash: bcrypt hash de la contraseña. Nunca exponer en logs ni responses.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizaciones.id, { onDelete: "restrict" }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  rol: rolEnum("rol").notNull().default("operador"),
  creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * user_fundos — Relación N:M entre users y fundos.
 * Un operador puede tener acceso a N fundos dentro de su org.
 * admin_org ve todos los fundos de su org sin necesitar registro aquí.
 */
export const userFundos = pgTable(
  "user_fundos",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fundoId: integer("fundo_id")
      .notNull()
      .references(() => fundos.id, { onDelete: "cascade" }),
    rol: rolEnum("rol").notNull().default("operador"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.fundoId] })]
);

export type User = typeof users.$inferSelect;
export type NuevoUser = typeof users.$inferInsert;
export type UserFundo = typeof userFundos.$inferSelect;
export type NuevoUserFundo = typeof userFundos.$inferInsert;
