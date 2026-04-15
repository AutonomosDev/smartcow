import { pgTable, serial, integer, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { predios } from "./predios";

/**
 * conversaciones — Historial de conversaciones del chat IA.
 * Scoped por user_id — el historial es personal, no del predio.
 * mensajes: array de { role: "user"|"assistant", content: string }
 * Ticket: AUT-144
 */

export type MensajeChat = {
  role: "user" | "assistant";
  content: string;
};

export const conversaciones = pgTable("conversaciones", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  predioId: integer("predio_id")
    .notNull()
    .references(() => predios.id, { onDelete: "restrict" }),
  titulo: varchar("titulo", { length: 300 }).notNull(),
  mensajes: jsonb("mensajes").$type<MensajeChat[]>().notNull().default([]),
  creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true }).defaultNow().notNull(),
});

export type Conversacion = typeof conversaciones.$inferSelect;
export type NuevaConversacion = typeof conversaciones.$inferInsert;
