import {
  pgTable,
  serial,
  text,
  numeric,
  date,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * precios_feria — Histórico de precios de feria ganadera (ODEPA, Tattersall, etc.).
 * Ticket: AUT-267
 *
 * Fuentes:
 *   - ODEPA (Oficina de Estudios y Políticas Agrarias, Chile)
 *     https://www.odepa.gob.cl/precios/series-de-precios
 *   - Tattersall (remates públicos)
 *
 * Usada por el chat ganadero para comparaciones históricas de precios
 * (ej: "a cuánto estaba el novillo gordo hace un año vs hoy").
 */
export const preciosFeria = pgTable(
  "precios_feria",
  {
    id: serial("id").primaryKey(),
    fuente: text("fuente").notNull(), // 'odepa' | 'tattersall' | 'liniers' | ...
    feria: text("feria").notNull(),   // 'osorno' | 'temuco' | 'los_angeles' | ...
    categoria: text("categoria").notNull(), // 'novillo_gordo' | 'vaca_gorda' | 'vaquilla' | 'ternero' | 'toro'
    pesoRango: text("peso_rango"),    // '400-500' | '500-600' | null
    fecha: date("fecha").notNull(),
    precioKgClp: numeric("precio_kg_clp", { precision: 10, scale: 2 }),
    precioCabezaClp: numeric("precio_cabeza_clp", { precision: 12, scale: 2 }),
    moneda: text("moneda").default("CLP").notNull(),
    urlFuente: text("url_fuente"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("precios_feria_fecha_idx").on(t.fecha.desc()),
    index("precios_feria_categoria_fecha_idx").on(t.categoria, t.fecha.desc()),
    index("precios_feria_feria_categoria_fecha_idx").on(t.feria, t.categoria, t.fecha.desc()),
    uniqueIndex("precios_feria_unique_idx").on(
      t.fuente,
      t.feria,
      t.categoria,
      t.pesoRango,
      t.fecha
    ),
  ]
);

export type PrecioFeria = typeof preciosFeria.$inferSelect;
export type NuevoPrecioFeria = typeof preciosFeria.$inferInsert;
