import {
  pgTable,
  pgEnum,
  serial,
  integer,
  varchar,
  boolean,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizaciones } from "./organizaciones";

/**
 * tipoProveedorEnum — origen comercial del animal cuando ingresa al cliente.
 * Ticket: AUT-296 (extensión W1, feedback Cesar 2026-04-22)
 *
 *   feria          → remate público (Fegosa, Tattersall, Feria Remehue)
 *   criador        → productor individual / predio tercero
 *                    (Oscar Hitschfeld, Mantos Verdes, Doña Charo)
 *   intermediario  → comisionista / corredor
 *   desconocido    → nombre ambiguo o solo ubicación (Puerto Varas,
 *                    Purranque) — pendiente clasificar con Cesar
 */
export const tipoProveedorEnum = pgEnum("tipo_proveedor", [
  "feria",
  "criador",
  "intermediario",
  "desconocido",
]);

/**
 * proveedores — Origen comercial del ganado que entra al cliente.
 *
 * Se usa para evaluar performance por proveedor:
 *   - % bajas / mortalidad por proveedor
 *   - ADG (ganancia diaria peso) post-llegada
 *   - Costo por kg ganado
 *   - Ranking de calidad / confiabilidad
 *
 * Poblada inicialmente por el seed AUT-296 con los ~34 canónicos
 * detectados en los 10 xlsx (18-04-2026). El fundo-resolver normaliza
 * las variantes de escritura al nombre canónico antes de insertar.
 *
 * NO confundir con:
 *   - predios   → ubicaciones físicas del cliente (propios o arriendo)
 *   - medieros  → terceros alojados en el feedlot (medieria + hoteleria)
 *
 * Ticket: AUT-296
 */
export const proveedores = pgTable(
  "proveedores",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => organizaciones.id, { onDelete: "restrict" }),
    nombre: varchar("nombre", { length: 120 }).notNull(),
    tipo: tipoProveedorEnum("tipo").notNull().default("desconocido"),
    rut: varchar("rut", { length: 12 }),
    contacto: varchar("contacto", { length: 80 }),
    activo: boolean("activo").notNull().default(true),
    notas: text("notas"),
    creadoEn: timestamp("creado_en", { withTimezone: true })
      .defaultNow()
      .notNull(),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    // Nombre canónico único por organización → habilita upsert por (org_id, nombre)
    uqOrgNombre: uniqueIndex("uq_proveedores_org_nombre").on(t.orgId, t.nombre),
  })
);

export type Proveedor = typeof proveedores.$inferSelect;
export type NuevoProveedor = typeof proveedores.$inferInsert;
