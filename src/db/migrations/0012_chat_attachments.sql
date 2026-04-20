-- Migration: 0012_chat_attachments
-- AUT-259: Tabla para archivos CSV/XLSX subidos en el chat (parse client-side, stored as JSON)
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_attachments" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "predio_id" integer NOT NULL,
  "session_id" integer,
  "filename" text NOT NULL,
  "mime_type" text NOT NULL,
  "columnas" text[] NOT NULL,
  "contenido_json" jsonb NOT NULL,
  "filas_count" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_attachments"
  ADD CONSTRAINT "chat_attachments_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chat_attachments"
  ADD CONSTRAINT "chat_attachments_predio_id_predios_id_fk"
  FOREIGN KEY ("predio_id") REFERENCES "public"."predios"("id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chat_attachments"
  ADD CONSTRAINT "chat_attachments_session_id_chat_sessions_id_fk"
  FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id")
  ON DELETE set null ON UPDATE no action;
