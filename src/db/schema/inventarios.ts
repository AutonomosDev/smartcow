import {
  pgTable,
  serial,
  integer,
  varchar,
  date,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { predios } from "./predios";
import { medieros } from "./medieros";
import { users } from "./users";
import type { TipoGanadoDesglose } from "./traslados";

/**
 * inventarios — Snapshots del hato en un predio/mediería.
 *
 * AUT-299 (W4): AgroApp módulo "Inventarios" registra cuántos animales
 * se encontraron vs. faltaron al hacer el recuento fisico en terreno,
 * con desglose por tipo de ganado (Novillo, Ternero, Vaca, etc.).
 *
 * El xlsx tiene 27 filas históricas. Nunca se había importado.
 */
export const inventarios = pgTable(
  "inventarios",
  {
    id: serial("id").primaryKey(),
    idAgroapp: varchar("id_agroapp", { length: 20 }),

    /** Predio donde se hizo el inventario. */
    predioId: integer("predio_id")
      .notNull()
      .references(() => predios.id, { onDelete: "restrict" }),
    /** Si el inventario es de animales de mediería/hotelería dentro del predio. */
    medieroId: integer("mediero_id").references(() => medieros.id, { onDelete: "set null" }),

    /** Fecha del inventario (= "Fecha creado" del xlsx; no hay otra fecha). */
    fecha: date("fecha").notNull(),

    nEncontrados: integer("n_encontrados"),
    tgEncontrados: jsonb("tg_encontrados").$type<TipoGanadoDesglose>(),
    nFaltantes: integer("n_faltantes"),
    tgFaltantes: jsonb("tg_faltantes").$type<TipoGanadoDesglose>(),

    /** Estado en AgroApp: En Proceso / Completo / etc. */
    estado: varchar("estado", { length: 20 }),

    usuarioId: integer("usuario_id").references(() => users.id, { onDelete: "set null" }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("inventarios_predio_fecha_idx").on(t.predioId, t.fecha),
    index("inventarios_mediero_idx").on(t.medieroId),
  ]
);

export type Inventario = typeof inventarios.$inferSelect;
export type NuevoInventario = typeof inventarios.$inferInsert;
