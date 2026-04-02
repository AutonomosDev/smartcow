import { pgTable, serial, integer, varchar } from "drizzle-orm/pg-core";
import { fundos } from "./fundos.js";

/**
 * tipo_ganado — Clasificación del animal (vaca, novilla, ternero, etc.)
 * Catálogo global (no depende de fundo).
 */
export const tipoGanado = pgTable("tipo_ganado", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull().unique(),
});

/**
 * razas — Razas bovinas.
 * Catálogo global.
 */
export const razas = pgTable("razas", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull().unique(),
});

/**
 * estado_reproductivo — Estado reproductivo del animal.
 * Catálogo global.
 */
export const estadoReproductivo = pgTable("estado_reproductivo", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull().unique(),
});

/**
 * tipo_parto — Tipo de parto (normal, distócico, etc.)
 * Catálogo global.
 */
export const tipoParto = pgTable("tipo_parto", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull().unique(),
});

/**
 * subtipo_parto — Subtipo de parto.
 * Catálogo global.
 */
export const subtipoParto = pgTable("subtipo_parto", {
  id: serial("id").primaryKey(),
  tipoPartoId: integer("tipo_parto_id")
    .notNull()
    .references(() => tipoParto.id, { onDelete: "restrict" }),
  nombre: varchar("nombre", { length: 100 }).notNull(),
});

/**
 * baja_motivo — Motivo de baja del animal.
 * Catálogo global.
 */
export const bajaMotivo = pgTable("baja_motivo", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull().unique(),
});

/**
 * baja_causa — Causa específica de baja (depende de motivo).
 * Catálogo global.
 */
export const bajaCausa = pgTable("baja_causa", {
  id: serial("id").primaryKey(),
  motivoId: integer("motivo_id")
    .notNull()
    .references(() => bajaMotivo.id, { onDelete: "restrict" }),
  nombre: varchar("nombre", { length: 100 }).notNull(),
});

/**
 * semen — Toros / pajuelas de semen para inseminación.
 * Scoped por fundo (cada fundo maneja su propio catálogo de toros).
 */
export const semen = pgTable("semen", {
  id: serial("id").primaryKey(),
  fundoId: integer("fundo_id")
    .notNull()
    .references(() => fundos.id, { onDelete: "cascade" }),
  toro: varchar("toro", { length: 200 }).notNull(),
});

/**
 * inseminadores — Personas que realizan la inseminación.
 * Scoped por fundo.
 */
export const inseminadores = pgTable("inseminadores", {
  id: serial("id").primaryKey(),
  fundoId: integer("fundo_id")
    .notNull()
    .references(() => fundos.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 200 }).notNull(),
});

export type TipoGanado = typeof tipoGanado.$inferSelect;
export type Raza = typeof razas.$inferSelect;
export type EstadoReproductivo = typeof estadoReproductivo.$inferSelect;
export type TipoParto = typeof tipoParto.$inferSelect;
export type SubtipoParto = typeof subtipoParto.$inferSelect;
export type BajaMotivo = typeof bajaMotivo.$inferSelect;
export type BajaCausa = typeof bajaCausa.$inferSelect;
export type Semen = typeof semen.$inferSelect;
export type Inseminador = typeof inseminadores.$inferSelect;
