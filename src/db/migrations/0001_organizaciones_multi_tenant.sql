-- Migración AUT-128: Agregar tabla organizaciones como raíz del modelo
-- Modifica fundos y users para soporte multi-tenant.
-- Nueva tabla user_fundos para relación N:M usuarios-fundos.
-- Nueva tabla organizaciones.
-- Rol enum: se agrega admin_org.

--> statement-breakpoint
CREATE TABLE "organizaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"rut" varchar(20),
	"plan" varchar(50) DEFAULT 'basic' NOT NULL,
	"modulos" jsonb DEFAULT '{}'::jsonb,
	"config" jsonb DEFAULT '{}'::jsonb,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizaciones_rut_unique" UNIQUE("rut")
);
--> statement-breakpoint

-- Seed inicial: org JP Ferrada
INSERT INTO "organizaciones" ("nombre", "plan", "modulos")
VALUES ('JP Ferrada', 'pro', '{"feedlot": true, "crianza": true}'::jsonb);
--> statement-breakpoint

-- Agregar org_id a fundos (nullable primero para backfill)
ALTER TABLE "fundos" ADD COLUMN "org_id" integer;
--> statement-breakpoint

-- Asignar org_id a todos los fundos existentes (la org recién creada)
UPDATE "fundos" SET "org_id" = (SELECT id FROM "organizaciones" WHERE nombre = 'JP Ferrada' LIMIT 1);
--> statement-breakpoint

-- Hacer org_id NOT NULL y agregar FK
ALTER TABLE "fundos" ALTER COLUMN "org_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "fundos" ADD CONSTRAINT "fundos_org_id_organizaciones_id_fk"
  FOREIGN KEY ("org_id") REFERENCES "public"."organizaciones"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint

-- Extender enum rol con admin_org
ALTER TYPE "public"."rol" ADD VALUE IF NOT EXISTS 'admin_org';
--> statement-breakpoint

-- Agregar org_id a users (nullable primero para backfill)
ALTER TABLE "users" ADD COLUMN "org_id" integer;
--> statement-breakpoint

-- Backfill org_id en users desde la org de su fundo
UPDATE "users" u
SET "org_id" = f."org_id"
FROM "fundos" f
WHERE u."fundo_id" = f."id";
--> statement-breakpoint

-- Hacer org_id NOT NULL y agregar FK
ALTER TABLE "users" ALTER COLUMN "org_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organizaciones_id_fk"
  FOREIGN KEY ("org_id") REFERENCES "public"."organizaciones"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint

-- Eliminar FK de users.fundo_id
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_fundo_id_fundos_id_fk";
--> statement-breakpoint

-- Eliminar columna fundo_id de users
ALTER TABLE "users" DROP COLUMN "fundo_id";
--> statement-breakpoint

-- Crear tabla user_fundos
CREATE TABLE "user_fundos" (
	"user_id" integer NOT NULL,
	"fundo_id" integer NOT NULL,
	"rol" "rol" DEFAULT 'operador' NOT NULL,
	CONSTRAINT "user_fundos_user_id_fundo_id_pk" PRIMARY KEY("user_id","fundo_id")
);
--> statement-breakpoint
ALTER TABLE "user_fundos" ADD CONSTRAINT "user_fundos_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_fundos" ADD CONSTRAINT "user_fundos_fundo_id_fundos_id_fk"
  FOREIGN KEY ("fundo_id") REFERENCES "public"."fundos"("id") ON DELETE cascade ON UPDATE no action;
