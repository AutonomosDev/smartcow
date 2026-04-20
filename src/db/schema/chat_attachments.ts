import { pgTable, serial, integer, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { predios } from "./predios";
import { chatSessions } from "./chat_sessions";

export const chatAttachments = pgTable("chat_attachments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  predioId: integer("predio_id")
    .notNull()
    .references(() => predios.id, { onDelete: "restrict" }),
  sessionId: integer("session_id")
    .references(() => chatSessions.id, { onDelete: "set null" }),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  columnas: text("columnas").array().notNull(),
  contenidoJson: jsonb("contenido_json").notNull(),
  filasCount: integer("filas_count").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ChatAttachment = typeof chatAttachments.$inferSelect;
export type NuevaChatAttachment = typeof chatAttachments.$inferInsert;
