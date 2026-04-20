-- Migration: 0013_chat_usage
-- AUT-263: Tabla de tracking de requests al LLM por organización
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_usage" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "org_id" integer NOT NULL REFERENCES "organizaciones"("id"),
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "session_id" text,
  "predio_id" integer,
  "model_id" text NOT NULL,
  "tier" text NOT NULL,
  "tokens_in" integer NOT NULL,
  "tokens_out" integer NOT NULL,
  "cost_usd" numeric(10, 6) NOT NULL,
  "tool_calls" integer DEFAULT 0,
  "had_artifact" boolean DEFAULT false,
  "latency_ms" integer,
  "error" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_usage_org_created_idx" ON "chat_usage" ("org_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_usage_user_created_idx" ON "chat_usage" ("user_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_usage_model_created_idx" ON "chat_usage" ("model_id", "created_at");
