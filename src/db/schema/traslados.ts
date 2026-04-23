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
import { animales } from "./animales";
import { medieros } from "./medieros";
import { users } from "./users";

/**
 * Desglose por tipo de ganado en un traslado por lote.
 * Parseado del campo multi-línea "Tipo ganado" del xlsx AgroApp:
 *   "Vaca: 19\nVaquilla: 3" → { vaca: 19, vaquilla: 3 }
 * Keys normalizadas a lowercase sin tildes.
 */
export type TipoGanadoDesglose = Record<string, number>;

/**
 * traslados — Movimientos oficiales de ganado entre predios/medierías.
 *
 * AUT-299 (W4): AgroApp exporta traslados AGREGADOS POR LOTE (sin DIIO
 * individual), con N° Guía SAG y desglose por tipo de ganado en texto
 * multi-línea. Por eso `animal_id` pasa a nullable — si en el futuro se
 * importa un traslado per-animal se puede usar la misma tabla con los
 * campos agregados en NULL.
 *
 * Origen y destino pueden ser predio propio, mediería/hotelería, o
 * proveedor externo (texto libre en *_nombre cuando no hay FK).
 */
export const traslados = pgTable(
  "traslados",
  {
    id: serial("id").primaryKey(),
    /** Per-animal legacy path (hoy NULL para imports agregados de AgroApp). */
    animalId: integer("animal_id").references(() => animales.id, {
      onDelete: "restrict",
    }),
    fecha: date("fecha").notNull(),
    idAgroapp: varchar("id_agroapp", { length: 20 }),

    // Origen (resuelto opcionalmente a predio o mediero; si no, queda como texto)
    predioOrigenId: integer("predio_origen_id").references(() => predios.id, {
      onDelete: "set null",
    }),
    medieroOrigenId: integer("mediero_origen_id").references(() => medieros.id, {
      onDelete: "set null",
    }),
    fundoOrigenNombre: varchar("fundo_origen_nombre", { length: 200 }),

    // Destino
    predioDestinoId: integer("predio_destino_id").references(() => predios.id, {
      onDelete: "set null",
    }),
    medieroDestinoId: integer("mediero_destino_id").references(() => medieros.id, {
      onDelete: "set null",
    }),
    fundoDestinoNombre: varchar("fundo_destino_nombre", { length: 200 }),

    // Campos agregados del xlsx (AUT-299)
    /** Total de animales en el traslado (campo "Animales" del xlsx). */
    nAnimales: integer("n_animales"),
    /** Desglose por tipo_ganado — jsonb ej {vaca: 19, vaquilla: 3}. */
    tipoGanadoDesglose: jsonb("tipo_ganado_desglose").$type<TipoGanadoDesglose>(),
    /** Número de guía SAG (documento oficial). */
    nGuia: varchar("n_guia", { length: 50 }),
    /** Estado del traslado en AgroApp: Completo / Pendiente / etc. */
    estado: varchar("estado", { length: 20 }),

    observacion: varchar("observacion", { length: 500 }),
    usuarioId: integer("usuario_id").references(() => users.id, { onDelete: "set null" }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("traslados_animal_fecha_idx").on(t.animalId, t.fecha),
    index("traslados_destino_idx").on(t.predioDestinoId, t.fecha),
    index("traslados_fecha_idx").on(t.fecha),
    index("traslados_n_guia_idx").on(t.nGuia),
  ]
);

export type Traslado = typeof traslados.$inferSelect;
export type NuevoTraslado = typeof traslados.$inferInsert;
