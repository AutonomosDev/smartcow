-- Migration: 0015_chat_cache
-- AUT-265: Query caching del chat ganadero.
-- Guarda preguntas + respuestas con TTL dinámico (15/30/60 min) según tipo de query.
-- Hash sha256 sobre (predio_id, pregunta normalizada). Invalidación on write.
-- Fuente de verdad: .claude/references/config/llm-routing-and-budget.yaml
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_cache" (
  "id" serial PRIMARY KEY NOT NULL,
  "predio_id" integer,
  "user_id" integer NOT NULL,
  "question_hash" text NOT NULL,
  "question_text" text NOT NULL,
  "response_text" text NOT NULL,
  "artifact_json" jsonb,
  "model_used" text NOT NULL,
  "tokens_saved_estimate" integer DEFAULT 0 NOT NULL,
  "hits" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_cache_hash_idx" ON "chat_cache" ("question_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_cache_predio_expires_idx" ON "chat_cache" ("predio_id", "expires_at");
