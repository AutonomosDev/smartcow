-- Migration: 0018_user_memory
-- AUT-270: Memoria persistente del usuario para el chat ganadero.
-- Patrón Claude Memory Tool nativa (Anthropic Sonnet 4.6) — client-side storage.
-- Ref: https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_memory" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "key" text NOT NULL,
  "value" text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_memory" ADD CONSTRAINT "user_memory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_memory_user_id_key_unique" ON "user_memory" ("user_id", "key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_memory_user_id_idx" ON "user_memory" ("user_id");
