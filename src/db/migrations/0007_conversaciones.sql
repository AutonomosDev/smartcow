-- Migration: 0007_conversaciones
-- Tabla de historial de conversaciones del chat IA.
-- Scoped por user_id — el historial es personal, no del predio.
-- mensajes: jsonb array de { role: "user"|"assistant", content: string }
-- Ticket: AUT-144

CREATE TABLE "conversaciones" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "predio_id" integer NOT NULL REFERENCES "predios"("id") ON DELETE RESTRICT,
  "titulo" varchar(300) NOT NULL,
  "mensajes" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL,
  "actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
