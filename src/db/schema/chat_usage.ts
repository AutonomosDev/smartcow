import {
  pgTable,
  bigserial,
  integer,
  text,
  numeric,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { organizaciones } from "./organizaciones";
import { users } from "./users";

/**
 * chat_usage — Tracking de cada request al LLM (AUT-263).
 * Fuente de verdad: .claude/references/config/llm-routing-and-budget.yaml § tracking
 * Retención: 365 días. Índices en (org_id, created_at), (user_id, created_at), (model_id, created_at).
 */
export const chatUsage = pgTable("chat_usage", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizaciones.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  sessionId: text("session_id"),
  predioId: integer("predio_id"),
  modelId: text("model_id").notNull(),
  tier: text("tier").notNull(),
  tokensIn: integer("tokens_in").notNull(),
  tokensOut: integer("tokens_out").notNull(),
  costUsd: numeric("cost_usd", { precision: 10, scale: 6 }).notNull(),
  toolCalls: integer("tool_calls").default(0),
  hadArtifact: boolean("had_artifact").default(false),
  latencyMs: integer("latency_ms"),
  error: text("error"),
});

export type ChatUsage = typeof chatUsage.$inferSelect;
export type NewChatUsage = typeof chatUsage.$inferInsert;
