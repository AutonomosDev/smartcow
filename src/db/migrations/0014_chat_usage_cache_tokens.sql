-- Migration: 0014_chat_usage_cache_tokens
-- AUT-263: Agregar columnas de cache tokens a chat_usage.
-- Anthropic SDK reporta cache_creation_input_tokens y cache_read_input_tokens
-- en message_start.usage. Precios según llm-routing-and-budget.yaml § models.
--> statement-breakpoint
ALTER TABLE "chat_usage"
  ADD COLUMN IF NOT EXISTS "cache_read_tokens" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "chat_usage"
  ADD COLUMN IF NOT EXISTS "cache_write_tokens" integer DEFAULT 0 NOT NULL;
