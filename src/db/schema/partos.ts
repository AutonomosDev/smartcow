import {
  pgTable,
  serial,
  integer,
  date,
  varchar,
  pgEnum,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { fundos } from "./fundos.js";
import { animales } from "./animales.js";
import { tipoParto, subtipoParto, semen, inseminadores, tipoGanado } from "./catalogos.js";
import { users } from "./users.js";

export const resultadoPartoEnum = pgEnum("resultado_parto", [
  "vivo",
  "muerto",
  "aborto",
  "gemelar",
]);

/**
 * partos — Registro de partos.
 * Origen: módulo Parto de AgroApp.
 * madre_id + cria_id son ambos animales.
 */
export const partos = pgTable(
  "partos",
  {
    id: serial("id").primaryKey(),
    fundoId: integer("fundo_id")
      .notNull()
      .references(() => fundos.id, { onDelete: "restrict" }),
    madreId: integer("madre_id")
      .notNull()
      .references(() => animales.id, { onDelete: "restrict" }),
    fecha: date("fecha").notNull(),
    resultado: resultadoPartoEnum("resultado").notNull(),
    criaId: integer("cria_id").references(() => animales.id, { onDelete: "set null" }),
    tipoGanadoCriaId: integer("tipo_ganado_cria_id").references(() => tipoGanado.id, {
      onDelete: "set null",
    }),
    tipoPartoId: integer("tipo_parto_id").references(() => tipoParto.id, {
      onDelete: "set null",
    }),
    subtipoPartoId: integer("subtipo_parto_id").references(() => subtipoParto.id, {
      onDelete: "set null",
    }),
    semenId: integer("semen_id").references(() => semen.id, { onDelete: "set null" }),
    inseminadorId: integer("inseminador_id").references(() => inseminadores.id, {
      onDelete: "set null",
    }),
    numeroPartos: integer("numero_partos"),
    observaciones: varchar("observaciones", { length: 500 }),
    usuarioId: integer("usuario_id").references(() => users.id, { onDelete: "set null" }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("partos_madre_fecha_idx").on(t.madreId, t.fecha),
    index("partos_fundo_fecha_idx").on(t.fundoId, t.fecha),
  ]
);

export type Parto = typeof partos.$inferSelect;
export type NuevoParto = typeof partos.$inferInsert;
