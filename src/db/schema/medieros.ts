import {
  pgTable,
  pgEnum,
  serial,
  integer,
  varchar,
  boolean,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import { organizaciones } from "./organizaciones.js";
import { fundos } from "./fundos.js";

/**
 * tipoPropiedadEnum — distingue animales propios del fundo vs. de mediería.
 * Ticket: AUT-135
 */
export const tipoPropiedadEnum = pgEnum("tipo_propiedad", ["propio", "medieria"]);

/**
 * medieros — Terceros propietarios de animales que operan dentro de un fundo.
 * Un mediero puede tener contrato de participación en cría (porcentaje_part).
 * Sus animales se identifican en la tabla animales con tipo_propiedad = 'medieria'.
 * Ticket: AUT-135
 */
export const medieros = pgTable("medieros", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizaciones.id, { onDelete: "restrict" }),
  fundoId: integer("fundo_id")
    .notNull()
    .references(() => fundos.id, { onDelete: "restrict" }),
  nombre: varchar("nombre", { length: 120 }).notNull(),
  rut: varchar("rut", { length: 12 }),
  contacto: varchar("contacto", { length: 80 }),
  porcentajePart: numeric("porcentaje_part", { precision: 5, scale: 2 }),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
});

export type Mediero = typeof medieros.$inferSelect;
export type NuevoMediero = typeof medieros.$inferInsert;
