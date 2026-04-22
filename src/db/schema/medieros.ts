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
import { organizaciones } from "./organizaciones";
import { predios } from "./predios";

/**
 * tipoPropiedadEnum — distingue animales propios del fundo vs. de mediería.
 * Ticket: AUT-135
 */
export const tipoPropiedadEnum = pgEnum("tipo_propiedad", ["propio", "medieria"]);

/**
 * tipoNegocioEnum — distingue el tipo de negocio del tercero alojado en el predio.
 * Ticket: AUT-296
 *
 *   medieria  → contrato de cría compartida. Los animales son del mediero,
 *               el cliente opera y comparte terneros (porcentaje_part).
 *               Ej: Medieria FT, Medieria Frival, Medieria Oller, Corrales del Sur.
 *
 *   hoteleria → el cliente guarda animales de un tercero en el feedlot
 *               y cobra por servicio (renta / engorda). No hay reparto de crías.
 *               Ej: Mollendo.
 */
export const tipoNegocioEnum = pgEnum("tipo_negocio", ["medieria", "hoteleria"]);

/**
 * medieros — Terceros propietarios de animales que operan dentro de un fundo.
 * Un mediero puede tener contrato de participación en cría (porcentaje_part).
 * Sus animales se identifican en la tabla animales con tipo_propiedad = 'medieria'.
 * Ticket: AUT-135 / AUT-296
 *
 * Renombrado conceptual post AUT-296: la tabla contiene TODOS los terceros
 * alojados (medierías + hotelerías). El campo tipo_negocio los distingue.
 * Nombre de tabla se conserva por compat.
 */
export const medieros = pgTable("medieros", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizaciones.id, { onDelete: "restrict" }),
  predioId: integer("predio_id")
    .notNull()
    .references(() => predios.id, { onDelete: "restrict" }),
  nombre: varchar("nombre", { length: 120 }).notNull(),
  rut: varchar("rut", { length: 12 }),
  contacto: varchar("contacto", { length: 80 }),
  porcentajePart: numeric("porcentaje_part", { precision: 5, scale: 2 }),
  tipoNegocio: tipoNegocioEnum("tipo_negocio").notNull().default("medieria"),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
});

export type Mediero = typeof medieros.$inferSelect;
export type NuevoMediero = typeof medieros.$inferInsert;
