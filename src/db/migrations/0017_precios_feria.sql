-- Migration: 0017_precios_feria
-- AUT-267: Histórico de precios de feria ganadera (ODEPA, Tattersall, ...).
-- Usada por el chat para comparaciones históricas de precio
-- (ej: "a cuánto estaba el novillo gordo hace un año vs hoy").
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "precios_feria" (
  "id" serial PRIMARY KEY NOT NULL,
  "fuente" text NOT NULL,
  "feria" text NOT NULL,
  "categoria" text NOT NULL,
  "peso_rango" text,
  "fecha" date NOT NULL,
  "precio_kg_clp" numeric(10, 2),
  "precio_cabeza_clp" numeric(12, 2),
  "moneda" text DEFAULT 'CLP' NOT NULL,
  "url_fuente" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "precios_feria_fecha_idx" ON "precios_feria" ("fecha" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "precios_feria_categoria_fecha_idx" ON "precios_feria" ("categoria", "fecha" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "precios_feria_feria_categoria_fecha_idx" ON "precios_feria" ("feria", "categoria", "fecha" DESC);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "precios_feria_unique_idx" ON "precios_feria" ("fuente", "feria", "categoria", COALESCE("peso_rango", ''), "fecha");
