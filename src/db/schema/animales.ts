import {
  pgTable,
  serial,
  integer,
  varchar,
  date,
  boolean,
  pgEnum,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { fundos } from "./fundos.js";
import { tipoGanado, razas, estadoReproductivo } from "./catalogos.js";
import { tipoPropiedadEnum, medieros } from "./medieros.js";

export const sexoEnum = pgEnum("sexo", ["M", "H"]);
export const estadoAnimalEnum = pgEnum("estado_animal", ["activo", "baja", "desecho"]);

/**
 * moduloAnimalEnum — módulo de producción al que pertenece el animal.
 * Opcional: permite filtros rápidos en UI sin consultar org.modulos.
 * Un animal puede cambiar de módulo sin cambiar de tabla.
 * Ticket: AUT-129
 */
export const moduloAnimalEnum = pgEnum("modulo_animal", ["feedlot", "crianza", "ambos"]);

/**
 * animales — Registro maestro de animales del hato.
 * Toda tabla de evento lleva fundo_id + animal_id.
 *
 * diio: identificador principal (DIIO/arete electrónico).
 * eid: Electronic Identification (tag RFID, puede coincidir con diio).
 */
export const animales = pgTable(
  "animales",
  {
    id: serial("id").primaryKey(),
    fundoId: integer("fundo_id")
      .notNull()
      .references(() => fundos.id, { onDelete: "restrict" }),
    diio: varchar("diio", { length: 50 }).notNull(),
    eid: varchar("eid", { length: 50 }),
    tipoGanadoId: integer("tipo_ganado_id")
      .notNull()
      .references(() => tipoGanado.id, { onDelete: "restrict" }),
    razaId: integer("raza_id").references(() => razas.id, { onDelete: "set null" }),
    sexo: sexoEnum("sexo").notNull(),
    fechaNacimiento: date("fecha_nacimiento"),
    estadoReproductivoId: integer("estado_reproductivo_id").references(
      () => estadoReproductivo.id,
      { onDelete: "set null" }
    ),
    estado: estadoAnimalEnum("estado").notNull().default("activo"),
    // Genealogía
    diioMadre: varchar("diio_madre", { length: 50 }),
    padre: varchar("padre", { length: 200 }),
    abuelo: varchar("abuelo", { length: 200 }),
    origen: varchar("origen", { length: 200 }),
    // Propiedad
    /**
     * tipo_propiedad — distingue animales del fundo vs. de mediería.
     * Default 'propio' para compatibilidad con datos existentes.
     * Ticket: AUT-135
     */
    tipoPropiedad: tipoPropiedadEnum("tipo_propiedad").notNull().default("propio"),
    /**
     * mediero_id — FK nullable a medieros.
     * Solo se asigna cuando tipo_propiedad = 'medieria'.
     * Ticket: AUT-135
     */
    medieroId: integer("mediero_id").references(() => medieros.id, { onDelete: "set null" }),
    // Metadata
    /**
     * modulo_actual — filtro rápido por módulo de producción.
     * Derivado de org.modulos pero guardado en el animal para
     * evitar joins en listados. Nullable: sin clasificación explícita.
     */
    moduloActual: moduloAnimalEnum("modulo_actual"),
    observaciones: varchar("observaciones", { length: 500 }),
    desecho: boolean("desecho").notNull().default(false),
    creadoEn: timestamp("creado_en", { withTimezone: true }).defaultNow().notNull(),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("animales_fundo_diio_idx").on(t.fundoId, t.diio),
    index("animales_fundo_estado_idx").on(t.fundoId, t.estado),
  ]
);

export type Animal = typeof animales.$inferSelect;
export type NuevoAnimal = typeof animales.$inferInsert;
