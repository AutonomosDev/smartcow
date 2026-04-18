-- Migration: 0009_agroapp_events
-- AUT-234: Nuevas tablas para datos AgroApp — ventas, tratamientos, traslados
-- Fuente: extracción completa via /Consulta endpoint (fetch_full_v3.py)

CREATE TABLE "ventas" (
	"id" serial PRIMARY KEY NOT NULL,
	"predio_id" integer NOT NULL,
	"animal_id" integer NOT NULL,
	"fecha" date NOT NULL,
	"peso_kg" numeric(8, 2),
	"peso_estimado" numeric(8, 2),
	"venta_id_agroapp" integer,
	"n_animales_rampa" integer,
	"destino" varchar(500),
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tratamientos" (
	"id" serial PRIMARY KEY NOT NULL,
	"predio_id" integer NOT NULL,
	"animal_id" integer NOT NULL,
	"fecha" date NOT NULL,
	"hora_registro" time,
	"id_agroapp" varchar(20),
	"diagnostico" varchar(300),
	"observaciones" varchar(500),
	"medicamentos" jsonb,
	"usuario_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traslados" (
	"id" serial PRIMARY KEY NOT NULL,
	"animal_id" integer NOT NULL,
	"fecha" date NOT NULL,
	"id_agroapp" varchar(20),
	"predio_origen_id" integer,
	"predio_destino_id" integer,
	"fundo_origen_nombre" varchar(200),
	"fundo_destino_nombre" varchar(200),
	"observacion" varchar(500),
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_predio_id_predios_id_fk" FOREIGN KEY ("predio_id") REFERENCES "public"."predios"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_animal_id_animales_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animales"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tratamientos" ADD CONSTRAINT "tratamientos_predio_id_predios_id_fk" FOREIGN KEY ("predio_id") REFERENCES "public"."predios"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tratamientos" ADD CONSTRAINT "tratamientos_animal_id_animales_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animales"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tratamientos" ADD CONSTRAINT "tratamientos_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "traslados" ADD CONSTRAINT "traslados_animal_id_animales_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animales"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "traslados" ADD CONSTRAINT "traslados_predio_origen_id_predios_id_fk" FOREIGN KEY ("predio_origen_id") REFERENCES "public"."predios"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "traslados" ADD CONSTRAINT "traslados_predio_destino_id_predios_id_fk" FOREIGN KEY ("predio_destino_id") REFERENCES "public"."predios"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "ventas_animal_idx" ON "ventas" USING btree ("animal_id");
--> statement-breakpoint
CREATE INDEX "ventas_predio_fecha_idx" ON "ventas" USING btree ("predio_id","fecha");
--> statement-breakpoint
CREATE INDEX "ventas_rampa_idx" ON "ventas" USING btree ("venta_id_agroapp");
--> statement-breakpoint
CREATE INDEX "tratamientos_animal_fecha_idx" ON "tratamientos" USING btree ("animal_id","fecha");
--> statement-breakpoint
CREATE INDEX "tratamientos_predio_fecha_idx" ON "tratamientos" USING btree ("predio_id","fecha");
--> statement-breakpoint
CREATE INDEX "tratamientos_diagnostico_idx" ON "tratamientos" USING btree ("diagnostico");
--> statement-breakpoint
CREATE INDEX "traslados_animal_fecha_idx" ON "traslados" USING btree ("animal_id","fecha");
--> statement-breakpoint
CREATE INDEX "traslados_destino_idx" ON "traslados" USING btree ("predio_destino_id","fecha");
