import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { predios } from "./predios";

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  predioId: integer("predio_id")
    .references(() => predios.id, { onDelete: "restrict" }),
  titulo: text("titulo").notNull(),
  creadoEn: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  actualizadoEn: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type NuevaChatSession = typeof chatSessions.$inferInsert;
