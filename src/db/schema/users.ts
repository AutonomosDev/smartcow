import { pgTable, serial, integer, varchar, pgEnum, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { organizaciones } from "./organizaciones";
import { predios } from "./predios";

export const rolEnum = pgEnum("rol", ["superadmin", "admin_org", "admin_fundo", "operador", "veterinario", "viewer"]);

/**
 * users — Usuarios del sistema.
 * Pertenecen a una organización. El acceso a predios específicos se gestiona via user_predios.
 * firebaseUid: UID del usuario en Firebase Auth. Vincula identidad Firebase con datos SmartCow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizaciones.id, { onDelete: "restrict" }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  /**
   * passwordHash — hash bcryptjs para autenticación email/password.
   * Nullable: usuarios Google SSO no tienen password.
   * Restaurado en migración 0008 (AUT-215 — eliminación Firebase).
   */
  passwordHash: varchar("password_hash", { length: 255 }),
  /**
   * firebaseUid — DEPRECADO (AUT-215).
   * Mantenido temporalmente para rollback. Eliminar en migración 0009.
   */
  firebaseUid: varchar("firebase_uid", { length: 128 }).unique(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  rol: rolEnum("rol").notNull().default("operador"),
  creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * user_predios — Relación N:M entre users y predios.
 * Un operador puede tener acceso a N predios dentro de su org.
 * admin_org ve todos los predios de su org sin necesitar registro aquí.
 */
export const userPredios = pgTable(
  "user_predios",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    predioId: integer("predio_id")
      .notNull()
      .references(() => predios.id, { onDelete: "cascade" }),
    rol: rolEnum("rol").notNull().default("operador"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.predioId] })]
);

export type User = typeof users.$inferSelect;
export type NuevoUser = typeof users.$inferInsert;
export type UserPredio = typeof userPredios.$inferSelect;
export type NuevoUserPredio = typeof userPredios.$inferInsert;
