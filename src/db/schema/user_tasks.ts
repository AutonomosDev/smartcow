import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { organizaciones } from "./organizaciones";

export const userTasks = pgTable("user_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizaciones.id, { onDelete: "restrict" }),
  titulo: text("titulo").notNull(),
  asignadoA: integer("asignado_a")
    .references(() => users.id, { onDelete: "set null" }),
  estado: text("estado").notNull().default("pendiente"),
  creadoEn: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
});

export type UserTask = typeof userTasks.$inferSelect;
export type NuevaUserTask = typeof userTasks.$inferInsert;
