/**
 * migrate-agroapp.ts — ETL: AgroApp → SmartCow DB
 *
 * Extrae datos de AgroApp vía el proxy Puppeteer existente y los inserta
 * en la base de datos SmartCow (PostgreSQL + Drizzle ORM).
 *
 * Orden de migración (respeta dependencias FK):
 *   P1. Catálogos   — tipo_ganado, razas, estado_reproductivo
 *   P2. Fundos      — fundo → fundos
 *   P3. Semen       — inseminacion_semen → semen (scoped por fundo)
 *   P4. Animales    — ganado_actual → animales
 *   P5. Pesajes     — pesajes → pesajes
 *   P6. Partos      — partos → partos
 *   P7. Inseminaciones — inseminaciones → inseminaciones
 *   P8. Ecografías  — ecografias → ecografias
 *   P9. Areteos     — areteo_alta + areteo_aparicion + cambio_diio → areteos
 *  P10. Bajas       — bajas → bajas
 *
 * Uso:
 *   DATABASE_URL=... AGROAPP_USER=... AGROAPP_PASSWORD=... npx tsx src/etl/migrate-agroapp.ts
 *
 * Flags opcionales (env vars):
 *   DRY_RUN=1          — no escribe en DB, solo imprime conteos
 *   DESDE=2020-01-01   — fecha inicio para historial (default: 2018-01-01)
 *   HASTA=2026-04-02   — fecha fin para historial (default: hoy)
 *   FUNDO_ID=3         — limitar migración a un fundo específico de AgroApp
 *
 * Ticket: AUT-121
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql, eq, and } from "drizzle-orm";
import * as schema from "../db/schema/index.js";
import { fundos } from "../db/schema/fundos.js";
import {
  getSession,
  destroySession,
  servletPost,
} from "../agroapp/client.js";

// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────

const DRY_RUN = process.env.DRY_RUN === "1";
const DESDE = process.env.DESDE ?? "2018-01-01";
const HASTA = process.env.HASTA ?? new Date().toISOString().slice(0, 10);
const FUNDO_FILTER = process.env.FUNDO_ID ? parseInt(process.env.FUNDO_ID, 10) : undefined;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://localhost:5432/smartcow",
  max: 5,
});
const db = drizzle(pool, { schema });

// ─────────────────────────────────────────────
// LOGGING
// ─────────────────────────────────────────────

function log(section: string, msg: string): void {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${section}] ${msg}`);
}

function warn(section: string, msg: string): void {
  const ts = new Date().toISOString();
  console.warn(`[${ts}] [${section}] WARN: ${msg}`);
}

// ─────────────────────────────────────────────
// TIPOS AGROAPP (respuestas crudas del servlet)
// ─────────────────────────────────────────────

interface AgroFundo {
  fundo_id: number;
  name: string;
}

interface AgroTipoGanado {
  tipo_ganado_id: number;
  tipo_ganado: string;
}

interface AgroRaza {
  raza_id: number;
  raza: string;
}

interface AgroEstadoReproductivo {
  estado_reproductivo_id: number;
  estado_reproductivo: string;
}

interface AgroSemen {
  inseminacion_semen_id: number;
  toro: string;
}

interface AgroBajaMotivo {
  baja_motivo_org_id: number;
  baja_motivo: string;
}

interface AgroBajaCausa {
  baja_causa_org_id: number;
  baja_causa: string;
}

interface AgroAnimal {
  diio: string;
  fecha_nacimiento?: string;
  tipo_ganado?: string;
  raza?: string;
  fundo?: string;
  fundo_id?: number;
  estado_reproductivo?: string;
  estado_leche?: string;
  desecho?: boolean | string;
  diio_madre?: string;
  padre?: string;
  abuelo?: string;
  origen?: string;
  observaciones?: string;
  fecha_creado?: string;
  // Sexo no viene de AgroApp — inferir de tipo_ganado si posible
}

interface AgroPesaje {
  diio: string;
  fundo_id?: number;
  peso?: number;
  peso_kg?: number;
  fecha?: string;
  fecha_creado?: string;
}

interface AgroParto {
  diio_madre: string;
  fundo_id?: number;
  fecha_parto?: string;
  fecha?: string;
  tipo_parto?: string;
  subtipo_parto?: string;
  toro?: string;
  inseminador?: string;
  diio_cria?: string;
  tipo_ganado_cria?: string;
  numero_partos?: number;
  observaciones?: string;
}

interface AgroInseminacion {
  diio: string;
  fundo_id?: number;
  fecha_inseminacion?: string;
  fecha?: string;
  toro?: string;
  inseminador?: string;
  observaciones?: string;
}

interface AgroEcografia {
  diio: string;
  fundo_id?: number;
  fecha_ecografia?: string;
  fecha?: string;
  resultado?: string;
  dias_gestacion?: number;
  observaciones?: string;
}

interface AgroAreteoAlta {
  diio: string;
  fundo_id?: number;
  fecha_creado?: string;
  fecha?: string;
  observaciones?: string;
}

interface AgroCambioDiio {
  diio_nuevo: string;
  diio_anterior: string;
  fundo_id?: number;
  fecha_cambio_diio?: string;
  fecha?: string;
  observaciones?: string;
}

interface AgroBaja {
  diio: string;
  fundo_id?: number;
  fecha_baja?: string;
  fecha?: string;
  baja_motivo?: string;
  baja_causa?: string;
  peso_kg?: number;
  observaciones?: string;
}

// ─────────────────────────────────────────────
// HELPER — extraer array de la respuesta servlet
// ─────────────────────────────────────────────

function extractArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  const obj = raw as Record<string, unknown>;
  if (obj.results && Array.isArray(obj.results)) return obj.results as T[];
  if (obj.data && Array.isArray(obj.data)) return obj.data as T[];
  if (obj.rows && Array.isArray(obj.rows)) return obj.rows as T[];
  return [];
}

// ─────────────────────────────────────────────
// HELPER — normalizar boolean de AgroApp
// ─────────────────────────────────────────────

function toBoolean(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val === "true" || val === "1" || val === "S";
  if (typeof val === "number") return val === 1;
  return false;
}

// ─────────────────────────────────────────────
// HELPER — normalizar fecha
// ─────────────────────────────────────────────

function toDate(val: unknown): string | null {
  if (!val || val === "") return null;
  const s = String(val);
  // Formato esperado: YYYY-MM-DD — si viene con hora, truncar
  return s.slice(0, 10);
}

// ─────────────────────────────────────────────
// HELPER — inferir sexo desde tipo_ganado
// ─────────────────────────────────────────────

function inferSexo(tipoGanado: string | undefined): "M" | "H" {
  if (!tipoGanado) return "H"; // default vaca
  const t = tipoGanado.toLowerCase();
  if (t.includes("toro") || t.includes("ternero") || t.includes("novillo")) return "M";
  return "H";
}

// ─────────────────────────────────────────────
// MAPEOS EN MEMORIA (AgroApp ID → SmartCow ID)
// ─────────────────────────────────────────────

// ID de la organización dueña de todos los fundos migrados (se resuelve en main)
let defaultOrgId: number = 0;

const mapFundo = new Map<number, number>(); // agroFundoId → smartcowFundoId
const mapTipoGanado = new Map<string, number>(); // nombre → id
const mapRaza = new Map<string, number>(); // nombre → id
const mapEstadoRep = new Map<string, number>(); // nombre → id
const mapSemen = new Map<string, number>(); // `${predioId}:${toro}` → id
const mapBajaMotivo = new Map<string, number>(); // nombre → id
const mapBajaCausa = new Map<string, number>(); // nombre → id
const mapAnimal = new Map<string, number>(); // `${predioId}:${diio}` → animalId
const mapAnimalSexo = new Map<string, "M" | "H">(); // `${predioId}:${diio}` → sexo
const mapMediero = new Map<string, number>(); // `${predioId}:${nombre}` → medieroId

// ─────────────────────────────────────────────
// CONTADORES
// ─────────────────────────────────────────────

interface Counts {
  fundos: number;
  tipo_ganado: number;
  razas: number;
  estado_reproductivo: number;
  semen: number;
  medieros: number;
  animales: number;
  pesajes: number;
  partos: number;
  inseminaciones: number;
  ecografias: number;
  areteos: number;
  bajas: number;
  // Skips por regla
  skip_animal_diio_vacio: number;
  skip_animal_tipo_ganado_desconocido: number;
  skip_pesaje_diio_vacio: number;
  skip_pesaje_animal_no_encontrado: number;
  skip_pesaje_peso_invalido: number;
  skip_pesaje_sin_fecha: number;
  skip_pesaje_dedup: number;
  skip_parto_sin_diio_madre: number;
  skip_parto_madre_no_encontrada: number;
  skip_parto_sin_fecha: number;
  skip_inseminacion_sin_diio: number;
  skip_inseminacion_animal_no_encontrado: number;
  skip_inseminacion_sin_fecha: number;
  skip_ecografia_sin_diio: number;
  skip_ecografia_animal_no_encontrado: number;
  skip_ecografia_sin_fecha: number;
  skip_ecografia_dias_invalidos: number;
  skip_baja_sin_diio: number;
  skip_baja_animal_no_encontrado: number;
  skip_baja_motivo_no_encontrado: number;
  skip_baja_sin_fecha: number;
  // Warns por regla
  warn_animal_sin_fecha_nacimiento: number;
  warn_parto_madre_macho: number;
  warn_inseminacion_animal_en_baja: number;
}

const counts: Counts = {
  fundos: 0,
  tipo_ganado: 0,
  razas: 0,
  estado_reproductivo: 0,
  semen: 0,
  medieros: 0,
  animales: 0,
  pesajes: 0,
  partos: 0,
  inseminaciones: 0,
  ecografias: 0,
  areteos: 0,
  bajas: 0,
  skip_animal_diio_vacio: 0,
  skip_animal_tipo_ganado_desconocido: 0,
  skip_pesaje_diio_vacio: 0,
  skip_pesaje_animal_no_encontrado: 0,
  skip_pesaje_peso_invalido: 0,
  skip_pesaje_sin_fecha: 0,
  skip_pesaje_dedup: 0,
  skip_parto_sin_diio_madre: 0,
  skip_parto_madre_no_encontrada: 0,
  skip_parto_sin_fecha: 0,
  skip_inseminacion_sin_diio: 0,
  skip_inseminacion_animal_no_encontrado: 0,
  skip_inseminacion_sin_fecha: 0,
  skip_ecografia_sin_diio: 0,
  skip_ecografia_animal_no_encontrado: 0,
  skip_ecografia_sin_fecha: 0,
  skip_ecografia_dias_invalidos: 0,
  skip_baja_sin_diio: 0,
  skip_baja_animal_no_encontrado: 0,
  skip_baja_motivo_no_encontrado: 0,
  skip_baja_sin_fecha: 0,
  warn_animal_sin_fecha_nacimiento: 0,
  warn_parto_madre_macho: 0,
  warn_inseminacion_animal_en_baja: 0,
};

// ─────────────────────────────────────────────
// P0 — ORGANIZACIÓN (prerequisito de fundos)
// ─────────────────────────────────────────────

async function asegurarOrg(nombre: string): Promise<number> {
  if (DRY_RUN) {
    log("P0:org", `DRY_RUN — skipping org lookup for "${nombre}"`);
    return -1;
  }

  const existing = await db
    .select()
    .from(schema.organizaciones)
    .where(eq(schema.organizaciones.nombre, nombre))
    .limit(1);

  if (existing.length > 0) {
    log("P0:org", `Org "${nombre}" already exists (id=${existing[0].id})`);
    return existing[0].id;
  }

  const inserted = await db
    .insert(schema.organizaciones)
    .values({ nombre, plan: "pro" })
    .returning({ id: schema.organizaciones.id });

  log("P0:org", `Org "${nombre}" created (id=${inserted[0].id})`);
  return inserted[0].id;
}

// ─────────────────────────────────────────────
// P1 — CATÁLOGOS GLOBALES
// ─────────────────────────────────────────────

async function migrarTipoGanado(session: Awaited<ReturnType<typeof getSession>>): Promise<void> {
  log("P1:tipo_ganado", "Fetching...");
  const raw = await servletPost<unknown>(session, "GanadoActual", "getAllTipoGanado", {});
  const items = extractArray<AgroTipoGanado>(raw);
  log("P1:tipo_ganado", `Fetched ${items.length} items`);

  for (const item of items) {
    const nombre = item.tipo_ganado?.trim();
    if (!nombre) continue;

    if (DRY_RUN) {
      mapTipoGanado.set(nombre, -1);
      counts.tipo_ganado++;
      continue;
    }

    const existing = await db
      .select()
      .from(schema.tipoGanado)
      .where(eq(schema.tipoGanado.nombre, nombre))
      .limit(1);

    if (existing.length > 0) {
      mapTipoGanado.set(nombre, existing[0].id);
    } else {
      const inserted = await db
        .insert(schema.tipoGanado)
        .values({ nombre })
        .returning({ id: schema.tipoGanado.id });
      mapTipoGanado.set(nombre, inserted[0].id);
      counts.tipo_ganado++;
    }
  }
  log("P1:tipo_ganado", `Done — ${counts.tipo_ganado} inserted`);
}

async function migrarRazas(session: Awaited<ReturnType<typeof getSession>>): Promise<void> {
  log("P1:razas", "Fetching...");
  const raw = await servletPost<unknown>(session, "GanadoActual", "getAllRaza", {});
  const items = extractArray<AgroRaza>(raw);
  log("P1:razas", `Fetched ${items.length} items`);

  for (const item of items) {
    const nombre = item.raza?.trim();
    if (!nombre) continue;

    if (DRY_RUN) {
      mapRaza.set(nombre, -1);
      counts.razas++;
      continue;
    }

    const existing = await db
      .select()
      .from(schema.razas)
      .where(eq(schema.razas.nombre, nombre))
      .limit(1);

    if (existing.length > 0) {
      mapRaza.set(nombre, existing[0].id);
    } else {
      const inserted = await db
        .insert(schema.razas)
        .values({ nombre })
        .returning({ id: schema.razas.id });
      mapRaza.set(nombre, inserted[0].id);
      counts.razas++;
    }
  }
  log("P1:razas", `Done — ${counts.razas} inserted`);
}

async function migrarEstadoReproductivo(session: Awaited<ReturnType<typeof getSession>>): Promise<void> {
  log("P1:estado_reproductivo", "Fetching...");
  const raw = await servletPost<unknown>(session, "GanadoActual", "getAllEstadoReproductivo", {});
  const items = extractArray<AgroEstadoReproductivo>(raw);
  log("P1:estado_reproductivo", `Fetched ${items.length} items`);

  for (const item of items) {
    const nombre = item.estado_reproductivo?.trim();
    if (!nombre) continue;

    if (DRY_RUN) {
      mapEstadoRep.set(nombre, -1);
      counts.estado_reproductivo++;
      continue;
    }

    const existing = await db
      .select()
      .from(schema.estadoReproductivo)
      .where(eq(schema.estadoReproductivo.nombre, nombre))
      .limit(1);

    if (existing.length > 0) {
      mapEstadoRep.set(nombre, existing[0].id);
    } else {
      const inserted = await db
        .insert(schema.estadoReproductivo)
        .values({ nombre })
        .returning({ id: schema.estadoReproductivo.id });
      mapEstadoRep.set(nombre, inserted[0].id);
      counts.estado_reproductivo++;
    }
  }
  log("P1:estado_reproductivo", `Done — ${counts.estado_reproductivo} inserted`);
}

async function migrarBajaMotivos(session: Awaited<ReturnType<typeof getSession>>): Promise<void> {
  log("P1:baja_motivo", "Fetching...");
  const raw = await servletPost<unknown>(session, "Baja", "getAllBajaMotivo", {});
  const items = extractArray<AgroBajaMotivo>(raw);
  log("P1:baja_motivo", `Fetched ${items.length} items`);

  for (const item of items) {
    const nombre = item.baja_motivo?.trim();
    if (!nombre) continue;

    if (DRY_RUN) {
      mapBajaMotivo.set(nombre, -1);
      continue;
    }

    const existing = await db
      .select()
      .from(schema.bajaMotivo)
      .where(eq(schema.bajaMotivo.nombre, nombre))
      .limit(1);

    if (existing.length > 0) {
      mapBajaMotivo.set(nombre, existing[0].id);
    } else {
      const inserted = await db
        .insert(schema.bajaMotivo)
        .values({ nombre })
        .returning({ id: schema.bajaMotivo.id });
      mapBajaMotivo.set(nombre, inserted[0].id);
    }

    // Fetchear causas asociadas a este motivo
    const rawCausas = await servletPost<unknown>(session, "Baja", "getAllBajaCausa", {
      baja_motivo_org_id: item.baja_motivo_org_id,
    });
    const causas = extractArray<AgroBajaCausa>(rawCausas);

    for (const causa of causas) {
      const nombreCausa = causa.baja_causa?.trim();
      if (!nombreCausa) continue;

      const cKey = `${nombre}:${nombreCausa}`;
      if (DRY_RUN) {
        mapBajaCausa.set(cKey, -1);
        continue;
      }

      const motivoId = mapBajaMotivo.get(nombre);
      if (!motivoId) continue;

      const existingCausa = await db
        .select()
        .from(schema.bajaCausa)
        .where(
          and(
            eq(schema.bajaCausa.motivoId, motivoId),
            eq(schema.bajaCausa.nombre, nombreCausa)
          )
        )
        .limit(1);

      if (existingCausa.length > 0) {
        mapBajaCausa.set(cKey, existingCausa[0].id);
      } else {
        const insertedCausa = await db
          .insert(schema.bajaCausa)
          .values({ motivoId, nombre: nombreCausa })
          .returning({ id: schema.bajaCausa.id });
        mapBajaCausa.set(cKey, insertedCausa[0].id);
      }
    }
  }
  log("P1:baja_motivo", `Done — ${mapBajaMotivo.size} motivos, ${mapBajaCausa.size} causas`);
}

// ─────────────────────────────────────────────
// P2 — FUNDOS
// ─────────────────────────────────────────────

async function migrarFundos(session: Awaited<ReturnType<typeof getSession>>): Promise<void> {
  log("P2:fundos", "Fetching...");
  const raw = await servletPost<unknown>(session, "Fundo", "getFundos", {});
  const items = extractArray<AgroFundo>(raw);
  log("P2:fundos", `Fetched ${items.length} items`);

  const toProcess = FUNDO_FILTER
    ? items.filter((f) => f.fundo_id === FUNDO_FILTER)
    : items;

  for (const item of toProcess) {
    const nombre = item.name?.trim();
    if (!nombre) continue;

    if (DRY_RUN) {
      mapFundo.set(item.fundo_id, -1);
      counts.fundos++;
      continue;
    }

    const existing = await db
      .select()
      .from(schema.predios)
      .where(eq(schema.predios.nombre, nombre))
      .limit(1);

    if (existing.length > 0) {
      mapFundo.set(item.fundo_id, existing[0].id);
      log("P2:fundos", `Fundo "${nombre}" already exists (id=${existing[0].id})`);
    } else {
      const inserted = await db
        .insert(schema.predios)
        .values({ nombre, orgId: defaultOrgId })
        .returning({ id: schema.predios.id });
      mapFundo.set(item.fundo_id, inserted[0].id);
      counts.fundos++;
      log("P2:fundos", `Inserted fundo "${nombre}" → id=${inserted[0].id}`);
    }
  }
  log("P2:fundos", `Done — ${counts.fundos} inserted, ${mapFundo.size} mapped`);
}

// ─────────────────────────────────────────────
// P3 — SEMEN (por fundo)
// ─────────────────────────────────────────────

async function migrarSemen(session: Awaited<ReturnType<typeof getSession>>): Promise<void> {
  log("P3:semen", "Fetching per fundo...");

  for (const [agroFundoId, smartFundoId] of mapFundo.entries()) {
    const raw = await servletPost<unknown>(
      session,
      "InseminacionSemen",
      "getAllInseminacionSemen",
      { fundo_id: agroFundoId }
    );
    const items = extractArray<AgroSemen>(raw);

    for (const item of items) {
      const toro = item.toro?.trim();
      if (!toro) continue;

      const sKey = `${smartFundoId}:${toro}`;

      if (DRY_RUN) {
        mapSemen.set(sKey, -1);
        counts.semen++;
        continue;
      }

      const existing = await db
        .select()
        .from(schema.semen)
        .where(and(eq(schema.semen.predioId, smartFundoId), eq(schema.semen.toro, toro)))
        .limit(1);

      if (existing.length > 0) {
        mapSemen.set(sKey, existing[0].id);
      } else {
        const inserted = await db
          .insert(schema.semen)
          .values({ predioId: smartFundoId, toro })
          .returning({ id: schema.semen.id });
        mapSemen.set(sKey, inserted[0].id);
        counts.semen++;
      }
    }
  }
  log("P3:semen", `Done — ${counts.semen} inserted, ${mapSemen.size} mapped`);
}

// ─────────────────────────────────────────────
// HELPER — Detectar mediería por campo origen de AgroApp
// Animales de mediería en AgroApp llevan el nombre/código del mediero
// en el campo 'origen'. Heurística: si origen contiene "medi" o "mediero"
// (case-insensitive) se trata como mediería y se extrae el código.
// Ticket: AUT-135
// ─────────────────────────────────────────────

function detectarMedieria(origen: string | undefined): { esMedieria: boolean; nombreMediero: string | null } {
  if (!origen) return { esMedieria: false, nombreMediero: null };
  const lower = origen.toLowerCase();
  if (lower.includes("medi")) {
    // Extraer nombre: remover prefijos comunes ("MEDIERO:", "MED:") y trim
    const nombre = origen
      .replace(/^medi(ero)?[:\s]*/i, "")
      .trim() || origen.trim();
    return { esMedieria: true, nombreMediero: nombre };
  }
  return { esMedieria: false, nombreMediero: null };
}

