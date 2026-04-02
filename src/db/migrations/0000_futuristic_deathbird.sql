CREATE TYPE "public"."rol" AS ENUM('admin', 'operador', 'veterinario', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."estado_animal" AS ENUM('activo', 'baja', 'desecho');--> statement-breakpoint
CREATE TYPE "public"."sexo" AS ENUM('M', 'H');--> statement-breakpoint
CREATE TYPE "public"."resultado_parto" AS ENUM('vivo', 'muerto', 'aborto', 'gemelar');--> statement-breakpoint
CREATE TYPE "public"."resultado_inseminacion" AS ENUM('preñada', 'vacia', 'pendiente');--> statement-breakpoint
CREATE TYPE "public"."resultado_ecografia" AS ENUM('preñada', 'vacia', 'dudosa');--> statement-breakpoint
CREATE TYPE "public"."tipo_areteo" AS ENUM('alta', 'aparicion', 'cambio_diio');--> statement-breakpoint
CREATE TABLE "fundos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"region" varchar(100),
	"config" jsonb DEFAULT '{}'::jsonb,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"fundo_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"rol" "rol" DEFAULT 'operador' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "baja_causa" (
	"id" serial PRIMARY KEY NOT NULL,
	"motivo_id" integer NOT NULL,
	"nombre" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "baja_motivo" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	CONSTRAINT "baja_motivo_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "estado_reproductivo" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	CONSTRAINT "estado_reproductivo_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "inseminadores" (
	"id" serial PRIMARY KEY NOT NULL,
	"fundo_id" integer NOT NULL,
	"nombre" varchar(200) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "razas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	CONSTRAINT "razas_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "semen" (
	"id" serial PRIMARY KEY NOT NULL,
	"fundo_id" integer NOT NULL,
	"toro" varchar(200) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subtipo_parto" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo_parto_id" integer NOT NULL,
	"nombre" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tipo_ganado" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	CONSTRAINT "tipo_ganado_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "tipo_parto" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	CONSTRAINT "tipo_parto_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "animales" (
	"id" serial PRIMARY KEY NOT NULL,
	"fundo_id" integer NOT NULL,
	"diio" varchar(50) NOT NULL,
	"eid" varchar(50),
	"tipo_ganado_id" integer NOT NULL,
	"raza_id" integer,
	"sexo" "sexo" NOT NULL,
	"fecha_nacimiento" date,
	"estado_reproductivo_id" integer,
	"estado" "estado_animal" DEFAULT 'activo' NOT NULL,
	"diio_madre" varchar(50),
	"padre" varchar(200),
	"abuelo" varchar(200),
	"origen" varchar(200),
	"observaciones" varchar(500),
	"desecho" boolean DEFAULT false NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pesajes" (
	"id" serial PRIMARY KEY NOT NULL,
	"fundo_id" integer NOT NULL,
	"animal_id" integer NOT NULL,
	"peso_kg" numeric(8, 2) NOT NULL,
	"fecha" date NOT NULL,
	"dispositivo" varchar(100),
	"usuario_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partos" (
	"id" serial PRIMARY KEY NOT NULL,
	"fundo_id" integer NOT NULL,
	"madre_id" integer NOT NULL,
	"fecha" date NOT NULL,
	"resultado" "resultado_parto" NOT NULL,
	"cria_id" integer,
	"tipo_ganado_cria_id" integer,
	"tipo_parto_id" integer,
	"subtipo_parto_id" integer,
	"semen_id" integer,
	"inseminador_id" integer,
	"numero_partos" integer,
	"observaciones" varchar(500),
	"usuario_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inseminaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"fundo_id" integer NOT NULL,
	"animal_id" integer NOT NULL,
	"fecha" date NOT NULL,
	"semen_id" integer,
	"inseminador_id" integer,
	"resultado" "resultado_inseminacion" DEFAULT 'pendiente' NOT NULL,
	"observaciones" varchar(500),
	"usuario_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecografias" (
	"id" serial PRIMARY KEY NOT NULL,
	"fundo_id" integer NOT NULL,
	"animal_id" integer NOT NULL,
	"fecha" date NOT NULL,
	"resultado" "resultado_ecografia" NOT NULL,
	"dias_gestacion" integer,
	"observaciones" varchar(500),
	"usuario_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "areteos" (
	"id" serial PRIMARY KEY NOT NULL,
	"fundo_id" integer NOT NULL,
	"animal_id" integer NOT NULL,
	"tipo" "tipo_areteo" NOT NULL,
	"fecha" date NOT NULL,
	"diio_nuevo" varchar(50) NOT NULL,
	"diio_anterior" varchar(50),
	"observaciones" varchar(500),
	"usuario_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bajas" (
	"id" serial PRIMARY KEY NOT NULL,
	"fundo_id" integer NOT NULL,
	"animal_id" integer NOT NULL,
	"fecha" date NOT NULL,
	"motivo_id" integer NOT NULL,
	"causa_id" integer,
	"peso_kg" numeric(8, 2),
	"observaciones" varchar(500),
	"usuario_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_fundo_id_fundos_id_fk" FOREIGN KEY ("fundo_id") REFERENCES "public"."fundos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baja_causa" ADD CONSTRAINT "baja_causa_motivo_id_baja_motivo_id_fk" FOREIGN KEY ("motivo_id") REFERENCES "public"."baja_motivo"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inseminadores" ADD CONSTRAINT "inseminadores_fundo_id_fundos_id_fk" FOREIGN KEY ("fundo_id") REFERENCES "public"."fundos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semen" ADD CONSTRAINT "semen_fundo_id_fundos_id_fk" FOREIGN KEY ("fundo_id") REFERENCES "public"."fundos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subtipo_parto" ADD CONSTRAINT "subtipo_parto_tipo_parto_id_tipo_parto_id_fk" FOREIGN KEY ("tipo_parto_id") REFERENCES "public"."tipo_parto"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "animales" ADD CONSTRAINT "animales_fundo_id_fundos_id_fk" FOREIGN KEY ("fundo_id") REFERENCES "public"."fundos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "animales" ADD CONSTRAINT "animales_tipo_ganado_id_tipo_ganado_id_fk" FOREIGN KEY ("tipo_ganado_id") REFERENCES "public"."tipo_ganado"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "animales" ADD CONSTRAINT "animales_raza_id_razas_id_fk" FOREIGN KEY ("raza_id") REFERENCES "public"."razas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "animales" ADD CONSTRAINT "animales_estado_reproductivo_id_estado_reproductivo_id_fk" FOREIGN KEY ("estado_reproductivo_id") REFERENCES "public"."estado_reproductivo"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pesajes" ADD CONSTRAINT "pesajes_fundo_id_fundos_id_fk" FOREIGN KEY ("fundo_id") REFERENCES "public"."fundos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pesajes" ADD CONSTRAINT "pesajes_animal_id_animales_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pesajes" ADD CONSTRAINT "pesajes_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partos" ADD CONSTRAINT "partos_fundo_id_fundos_id_fk" FOREIGN KEY ("fundo_id") REFERENCES "public"."fundos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partos" ADD CONSTRAINT "partos_madre_id_animales_id_fk" FOREIGN KEY ("madre_id") REFERENCES "public"."animales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partos" ADD CONSTRAINT "partos_cria_id_animales_id_fk" FOREIGN KEY ("cria_id") REFERENCES "public"."animales"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partos" ADD CONSTRAINT "partos_tipo_ganado_cria_id_tipo_ganado_id_fk" FOREIGN KEY ("tipo_ganado_cria_id") REFERENCES "public"."tipo_ganado"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partos" ADD CONSTRAINT "partos_tipo_parto_id_tipo_parto_id_fk" FOREIGN KEY ("tipo_parto_id") REFERENCES "public"."tipo_parto"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partos" ADD CONSTRAINT "partos_subtipo_parto_id_subtipo_parto_id_fk" FOREIGN KEY ("subtipo_parto_id") REFERENCES "public"."subtipo_parto"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partos" ADD CONSTRAINT "partos_semen_id_semen_id_fk" FOREIGN KEY ("semen_id") REFERENCES "public"."semen"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partos" ADD CONSTRAINT "partos_inseminador_id_inseminadores_id_fk" FOREIGN KEY ("inseminador_id") REFERENCES "public"."inseminadores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partos" ADD CONSTRAINT "partos_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inseminaciones" ADD CONSTRAINT "inseminaciones_fundo_id_fundos_id_fk" FOREIGN KEY ("fundo_id") REFERENCES "public"."fundos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inseminaciones" ADD CONSTRAINT "inseminaciones_animal_id_animales_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inseminaciones" ADD CONSTRAINT "inseminaciones_semen_id_semen_id_fk" FOREIGN KEY ("semen_id") REFERENCES "public"."semen"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inseminaciones" ADD CONSTRAINT "inseminaciones_inseminador_id_inseminadores_id_fk" FOREIGN KEY ("inseminador_id") REFERENCES "public"."inseminadores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inseminaciones" ADD CONSTRAINT "inseminaciones_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecografias" ADD CONSTRAINT "ecografias_fundo_id_fundos_id_fk" FOREIGN KEY ("fundo_id") REFERENCES "public"."fundos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecografias" ADD CONSTRAINT "ecografias_animal_id_animales_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ecografias" ADD CONSTRAINT "ecografias_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "areteos" ADD CONSTRAINT "areteos_fundo_id_fundos_id_fk" FOREIGN KEY ("fundo_id") REFERENCES "public"."fundos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "areteos" ADD CONSTRAINT "areteos_animal_id_animales_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "areteos" ADD CONSTRAINT "areteos_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bajas" ADD CONSTRAINT "bajas_fundo_id_fundos_id_fk" FOREIGN KEY ("fundo_id") REFERENCES "public"."fundos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bajas" ADD CONSTRAINT "bajas_animal_id_animales_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bajas" ADD CONSTRAINT "bajas_motivo_id_baja_motivo_id_fk" FOREIGN KEY ("motivo_id") REFERENCES "public"."baja_motivo"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bajas" ADD CONSTRAINT "bajas_causa_id_baja_causa_id_fk" FOREIGN KEY ("causa_id") REFERENCES "public"."baja_causa"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bajas" ADD CONSTRAINT "bajas_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "animales_fundo_diio_idx" ON "animales" USING btree ("fundo_id","diio");--> statement-breakpoint
CREATE INDEX "animales_fundo_estado_idx" ON "animales" USING btree ("fundo_id","estado");--> statement-breakpoint
CREATE INDEX "pesajes_animal_fecha_idx" ON "pesajes" USING btree ("animal_id","fecha");--> statement-breakpoint
CREATE INDEX "pesajes_fundo_fecha_idx" ON "pesajes" USING btree ("fundo_id","fecha");--> statement-breakpoint
CREATE INDEX "partos_madre_fecha_idx" ON "partos" USING btree ("madre_id","fecha");--> statement-breakpoint
CREATE INDEX "partos_fundo_fecha_idx" ON "partos" USING btree ("fundo_id","fecha");--> statement-breakpoint
CREATE INDEX "inseminaciones_animal_fecha_idx" ON "inseminaciones" USING btree ("animal_id","fecha");--> statement-breakpoint
CREATE INDEX "inseminaciones_fundo_fecha_idx" ON "inseminaciones" USING btree ("fundo_id","fecha");--> statement-breakpoint
CREATE INDEX "ecografias_animal_fecha_idx" ON "ecografias" USING btree ("animal_id","fecha");--> statement-breakpoint
CREATE INDEX "ecografias_fundo_fecha_idx" ON "ecografias" USING btree ("fundo_id","fecha");--> statement-breakpoint
CREATE INDEX "areteos_animal_fecha_idx" ON "areteos" USING btree ("animal_id","fecha");--> statement-breakpoint
CREATE INDEX "areteos_fundo_tipo_idx" ON "areteos" USING btree ("fundo_id","tipo");--> statement-breakpoint
CREATE INDEX "bajas_animal_idx" ON "bajas" USING btree ("animal_id");--> statement-breakpoint
CREATE INDEX "bajas_fundo_fecha_idx" ON "bajas" USING btree ("fundo_id","fecha");