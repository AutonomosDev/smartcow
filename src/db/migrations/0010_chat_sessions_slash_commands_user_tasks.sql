-- Migration: 0010_chat_sessions_slash_commands_user_tasks
-- AUT-250: Tablas para sidebar dinámica del chat web
--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"predio_id" integer,
	"titulo" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slash_commands" (
	"id" serial PRIMARY KEY NOT NULL,
	"comando" text NOT NULL,
	"label" text NOT NULL,
	"modulo" text,
	"prompt_template" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "slash_commands_comando_unique" UNIQUE("comando")
);
--> statement-breakpoint
CREATE TABLE "user_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"org_id" integer NOT NULL,
	"titulo" text NOT NULL,
	"asignado_a" integer,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"due_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_predio_id_predios_id_fk" FOREIGN KEY ("predio_id") REFERENCES "public"."predios"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_tasks" ADD CONSTRAINT "user_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_tasks" ADD CONSTRAINT "user_tasks_org_id_organizaciones_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizaciones"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_tasks" ADD CONSTRAINT "user_tasks_asignado_a_users_id_fk" FOREIGN KEY ("asignado_a") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "slash_commands" ("comando", "label", "modulo", "prompt_template", "orden") VALUES
  ('/feedlot', 'Feedlot', 'feedlot', 'Muéstrame el resumen del feedlot activo', 1),
  ('/FT', 'Feria terneros', 'feedlot', 'Dame los datos para la próxima feria de terneros', 2),
  ('/vaquillas', 'Vaquillas', 'crianza', 'Muéstrame el estado de las vaquillas', 3),
  ('/partos', 'Partos', 'crianza', 'Muéstrame los últimos partos registrados', 4),
  ('/tratamientos', 'Tratamientos', NULL, 'Muéstrame los últimos tratamientos aplicados', 5),
  ('/ventas', 'Ventas', NULL, 'Muéstrame el resumen de ventas recientes', 6);