// ─────────────────────────────────────────────
// HELPER — Crear o recuperar mediero por fundo + nombre
// Ticket: AUT-135
// ─────────────────────────────────────────────

async function asegurarMediero(smartFundoId: number, nombre: string): Promise<number> {
  const mKey = `${smartFundoId}:${nombre}`;
  const cached = mapMediero.get(mKey);
  if (cached !== undefined) return cached;

  if (DRY_RUN) {
    mapMediero.set(mKey, -1);
    counts.medieros++;
    return -1;
  }

  const existing = await db
    .select()
    .from(schema.medieros)
    .where(
      and(
        eq(schema.medieros.fundoId, smartFundoId),
        eq(schema.medieros.nombre, nombre)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    mapMediero.set(mKey, existing[0].id);
    return existing[0].id;
  }

  // Obtener org_id del fundo
  const fundo = await db
    .select({ orgId: fundos.orgId })
    .from(fundos)
    .where(eq(fundos.id, smartFundoId))
    .limit(1);

  const orgId = fundo[0]?.orgId ?? defaultOrgId;

  const inserted = await db
    .insert(schema.medieros)
    .values({ orgId, fundoId: smartFundoId, nombre })
    .returning({ id: schema.medieros.id });

  mapMediero.set(mKey, inserted[0].id);
  counts.medieros++;
  log("P4:medieros", `Mediero "${nombre}" creado en fundo ${smartFundoId} (id=${inserted[0].id})`);
  return inserted[0].id;
}

// ─────────────────────────────────────────────
// P4 — ANIMALES
// ─────────────────────────────────────────────

async function migrarAnimales(session: Awaited<ReturnType<typeof getSession>>): Promise<void> {
  log("P4:animales", "Fetching ganado_actual...");

  for (const [agroFundoId, smartFundoId] of mapFundo.entries()) {
    // AgroApp espera jsonFiltros como JSON stringificado (ver bundle getJsonFiltros())
    // fundos es array de IDs, fecha = hoy para obtener inventario completo
    // Todos los campos cb* son obligatorios — el servlet lanza error si falta alguno
    const filtros = {
      fundos: [agroFundoId],
      fecha: HASTA,
      tipo_ganado: "Todos",
      raza_id: 0,
      estado_reproductivo: "Todos",
      estado_leche: "Todos",
      desecho: "Todos",
      observaciones: "",
      order: "Ascendente",
      tipo_order: "Diio",
      cbInventario: true,
      cbFechaNacimiento: true,
      cbTipoGanado: true,
      cbRaza: true,
      cbFundo: true,
      cbEstadoReproductivo: true,
      cbEstadoLeche: true,
      cbDesecho: true,
      cbObservaciones: true,
      cbDiioMadre: true,
      cbPadre: true,
      cbAbuelo: true,
      cbOrigen: true,
      cbFechaCreado: true,
      cbDiasGestacion: false,
      cbProximoParto: false,
      cbUltimoParto: false,
      cbPartos: false,
      cbUltimaEcografia: false,
      cbUltimaInseminacion: false,
      cbUltimoInseminador: false,
      cbToro: false,
      cbTotalIA: false,
      cbDiasEnLeche: false,
      cbUltimoSecado: false,
      cbDiasSeca: false,
      cbUltimoControlLeche: false,
      cbUltimoLitros: false,
      cbUltimoRCS: false,
      cbUltimoGrasa: false,
      cbUltimoProteina: false,
      cbUltimoUrea: false,
      cbPromedioLitros: false,
      cbPromedioRCS: false,
      cbPromedioGrasa: false,
      cbPromedioProteina: false,
      cbPromedioUrea: false,
      cbPesaje: false,
    };
    const raw = await servletPost<unknown>(session, "GanadoActual", "getGanadoActual", {
      jsonFiltros: JSON.stringify(filtros),
    });

    const items = extractArray<AgroAnimal>(raw);
    log("P4:animales", `Fundo ${agroFundoId}: ${items.length} animals`);

    for (const item of items) {
      const diio = item.diio?.trim();
      if (!diio) {
        counts.skip_animal_diio_vacio++;
        continue;
      }

      const aKey = `${smartFundoId}:${diio}`;

      if (DRY_RUN) {
        mapAnimal.set(aKey, -1);
        counts.animales++;
        continue;
      }

      // Resolver FKs
      const tipoGanadoNombre = item.tipo_ganado?.trim();
      const tipoGanadoId = tipoGanadoNombre ? mapTipoGanado.get(tipoGanadoNombre) : undefined;

      if (!tipoGanadoId) {
        warn("P4:animales", `Animal ${diio} — tipo_ganado "${tipoGanadoNombre}" not in map, skipping`);
        counts.skip_animal_tipo_ganado_desconocido++;
        continue;
      }

      // Warn si sin fecha_nacimiento
      if (!item.fecha_nacimiento) {
        warn("P4:animales", `Animal ${diio} — sin fecha_nacimiento`);
        counts.warn_animal_sin_fecha_nacimiento++;
      }

      const razaNombre = item.raza?.trim();
      const razaId = razaNombre ? mapRaza.get(razaNombre) : undefined;

      const estadoRepNombre = item.estado_reproductivo?.trim();
      const estadoReproductivoId = estadoRepNombre ? mapEstadoRep.get(estadoRepNombre) : undefined;

      const existing = await db
        .select()
        .from(schema.animales)
        .where(
          and(eq(schema.animales.predioId, smartFundoId), eq(schema.animales.diio, diio))
        )
        .limit(1);

      if (existing.length > 0) {
        mapAnimal.set(aKey, existing[0].id);
        mapAnimalSexo.set(aKey, existing[0].sexo as "M" | "H");
        continue;
      }

      const sexo = inferSexo(tipoGanadoNombre);
      const desecho = toBoolean(item.desecho);

      // Detectar mediería por campo origen (AUT-135)
      const origenRaw = item.origen?.trim() || null;
      const { esMedieria, nombreMediero } = detectarMedieria(origenRaw ?? undefined);
      let medieroId: number | null = null;
      if (esMedieria && nombreMediero) {
        medieroId = await asegurarMediero(smartFundoId, nombreMediero);
        if (medieroId === -1) medieroId = null; // DRY_RUN
      }

      const inserted = await db
        .insert(schema.animales)
        .values({
          predioId: smartFundoId,
          diio,
          tipoGanadoId,
          razaId: razaId ?? null,
          sexo,
          fechaNacimiento: toDate(item.fecha_nacimiento),
          estadoReproductivoId: estadoReproductivoId ?? null,
          estado: desecho ? "desecho" : "activo",
          diioMadre: item.diio_madre?.trim() || null,
          padre: item.padre?.trim() || null,
          abuelo: item.abuelo?.trim() || null,
          origen: origenRaw,
          observaciones: item.observaciones?.trim() || null,
          desecho,
          tipoPropiedad: esMedieria ? "medieria" : "propio",
          medieroId: medieroId ?? null,
        })
        .returning({ id: schema.animales.id });

      mapAnimal.set(aKey, inserted[0].id);
      mapAnimalSexo.set(aKey, sexo);
      counts.animales++;
    }
  }
  const totalSkippedAnimales = counts.skip_animal_diio_vacio + counts.skip_animal_tipo_ganado_desconocido;
  log("P4:animales", `Done — ${counts.animales} inserted, ${totalSkippedAnimales} skipped, ${counts.warn_animal_sin_fecha_nacimiento} warns`);
}

// ─────────────────────────────────────────────
// P5 — PESAJES
// ─────────────────────────────────────────────

async function migrarPesajes(session: Awaited<ReturnType<typeof getSession>>): Promise<void> {
  log("P5:pesajes", `Fetching desde=${DESDE} hasta=${HASTA}...`);

  for (const [agroFundoId, smartFundoId] of mapFundo.entries()) {
    // AgroApp getAllPesajes requiere jsonFiltros (ver bundle getJsonFiltros() para pesajes)
    const filtrosPesajes = {
      fundo_id: agroFundoId,
      tipo_ganado: "Todos",
      estado_reproductivo: "Todos",
      descripcion: "",
      usuario_id: 0,
      order: "Descendente",
      tipo_order: "Diio",
      desde: DESDE,
      hasta: HASTA,
    };
    const raw = await servletPost<unknown>(session, "Pesaje2", "getAllPesajes", {
      jsonFiltros: JSON.stringify(filtrosPesajes),
    });

    const items = extractArray<AgroPesaje>(raw);
    log("P5:pesajes", `Fundo ${agroFundoId}: ${items.length} records`);

    if (DRY_RUN) {
      counts.pesajes += items.length;
      continue;
    }

    // Dedup: mismo animal + misma fecha → mantener mayor peso
    const dedupMap = new Map<string, { pesoRaw: number; diio: string; fecha: string }>();

    for (const item of items) {
      const diio = item.diio?.trim();
      if (!diio) { counts.skip_pesaje_diio_vacio++; continue; }

      const aKey = `${smartFundoId}:${diio}`;
      const animalId = mapAnimal.get(aKey);
      if (!animalId) {
        warn("P5:pesajes", `Animal ${diio} not found in map, skipping pesaje`);
        counts.skip_pesaje_animal_no_encontrado++;
        continue;
      }

      const pesoRaw = item.peso ?? item.peso_kg;
      if (pesoRaw == null || pesoRaw <= 0 || pesoRaw > 1500) {
        warn("P5:pesajes", `Animal ${diio} — peso inválido (${pesoRaw}), skipping`);
        counts.skip_pesaje_peso_invalido++;
        continue;
      }

      const fecha = toDate(item.fecha ?? item.fecha_creado);
      if (!fecha) { counts.skip_pesaje_sin_fecha++; continue; }

      const dedupKey = `${animalId}:${fecha}`;
      const existingDedup = dedupMap.get(dedupKey);
      if (existingDedup) {
        if (pesoRaw > existingDedup.pesoRaw) {
          dedupMap.set(dedupKey, { pesoRaw, diio, fecha });
        }
        counts.skip_pesaje_dedup++;
        continue;
      }
      dedupMap.set(dedupKey, { pesoRaw, diio, fecha });
    }

    for (const [, { pesoRaw, diio, fecha }] of dedupMap.entries()) {
      const aKey = `${smartFundoId}:${diio}`;
      const animalId = mapAnimal.get(aKey)!;

      await db.insert(schema.pesajes).values({
        predioId: smartFundoId,
        animalId,
        pesoKg: String(pesoRaw),
        fecha,
      }).onConflictDoNothing();

      counts.pesajes++;
    }
  }
  log("P5:pesajes", `Done — ${counts.pesajes} inserted`);
}

// ─────────────────────────────────────────────
// P6 — PARTOS
// ─────────────────────────────────────────────

async function migrarPartos(session: Awaited<ReturnType<typeof getSession>>): Promise<void> {
  log("P6:partos", `Fetching desde=${DESDE} hasta=${HASTA}...`);

  for (const [agroFundoId, smartFundoId] of mapFundo.entries()) {
    // AgroApp getPartos requiere jsonFiltros con campos completos (ver bundle)
    const filtrosPartos = {
      fundo_id: agroFundoId,
      tipo_ganado: "Todos",
      estado_reproductivo: "Todos",
      tipo_parto: "Todos",
      subtipo_parto: "Todos",
      tipo_parto_id: 0,
      subtipo_parto_id: 0,
      numero_partos: "Todos",
      estado: "Todos",
      sexo: "Todos",
      partos: 0,
      usuario_id: 0,
      order: "Descendente",
      tipo_order: "Diio",
      desde: DESDE,
      hasta: HASTA,
    };
    const raw = await servletPost<unknown>(session, "Parto", "getPartos", {
      jsonFiltros: JSON.stringify(filtrosPartos),
    });

    const items = extractArray<AgroParto>(raw);
    log("P6:partos", `Fundo ${agroFundoId}: ${items.length} records`);

    if (DRY_RUN) {
      counts.partos += items.length;
      continue;
    }

    for (const item of items) {
      const diio = item.diio_madre?.trim();
      if (!diio) { counts.skip_parto_sin_diio_madre++; continue; }

      const aKey = `${smartFundoId}:${diio}`;
      const madreId = mapAnimal.get(aKey);
      if (!madreId) {
        warn("P6:partos", `Madre ${diio} not found in map, skipping parto`);
        counts.skip_parto_madre_no_encontrada++;
        continue;
      }

      const fecha = toDate(item.fecha_parto ?? item.fecha);
      if (!fecha) { counts.skip_parto_sin_fecha++; continue; }

      // Warn si madre es tipo macho
      const madreSexo = mapAnimalSexo.get(aKey);
      if (madreSexo === "M") {
        warn("P6:partos", `Madre ${diio} es de sexo M — parto sospechoso`);
        counts.warn_parto_madre_macho++;
      }

      // Resolver tipo/subtipo parto
      const tipoPartoNombre = item.tipo_parto?.trim();
      let tipoPartoId: number | undefined;
      if (tipoPartoNombre) {
        const tp = await db
          .select()
          .from(schema.tipoParto)
          .where(eq(schema.tipoParto.nombre, tipoPartoNombre))
          .limit(1);
        if (tp.length > 0) tipoPartoId = tp[0].id;
        else {
          const ins = await db
            .insert(schema.tipoParto)
            .values({ nombre: tipoPartoNombre })
            .returning({ id: schema.tipoParto.id });
          tipoPartoId = ins[0].id;
        }
      }

      // Resolver semen
      const toroNombre = item.toro?.trim();
      const sKey = toroNombre ? `${smartFundoId}:${toroNombre}` : undefined;
      const semenId = sKey ? mapSemen.get(sKey) : undefined;

      // Resolver cría
      let criaId: number | undefined;
      if (item.diio_cria?.trim()) {
        const cKey = `${smartFundoId}:${item.diio_cria.trim()}`;
        criaId = mapAnimal.get(cKey);
      }

      await db.insert(schema.partos).values({
        predioId: smartFundoId,
        madreId,
        fecha,
        resultado: "vivo", // AgroApp no registra resultado — default vivo
        criaId: criaId ?? null,
        tipoPartoId: tipoPartoId ?? null,
        semenId: semenId ?? null,
        numeroPartos: item.numero_partos ?? null,
        observaciones: item.observaciones?.trim() || null,
      }).onConflictDoNothing();

      counts.partos++;
    }
  }
  log("P6:partos", `Done — ${counts.partos} inserted`);
}

// ─────────────────────────────────────────────
// P7 — INSEMINACIONES
// ─────────────────────────────────────────────

async function migrarInseminaciones(session: Awaited<ReturnType<typeof getSession>>): Promise<void> {
  log("P7:inseminaciones", `Fetching desde=${DESDE} hasta=${HASTA}...`);

  for (const [agroFundoId, smartFundoId] of mapFundo.entries()) {
    // AgroApp: servicio real es getInseminaciones con jsonFiltros (ver bundle)
    const filtrosInsem = {
      fundo_id: agroFundoId,
      tipo_ganado: "Todos",
      estado_reproductivo: "Todos",
      estado_leche: "Todos",
      desecho: "Todos",
      inseminacion_semen_id: 0,
      inseminacion_inseminador_id: 0,
      fecha: HASTA,
      usuario_id: 0,
      order: "Descendente",
      tipo_order: "Diio",
      desde: DESDE,
      hasta: HASTA,
    };
    const raw = await servletPost<unknown>(session, "Inseminacion", "getInseminaciones", {
      jsonFiltros: JSON.stringify(filtrosInsem),
    });

    const items = extractArray<AgroInseminacion>(raw);
    log("P7:inseminaciones", `Fundo ${agroFundoId}: ${items.length} records`);

    if (DRY_RUN) {
      counts.inseminaciones += items.length;
      continue;
    }

    for (const item of items) {
      const diio = item.diio?.trim();
      if (!diio) { counts.skip_inseminacion_sin_diio++; continue; }

      const aKey = `${smartFundoId}:${diio}`;
      const animalId = mapAnimal.get(aKey);
      if (!animalId) {
        warn("P7:inseminaciones", `Animal ${diio} not found, skipping`);
        counts.skip_inseminacion_animal_no_encontrado++;
        continue;
      }

      const fecha = toDate(item.fecha_inseminacion ?? item.fecha);
      if (!fecha) { counts.skip_inseminacion_sin_fecha++; continue; }

      // Warn si animal está en estado baja
      const animalRow = await db
        .select({ estado: schema.animales.estado })
        .from(schema.animales)
        .where(eq(schema.animales.id, animalId))
        .limit(1);
      if (animalRow.length > 0 && animalRow[0].estado === "baja") {
        warn("P7:inseminaciones", `Animal ${diio} está en estado baja — inseminación sospechosa`);
        counts.warn_inseminacion_animal_en_baja++;
      }

      const toroNombre = item.toro?.trim();
      const sKey = toroNombre ? `${smartFundoId}:${toroNombre}` : undefined;
      const semenId = sKey ? mapSemen.get(sKey) : undefined;

      // Inseminador — buscar por nombre en la tabla inseminadores
      let inseminadorId: number | undefined;
      if (item.inseminador?.trim()) {
        const nombre = item.inseminador.trim();
        const ins = await db
          .select()
          .from(schema.inseminadores)
          .where(
            and(
              eq(schema.inseminadores.predioId, smartFundoId),
              eq(schema.inseminadores.nombre, nombre)
            )
          )
          .limit(1);
        if (ins.length > 0) {
          inseminadorId = ins[0].id;
        } else {
          const created = await db
            .insert(schema.inseminadores)
            .values({ predioId: smartFundoId, nombre })
            .returning({ id: schema.inseminadores.id });
          inseminadorId = created[0].id;
        }
      }

      await db.insert(schema.inseminaciones).values({
        predioId: smartFundoId,
        animalId,
        fecha,
        semenId: semenId ?? null,
        inseminadorId: inseminadorId ?? null,
        resultado: "pendiente", // AgroApp registra resultado post-ecografía — default pendiente
        observaciones: item.observaciones?.trim() || null,
      }).onConflictDoNothing();

      counts.inseminaciones++;
    }
  }
  log("P7:inseminaciones", `Done — ${counts.inseminaciones} inserted`);
}

// ─────────────────────────────────────────────
// P8 — ECOGRAFÍAS
// ─────────────────────────────────────────────

async function migrarEcografias(session: Awaited<ReturnType<typeof getSession>>): Promise<void> {
  log("P8:ecografias", `Fetching desde=${DESDE} hasta=${HASTA}...`);

  for (const [agroFundoId, smartFundoId] of mapFundo.entries()) {
    // AgroApp getAllEcografia requiere jsonFiltros con campos completos (ver bundle)
    const filtrosEcog = {
      fundo_id: agroFundoId,
      tipo_ganado: "Todos",
      estado_reproductivo: "Todos",
      estado_leche: "Todos",
      desecho: "Todos",
      estado: "Todos",
      usuario_id: 0,
      descripcion: "",
      order: "Descendente",
      tipo_order: "Diio",
      desde: DESDE,
      hasta: HASTA,
    };
    const raw = await servletPost<unknown>(session, "Ecografia", "getAllEcografia", {
      jsonFiltros: JSON.stringify(filtrosEcog),
    });

    const items = extractArray<AgroEcografia>(raw);
    log("P8:ecografias", `Fundo ${agroFundoId}: ${items.length} records`);

    if (DRY_RUN) {
      counts.ecografias += items.length;
      continue;
    }

    for (const item of items) {
      const diio = item.diio?.trim();
      if (!diio) { counts.skip_ecografia_sin_diio++; continue; }

      const aKey = `${smartFundoId}:${diio}`;
      const animalId = mapAnimal.get(aKey);
      if (!animalId) {
        warn("P8:ecografias", `Animal ${diio} not found, skipping`);
        counts.skip_ecografia_animal_no_encontrado++;
        continue;
      }

      const fecha = toDate(item.fecha_ecografia ?? item.fecha);
      if (!fecha) { counts.skip_ecografia_sin_fecha++; continue; }

      // Validar días de gestación: skip si < 0 o > 285
      if (item.dias_gestacion != null && (item.dias_gestacion < 0 || item.dias_gestacion > 285)) {
        warn("P8:ecografias", `Animal ${diio} — dias_gestacion inválido (${item.dias_gestacion}), skipping`);
        counts.skip_ecografia_dias_invalidos++;
        continue;
      }

      // Mapear resultado AgroApp → enum smartcow (preñada/vacia/dudosa)
      const resultadoRaw = (item.resultado ?? "").toLowerCase();
      let resultado: "preñada" | "vacia" | "dudosa" = "dudosa";
      if (resultadoRaw.includes("pre") || resultadoRaw.includes("gest")) resultado = "preñada";
      else if (resultadoRaw.includes("vac") || resultadoRaw.includes("neg")) resultado = "vacia";

      await db.insert(schema.ecografias).values({
        predioId: smartFundoId,
        animalId,
        fecha,
        resultado,
        diasGestacion: item.dias_gestacion ?? null,
        observaciones: item.observaciones?.trim() || null,
      }).onConflictDoNothing();

      counts.ecografias++;
    }
  }
  log("P8:ecografias", `Done — ${counts.ecografias} inserted`);
}

// ─────────────────────────────────────────────
// P9 — ARETEOS (alta + aparición + cambio DIIO)
// ─────────────────────────────────────────────

async function migrarAreteos(session: Awaited<ReturnType<typeof getSession>>): Promise<void> {
  log("P9:areteos", `Fetching desde=${DESDE} hasta=${HASTA}...`);

  for (const [agroFundoId, smartFundoId] of mapFundo.entries()) {
    // Alta — AgroApp getAllAlta requiere jsonFiltros (ver bundle impl 5)
    const filtrosAlta = {
      fundo_id: agroFundoId,
      fundo_origen_id: 0,
      tipo_ganado: "Todos",
      raza_id: 0,
      estado_reproductivo: "Todos",
      estado_leche: "Todos",
      usuario_id: 0,
      order: "Descendente",
      tipo_order: "Diio",
      desde: DESDE,
      hasta: HASTA,
    };
    const rawAlta = await servletPost<unknown>(session, "Areteo", "getAllAlta", {
      jsonFiltros: JSON.stringify(filtrosAlta),
    });
    const altas = extractArray<AgroAreteoAlta>(rawAlta);

    if (!DRY_RUN) {
      for (const item of altas) {
        const diio = item.diio?.trim();
        if (!diio) { continue; }
        const aKey = `${smartFundoId}:${diio}`;
        const animalId = mapAnimal.get(aKey);
        if (!animalId) { continue; }
        const fecha = toDate(item.fecha ?? item.fecha_creado);
        if (!fecha) { continue; }

        await db.insert(schema.areteos).values({
          predioId: smartFundoId,
          animalId,
          tipo: "alta",
          fecha,
          diioNuevo: diio,
          observaciones: item.observaciones?.trim() || null,
        }).onConflictDoNothing();

        counts.areteos++;
      }
    } else {
      counts.areteos += altas.length;
    }

    // Aparición — mismo filtro que Alta
    const filtrosAparicion = {
      fundo_id: agroFundoId,
      fundo_origen_id: 0,
      tipo_ganado: "Todos",
      raza_id: 0,
      estado_reproductivo: "Todos",
      estado_leche: "Todos",
      usuario_id: 0,
      order: "Descendente",
      tipo_order: "Diio",
      desde: DESDE,
      hasta: HASTA,
    };
    const rawAparicion = await servletPost<unknown>(session, "Areteo", "getAllAparicion", {
      jsonFiltros: JSON.stringify(filtrosAparicion),
    });
    const apariciones = extractArray<AgroAreteoAlta>(rawAparicion);

    if (!DRY_RUN) {
      for (const item of apariciones) {
        const diio = item.diio?.trim();
        if (!diio) { continue; }
        const aKey = `${smartFundoId}:${diio}`;
        const animalId = mapAnimal.get(aKey);
        if (!animalId) { continue; }
        const fecha = toDate(item.fecha ?? item.fecha_creado);
        if (!fecha) { continue; }

        await db.insert(schema.areteos).values({
          predioId: smartFundoId,
          animalId,
          tipo: "aparicion",
          fecha,
          diioNuevo: diio,
          observaciones: item.observaciones?.trim() || null,
        }).onConflictDoNothing();

        counts.areteos++;
      }
    } else {
      counts.areteos += apariciones.length;
    }

    // Cambio DIIO — bug conocido en AgroApp: getAllCambioDiio tiene SQL inválido en servidor
    // el ORDER BY genera error de sintaxis independientemente del valor enviado
    // Se intenta igualmente para no bloquear la migración; se captura el error
    let cambios: AgroCambioDiio[] = [];
    try {
      const filtrosCambio = {
        fundo_id: agroFundoId,
        usuario_id: 0,
        order: "Descendente",
        tipo_order: "Diio",
        desde: DESDE,
        hasta: HASTA,
      };
      const rawCambio = await servletPost<unknown>(session, "Areteo", "getAllCambioDiio", {
        jsonFiltros: JSON.stringify(filtrosCambio),
      });
      cambios = extractArray<AgroCambioDiio>(rawCambio);
    } catch (e) {
      warn("P9:areteos", `getAllCambioDiio fundo=${agroFundoId}: bug SQL en servidor AgroApp — skipping`);
    }

    if (!DRY_RUN) {
      for (const item of cambios) {
        const diioNuevo = item.diio_nuevo?.trim();
        const diioAnterior = item.diio_anterior?.trim();
        if (!diioNuevo) { continue; }

        // Buscar animal por DIIO nuevo (ya migrado con DIIO actual)
        const aKey = `${smartFundoId}:${diioNuevo}`;
        const animalId = mapAnimal.get(aKey);
        if (!animalId) { continue; }

        const fecha = toDate(item.fecha_cambio_diio ?? item.fecha);
        if (!fecha) { continue; }

        await db.insert(schema.areteos).values({
          predioId: smartFundoId,
          animalId,
          tipo: "cambio_diio",
          fecha,
          diioNuevo,
          diioAnterior: diioAnterior || null,
          observaciones: item.observaciones?.trim() || null,
        }).onConflictDoNothing();

        counts.areteos++;
      }
    } else {
      counts.areteos += cambios.length;
    }
  }
  log("P9:areteos", `Done — ${counts.areteos} inserted`);
}

// ─────────────────────────────────────────────
// P10 — BAJAS
// ─────────────────────────────────────────────

async function migrarBajas(session: Awaited<ReturnType<typeof getSession>>): Promise<void> {
  log("P10:bajas", `Fetching desde=${DESDE} hasta=${HASTA}...`);

  for (const [agroFundoId, smartFundoId] of mapFundo.entries()) {
    // AgroApp getAllBaja requiere jsonFiltros (ver bundle impl 7)
    const filtrosBaja = {
      fundo_id: agroFundoId,
      tipo_ganado: "Todos",
      estado_reproductivo: "Todos",
      estado_leche: "Todos",
      baja_motivo_org_id: 0,
      baja_causa_org_id: 0,
      usuario_id: 0,
      order: "Descendente",
      tipo_order: "Diio",
      desde: DESDE,
      hasta: HASTA,
    };
    const raw = await servletPost<unknown>(session, "Baja", "getAllBaja", {
      jsonFiltros: JSON.stringify(filtrosBaja),
    });

    const items = extractArray<AgroBaja>(raw);
    log("P10:bajas", `Fundo ${agroFundoId}: ${items.length} records`);

    if (DRY_RUN) {
      counts.bajas += items.length;
      continue;
    }

    for (const item of items) {
      const diio = item.diio?.trim();
      if (!diio) { counts.skip_baja_sin_diio++; continue; }

      const aKey = `${smartFundoId}:${diio}`;
      const animalId = mapAnimal.get(aKey);
      if (!animalId) {
        warn("P10:bajas", `Animal ${diio} not found, skipping baja`);
        counts.skip_baja_animal_no_encontrado++;
        continue;
      }

      const fecha = toDate(item.fecha_baja ?? item.fecha);
      if (!fecha) { counts.skip_baja_sin_fecha++; continue; }

      const motivoNombre = item.baja_motivo?.trim();
      const motivoId = motivoNombre ? mapBajaMotivo.get(motivoNombre) : undefined;

      if (!motivoId) {
        warn("P10:bajas", `Motivo "${motivoNombre}" not in map for animal ${diio}, skipping`);
        counts.skip_baja_motivo_no_encontrado++;
        continue;
      }

      const causaNombre = item.baja_causa?.trim();
      const cKey = motivoNombre && causaNombre ? `${motivoNombre}:${causaNombre}` : undefined;
      const causaId = cKey ? mapBajaCausa.get(cKey) : undefined;

      await db.insert(schema.bajas).values({
        predioId: smartFundoId,
        animalId,
        fecha,
        motivoId,
        causaId: causaId ?? null,
        pesoKg: item.peso_kg != null ? String(item.peso_kg) : null,
        observaciones: item.observaciones?.trim() || null,
      }).onConflictDoNothing();

      // Marcar animal como baja
      await db
        .update(schema.animales)
        .set({ estado: "baja" })
        .where(eq(schema.animales.id, animalId));

      counts.bajas++;
    }
  }
  log("P10:bajas", `Done — ${counts.bajas} inserted`);
}

// ─────────────────────────────────────────────
// VALIDACIÓN POST-MIGRACIÓN
// ─────────────────────────────────────────────

async function validar(): Promise<void> {
  log("VALIDACION", "Verificando integridad...");

  if (DRY_RUN) {
    log("VALIDACION", "DRY_RUN activo — skipping DB checks");
    return;
  }

  // Verificar que no hay animales sin tipo_ganado
  const sinTipo = await db.execute(
    sql`SELECT COUNT(*) AS n FROM animales WHERE tipo_ganado_id IS NULL`
  );
  log("VALIDACION", `Animales sin tipo_ganado: ${JSON.stringify(sinTipo.rows)}`);

  // Conteo final por tabla
  const tables = [
    { name: "fundos", table: schema.predios },
    { name: "tipo_ganado", table: schema.tipoGanado },
    { name: "razas", table: schema.razas },
    { name: "medieros", table: schema.medieros },
    { name: "animales", table: schema.animales },
    { name: "pesajes", table: schema.pesajes },
    { name: "partos", table: schema.partos },
    { name: "inseminaciones", table: schema.inseminaciones },
    { name: "ecografias", table: schema.ecografias },
    { name: "areteos", table: schema.areteos },
    { name: "bajas", table: schema.bajas },
  ] as const;

  for (const { name, table } of tables) {
    const rows = await db.select().from(table as typeof schema.predios);
    log("VALIDACION", `${name}: ${rows.length} rows in DB`);
  }
}

// ─────────────────────────────────────────────
// RESUMEN FINAL
// ─────────────────────────────────────────────

function printResumen(): void {
  console.log("\n" + "=".repeat(60));
  console.log(DRY_RUN ? "DRY RUN COMPLETADO" : "MIGRACIÓN COMPLETADA");
  console.log("=".repeat(60));
  console.log(`Periodo: ${DESDE} → ${HASTA}`);
  if (FUNDO_FILTER) console.log(`Fundo filtrado: ${FUNDO_FILTER}`);
  console.log("-".repeat(60));
  console.log(`Fundos              : ${counts.fundos}`);
  console.log(`Tipo ganado         : ${counts.tipo_ganado}`);
  console.log(`Razas               : ${counts.razas}`);
  console.log(`Estado reproductivo : ${counts.estado_reproductivo}`);
  console.log(`Semen               : ${counts.semen}`);
  console.log(`Medieros            : ${counts.medieros}`);
  console.log(`Animales            : ${counts.animales}`);
  console.log(`Pesajes             : ${counts.pesajes}`);
  console.log(`Partos              : ${counts.partos}`);
  console.log(`Inseminaciones      : ${counts.inseminaciones}`);
  console.log(`Ecografías          : ${counts.ecografias}`);
  console.log(`Areteos             : ${counts.areteos}`);
  console.log(`Bajas               : ${counts.bajas}`);
  console.log("-".repeat(60));
  console.log("SKIPPED POR REGLA");
  console.log(`  animal.diio_vacio              : ${counts.skip_animal_diio_vacio}`);
  console.log(`  animal.tipo_ganado_desconocido : ${counts.skip_animal_tipo_ganado_desconocido}`);
  console.log(`  pesaje.diio_vacio              : ${counts.skip_pesaje_diio_vacio}`);
  console.log(`  pesaje.animal_no_encontrado    : ${counts.skip_pesaje_animal_no_encontrado}`);
  console.log(`  pesaje.peso_invalido           : ${counts.skip_pesaje_peso_invalido}`);
  console.log(`  pesaje.sin_fecha               : ${counts.skip_pesaje_sin_fecha}`);
  console.log(`  pesaje.dedup                   : ${counts.skip_pesaje_dedup}`);
  console.log(`  parto.sin_diio_madre           : ${counts.skip_parto_sin_diio_madre}`);
  console.log(`  parto.madre_no_encontrada      : ${counts.skip_parto_madre_no_encontrada}`);
  console.log(`  parto.sin_fecha                : ${counts.skip_parto_sin_fecha}`);
  console.log(`  inseminacion.sin_diio          : ${counts.skip_inseminacion_sin_diio}`);
  console.log(`  inseminacion.animal_no_enc     : ${counts.skip_inseminacion_animal_no_encontrado}`);
  console.log(`  inseminacion.sin_fecha         : ${counts.skip_inseminacion_sin_fecha}`);
  console.log(`  ecografia.sin_diio             : ${counts.skip_ecografia_sin_diio}`);
  console.log(`  ecografia.animal_no_enc        : ${counts.skip_ecografia_animal_no_encontrado}`);
  console.log(`  ecografia.sin_fecha            : ${counts.skip_ecografia_sin_fecha}`);
  console.log(`  ecografia.dias_invalidos       : ${counts.skip_ecografia_dias_invalidos}`);
  console.log(`  baja.sin_diio                  : ${counts.skip_baja_sin_diio}`);
  console.log(`  baja.animal_no_encontrado      : ${counts.skip_baja_animal_no_encontrado}`);
  console.log(`  baja.sin_fecha                 : ${counts.skip_baja_sin_fecha}`);
  console.log(`  baja.motivo_no_encontrado      : ${counts.skip_baja_motivo_no_encontrado}`);
  console.log("-".repeat(60));
  console.log("WARNS POR REGLA");
  console.log(`  animal.sin_fecha_nacimiento    : ${counts.warn_animal_sin_fecha_nacimiento}`);
  console.log(`  parto.madre_macho              : ${counts.warn_parto_madre_macho}`);
  console.log(`  inseminacion.animal_en_baja    : ${counts.warn_inseminacion_animal_en_baja}`);
  console.log("=".repeat(60));
  console.log("\nPara activar corte por módulo (deshabilitar AgroApp proxy):");
  console.log("  AGROAPP_MODULE_GANADO_ACTUAL=0");
  console.log("  AGROAPP_MODULE_PESAJES=0");
  console.log("  AGROAPP_MODULE_PARTOS=0");
  console.log("  AGROAPP_MODULE_INSEMINACIONES=0");
  console.log("  AGROAPP_MODULE_ECOGRAFIAS=0");
  console.log("=".repeat(60));
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main(): Promise<void> {
  log("ETL", `Iniciando migración AgroApp → SmartCow (DRY_RUN=${DRY_RUN})`);

  const session = await getSession();

  try {
    // P1 — Catálogos
    await migrarTipoGanado(session);
    await migrarRazas(session);
    await migrarEstadoReproductivo(session);
    await migrarBajaMotivos(session);

    // P0 — Organización raíz
    defaultOrgId = await asegurarOrg("JP Ferrada");

    // P2 — Fundos
    await migrarFundos(session);

    // P3 — Semen (requiere fundos)
    await migrarSemen(session);

    // P4 — Animales (requiere catálogos + fundos)
    await migrarAnimales(session);

    // P5-P10 — Eventos (requieren animales)
    await migrarPesajes(session);
    await migrarPartos(session);
    await migrarInseminaciones(session);
    await migrarEcografias(session);
    await migrarAreteos(session);
    await migrarBajas(session);

    // Validación
    await validar();
  } finally {
    await destroySession();
    await pool.end();
  }

  printResumen();
}

main().catch((err) => {
  console.error("[ETL] Fatal error:", err);
  process.exit(1);
});
