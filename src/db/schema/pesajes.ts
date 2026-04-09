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
import { animales } from "./animales";
import { users } from "./users";

/**
 * pesajes — Registro de pesajes de animales (kg).
 * Origen: módulo Pesaje2 de AgroApp.
 * Soporta carga masiva via Excel (Formato Pesaje.xlsx).
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
    usuarioId: integer("usuario_id").references(() => users.id, { onDelete: "set null" }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("pesajes_animal_fecha_idx").on(t.animalId, t.fecha),
    index("pesajes_predio_fecha_idx").on(t.predioId, t.fecha),
  ]
);

export type Pesaje = typeof pesajes.$inferSelect;
export type NuevoPesaje = typeof pesajes.$inferInsert;
