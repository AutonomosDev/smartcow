/**
 * user_memory — Memoria persistente del usuario para el chat ganadero.
 * Ticket: AUT-270 — Claude Memory Tool nativa (Anthropic Sonnet 4.6).
 *
 * Almacena preferencias, metas y datos persistentes que el LLM decide memorizar
 * via la tool `memory_write`. NO almacena datos transaccionales (pesajes, ventas) —
 * esos viven en sus tablas de dominio.
 *
 * Patrón: key/value simple por usuario. Keys en snake_case (validado en ejecutarTool).
 * Hidratación: app/api/chat/route.ts inyecta todas las filas en el system prompt
 * bajo el bloque "MEMORIA DEL USUARIO (persistente)" antes de cada llamada al modelo.
 *
 * Ref oficial: https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
 */
import { pgTable, serial, integer, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const userMemory = pgTable(
  "user_memory",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("user_memory_user_id_key_unique").on(t.userId, t.key),
    index("user_memory_user_id_idx").on(t.userId),
  ]
);

export type UserMemory = typeof userMemory.$inferSelect;
export type NuevaUserMemory = typeof userMemory.$inferInsert;
