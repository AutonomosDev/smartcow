import {
  pgTable,
  serial,
  integer,
  varchar,
  boolean,
  date,
  text,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { predios } from "./predios";
import { animales } from "./animales";

/**
 * corrales — Corrales físicos dentro de la operación Feedlot (predio_id=14).
 * AUT-333 Capa 4: galpones 1-5, letras A-L.
 */
export const corrales = pgTable(
  "corrales",
  {
    id: serial("id").primaryKey(),
    predioId: integer("predio_id")
      .notNull()
      .references(() => predios.id, { onDelete: "restrict" }),
    galpon: integer("galpon").notNull(),
    letra: varchar("letra", { length: 2 }).notNull(),
    nombre: varchar("nombre", { length: 20 }).notNull(),
    capacidad: integer("capacidad").notNull().default(100),
    activo: boolean("activo").notNull().default(true),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique("uq_corrales_predio_galpon_letra").on(t.predioId, t.galpon, t.letra)]
);

/**
 * corral_animales — Historial de asignación animal → corral.
 * fecha_salida IS NULL = ubicación actual del animal.
 */
export const corralAnimales = pgTable(
  "corral_animales",
  {
    id: serial("id").primaryKey(),
    corralId: integer("corral_id")
      .notNull()
      .references(() => corrales.id, { onDelete: "restrict" }),
    animalId: integer("animal_id")
      .notNull()
      .references(() => animales.id, { onDelete: "restrict" }),
    unidadNegocioId: integer("unidad_negocio_id").references(() => predios.id, {
      onDelete: "set null",
    }),
    fechaEntrada: date("fecha_entrada").notNull(),
    fechaSalida: date("fecha_salida"),
    observaciones: text("observaciones"),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    // Partial indexes definidos en migration SQL manual (0027_corrales.sql)
    // Drizzle no soporta WHERE en index vía schema — se omiten aquí.
    index("corral_animales_animal_idx").on(t.animalId),
    index("corral_animales_corral_idx").on(t.corralId),
  ]
);

export type Corral = typeof corrales.$inferSelect;
export type NuevoCorral = typeof corrales.$inferInsert;
export type CorralAnimal = typeof corralAnimales.$inferSelect;
export type NuevoCorralAnimal = typeof corralAnimales.$inferInsert;
