import {
  pgTable,
  serial,
  integer,
  numeric,
  date,
  varchar,
  boolean,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { predios } from "./predios";
import { animales } from "./animales";
import { users } from "./users";

/**
 * pesajes — Registro de pesajes de animales (kg).
 * Origen: módulo Pesaje2 de AgroApp + carga manual.
 *
 * Campos agroapp (AUT-297, W2):
 *   edad_meses       — edad del animal en meses al momento del pesaje (copia de xlsx)
 *   observaciones    — texto libre del xlsx (puede contener marcadores)
 *   es_peso_llegada  — true para el primer pesaje de un animal en el predio destino
 *                      (se marca en post-proceso tras el import masivo)
 * dispositivo:
 *   'agroapp_venta'  — pesaje inferido al momento de venta (obs="PESAJE DESDE VENTA")
 *   null o 'agroapp' — pesaje normal desde módulo Pesaje2
 */
export const pesajes = pgTable(
  "pesajes",
  {
    id: serial("id").primaryKey(),
    predioId: integer("predio_id")
      .notNull()
      .references(() => predios.id, { onDelete: "restrict" }),
    animalId: integer("animal_id")
      .notNull()
      .references(() => animales.id, { onDelete: "restrict" }),
    pesoKg: numeric("peso_kg", { precision: 8, scale: 2 }).notNull(),
    fecha: date("fecha").notNull(),
    dispositivo: varchar("dispositivo", { length: 100 }),
    edadMeses: numeric("edad_meses", { precision: 5, scale: 1 }),
    observaciones: text("observaciones"),
    esPesoLlegada: boolean("es_peso_llegada").notNull().default(false),
    tipoPesaje: varchar("tipo_pesaje", { length: 20 }).notNull().default("rutina"),
    usuarioId: integer("usuario_id").references(() => users.id, { onDelete: "set null" }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("pesajes_animal_fecha_idx").on(t.animalId, t.fecha),
    index("pesajes_predio_fecha_idx").on(t.predioId, t.fecha),
    // Idempotencia: mismo animal + fecha + peso = dup. AgroApp no expone id estable.
    uniqueIndex("uq_pesajes_animal_fecha_peso").on(t.animalId, t.fecha, t.pesoKg),
  ]
);

export type Pesaje = typeof pesajes.$inferSelect;
export type NuevoPesaje = typeof pesajes.$inferInsert;
