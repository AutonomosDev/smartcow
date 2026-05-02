-- AUT-391 · kpi_diario: snapshot diario de KPIs por predio.

CREATE TABLE IF NOT EXISTS "kpi_diario" (
    "id" serial PRIMARY KEY NOT NULL,
    "fecha" date NOT NULL,
    "predio_id" integer NOT NULL,
    "total_animales" integer,
    "vacas_prenadas" integer,
    "vacas_vacias" integer,
    "animales_listos_venta" integer,
    "peso_promedio_engorda" numeric(8, 2),
    "peso_promedio_recria" numeric(8, 2),
    "pesajes_dia" integer,
    "outliers_detectados" integer,
    "animales_sin_pesaje_60d" integer,
    "computed_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "kpi_diario"
    ADD CONSTRAINT "kpi_diario_predio_id_predios_id_fk"
    FOREIGN KEY ("predio_id") REFERENCES "predios"("id")
    ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "kpi_diario_fecha_predio_uq"
    ON "kpi_diario" ("fecha", "predio_id");
