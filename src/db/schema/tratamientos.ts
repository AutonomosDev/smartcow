import {
  pgTable,
  serial,
  integer,
  varchar,
  date,
  time,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { predios } from "./predios";
import { animales } from "./animales";
import { users } from "./users";

export const tratamientos = pgTable(
  "tratamientos",
  {
    id: serial("id").primaryKey(),
    predioId: integer("predio_id")
      .notNull()
      .references(() => predios.id, { onDelete: "restrict" }),
    animalId: integer("animal_id")
      .notNull()
      .references(() => animales.id, { onDelete: "restrict" }),
    fecha: date("fecha").notNull(),
    horaRegistro: time("hora_registro"),
    idAgroapp: varchar("id_agroapp", { length: 20 }),
    diagnostico: varchar("diagnostico", { length: 300 }),
    observaciones: varchar("observaciones", { length: 500 }),
    medicamentos: jsonb("medicamentos").$type<
      { nombre: string | null; dosis: string | null; lote: string | null }[]
    >(),
    usuarioId: integer("usuario_id").references(() => users.id, { onDelete: "set null" }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("tratamientos_animal_fecha_idx").on(t.animalId, t.fecha),
    index("tratamientos_predio_fecha_idx").on(t.predioId, t.fecha),
    index("tratamientos_diagnostico_idx").on(t.diagnostico),
  ]
);

export type Tratamiento = typeof tratamientos.$inferSelect;
export type NuevoTratamiento = typeof tratamientos.$inferInsert;
