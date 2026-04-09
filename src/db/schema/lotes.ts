import {
  pgTable,
  serial,
  integer,
  numeric,
  date,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { predios } from "./predios";
import { organizaciones } from "./organizaciones";
import { animales } from "./animales";

/**
 * lotes — Lote de engorda (feedlot). Agrupa animales con objetivo de peso.
 * Solo activo si org.modulos.feedlot = true.
 *
 * KPI principal: GDP (ganancia diaria de peso).
 * GDP se calcula en query: (peso_actual - peso_entrada) / días_en_lote.
 */
export const lotes = pgTable(
  "lotes",
  {
    id: serial("id").primaryKey(),
    predioId: integer("predio_id")
      .notNull()
      .references(() => predios.id, { onDelete: "restrict" }),
    orgId: integer("org_id")
      .notNull()
      .references(() => organizaciones.id, { onDelete: "restrict" }),
    nombre: varchar("nombre", { length: 200 }).notNull(),
    fechaEntrada: date("fecha_entrada").notNull(),
    fechaSalidaEstimada: date("fecha_salida_estimada"),
    objetivoPesoKg: numeric("objetivo_peso_kg", { precision: 8, scale: 2 }),
    estado: varchar("estado", { length: 50 }).notNull().default("activo"),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("lotes_predio_estado_idx").on(t.predioId, t.estado),
    index("lotes_org_idx").on(t.orgId),
  ]
);

/**
 * lote_animales — Tabla de unión entre lotes y animales.
 * Registra entrada/salida del lote y pesos en esos momentos.
 * Con peso_entrada_kg y fecha_entrada se puede calcular GDP por animal.
 */
export const loteAnimales = pgTable(
  "lote_animales",
  {
    id: serial("id").primaryKey(),
    loteId: integer("lote_id")
      .notNull()
      .references(() => lotes.id, { onDelete: "restrict" }),
    animalId: integer("animal_id")
      .notNull()
      .references(() => animales.id, { onDelete: "restrict" }),
    fechaEntrada: date("fecha_entrada").notNull(),
    fechaSalida: date("fecha_salida"),
    pesoEntradaKg: numeric("peso_entrada_kg", { precision: 8, scale: 2 }),
    pesoSalidaKg: numeric("peso_salida_kg", { precision: 8, scale: 2 }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("lote_animales_lote_idx").on(t.loteId),
    index("lote_animales_animal_idx").on(t.animalId),
    index("lote_animales_lote_animal_idx").on(t.loteId, t.animalId),
  ]
);

export type Lote = typeof lotes.$inferSelect;
export type NuevoLote = typeof lotes.$inferInsert;
export type LoteAnimal = typeof loteAnimales.$inferSelect;
export type NuevoLoteAnimal = typeof loteAnimales.$inferInsert;
