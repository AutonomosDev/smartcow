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

/**
 * Medicamento dentro de un tratamiento. Extendido para AUT-298 (W3)
 * con trazabilidad SAG completa del xlsx Tratamientos_Historial.
 *
 * Campos excluidos intencionalmente (no somos lechero, AUT-298):
 *   resguardo_leche_dias, liberacion_leche
 */
export type MedicamentoTratamiento = {
  nombre: string | null;
  /** código de Registro SAG — ej "0111-B" del campo "Medicamento-Reg. SAG" */
  regSag: string | null;
  /** número de serie del lote — ej "25002788" del campo "Serie-Venc." */
  lote: string | null;
  /** fecha de vencimiento del lote — YYYY-MM-DD, parseada del campo "Serie-Venc." */
  vencimiento: string | null;
  /** dosis administrada — ej "35 ML" */
  dosis: string | null;
  /** vía de administración — Intramuscular / Subcutánea / Tópico / No Aplica / etc */
  via: string | null;
  /** cada cuántos días se repite la dosis (0 = dosis única) */
  repetirCadaDias: number | null;
  /** número total de dosis del tratamiento */
  repetirTotal: number | null;
  /** días de resguardo de carne post-dosis — ej 30 */
  resguardoCarneDias: number | null;
  /** fecha calculada en que la carne queda liberada — YYYY-MM-DD */
  liberacionCarne: string | null;
};

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
    medicamentos: jsonb("medicamentos").$type<MedicamentoTratamiento[]>(),
    /** Inicio del tratamiento (si difiere de fecha). AgroApp: "Inicio". AUT-298. */
    inicio: date("inicio"),
    /** Fin del tratamiento. AgroApp: "Fin". AUT-298. */
    fin: date("fin"),
    /**
     * Fecha máxima de liberación de carne entre todos los medicamentos del tratamiento.
     * Denormalizada para responder rápido "¿qué animales están en resguardo hoy?"
     * sin parsear jsonb. AUT-298.
     */
    liberacionCarneMax: date("liberacion_carne_max"),
    usuarioId: integer("usuario_id").references(() => users.id, { onDelete: "set null" }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("tratamientos_animal_fecha_idx").on(t.animalId, t.fecha),
    index("tratamientos_predio_fecha_idx").on(t.predioId, t.fecha),
    index("tratamientos_diagnostico_idx").on(t.diagnostico),
    index("tratamientos_liberacion_carne_idx").on(t.liberacionCarneMax),
  ]
);

export type Tratamiento = typeof tratamientos.$inferSelect;
export type NuevoTratamiento = typeof tratamientos.$inferInsert;
