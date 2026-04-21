import {
  pgTable,
  serial,
  integer,
  text,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * chat_cache — Query caching para el chat ganadero (AUT-265).
 * TTL dinámico según tipo de pregunta (15/30/60 min).
 * Hash sha256 sobre (predio_id, pregunta normalizada).
 * Invalidación: on write (registrar_pesaje/parto) vía invalidatePredio().
 */
export const chatCache = pgTable("chat_cache", {
  id: serial("id").primaryKey(),
  predioId: integer("predio_id"),
  userId: integer("user_id").notNull(),
  questionHash: text("question_hash").notNull(),
  questionText: text("question_text").notNull(),
  responseText: text("response_text").notNull(),
  artifactJson: jsonb("artifact_json"),
  modelUsed: text("model_used").notNull(),
  tokensSavedEstimate: integer("tokens_saved_estimate").default(0).notNull(),
  hits: integer("hits").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export type ChatCache = typeof chatCache.$inferSelect;
export type NewChatCache = typeof chatCache.$inferInsert;
