/**
 * proxy.ts — Módulos AgroApp scrapeados vía sesión Puppeteer.
 *
 * Módulos implementados (por orden de uso):
 *   1. ganado_actual    — lista animales + datos
 *   2. pesajes          — historial de pesos
 *   3. partos           — registro de partos
 *   4. inseminaciones   — registro de inseminaciones
 *   5. ecografias       — registro de ecografías
 *
 * Rate limiting: no spamear AgroApp — cache 5 min por defecto.
 * Ticket: AUT-124
 */

import { getSession, servletPost } from "./client.js";
import { cache, MemoryCache } from "./cache.js";
import { assertModuleEnabled } from "./modules.js";

// ─────────────────────────────────────────────
// TIPOS PÚBLICOS
// ─────────────────────────────────────────────

export interface FiltrosBase {
  fundo_id?: number;
  desde?: string; // YYYY-MM-DD
  hasta?: string; // YYYY-MM-DD
  order?: string;
  tipo_order?: string;
}

export interface FiltrosGanado extends FiltrosBase {
  tipo_ganado?: number;
  raza_id?: number;
  estado_reproductivo?: number;
  estado_leche?: number;
  desecho?: boolean;
  fecha?: string;
}

export interface FiltrosPesajes extends FiltrosBase {
  tipo_ganado?: number;
  estado_reproductivo?: number;
  descripcion?: string;
  usuario_id?: number;
}

export interface FiltrosPartos extends FiltrosBase {
  tipo_ganado?: number;
  estado_reproductivo?: number;
  estado_leche?: number;
  usuario_id?: number;
}

export interface FiltrosInseminaciones extends FiltrosBase {
  tipo_ganado?: number;
  estado_reproductivo?: number;
  estado_leche?: number;
  usuario_id?: number;
}

export interface FiltrosEcografias extends FiltrosBase {
  tipo_ganado?: number;
  estado_reproductivo?: number;
  estado_leche?: number;
  desecho?: boolean;
  inseminacion_semen_id?: number;
  inseminacion_inseminador_id?: number;
  fecha?: string;
}

// ─────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────

async function cachedServletPost<T>(
  servlet: string,
  servicio: string,
  params: object
): Promise<T> {
  const paramsRecord = params as Record<string, unknown>;
  const cacheKey = MemoryCache.buildKey(`${servlet}/${servicio}`, paramsRecord);
  const cached = cache.get<T>(cacheKey);
  if (cached !== undefined) return cached;

  const session = await getSession();
  const result = await servletPost<T>(session, servlet, servicio, paramsRecord);

  cache.set(cacheKey, result);
  return result;
}

// ─────────────────────────────────────────────
// MÓDULO 1 — GANADO ACTUAL
// ─────────────────────────────────────────────

/**
 * Retorna el listado de animales activos en el fundo.
 * Servlet: GanadoActual / getGanadoActual
 */
export async function getGanadoActual(
  filtros: FiltrosGanado = {}
): Promise<unknown[]> {
  assertModuleEnabled("ganado_actual");
  const result = await cachedServletPost<{ data?: unknown[]; rows?: unknown[] }>(
    "GanadoActual",
    "getGanadoActual",
    filtros
  );
  return result.data ?? result.rows ?? (result as unknown as unknown[]);
}

// ─────────────────────────────────────────────
// MÓDULO 2 — PESAJES
// ─────────────────────────────────────────────

/**
 * Retorna el historial de pesajes.
 * Servlet: Pesaje2 / getAllPesajes
 */
export async function getPesajes(
  filtros: FiltrosPesajes = {}
): Promise<unknown[]> {
  assertModuleEnabled("pesajes");
  const result = await cachedServletPost<{ data?: unknown[]; rows?: unknown[] }>(
    "Pesaje2",
    "getAllPesajes",
    filtros
  );
  return result.data ?? result.rows ?? (result as unknown as unknown[]);
}

/**
 * Retorna vista de ganancias de peso con proyecciones.
 * Servlet: Pesaje2 / getAllGanancias
 */
export async function getGanancias(
  filtros: FiltrosPesajes & { fecha?: string; proyeccion?: string } = {}
): Promise<unknown[]> {
  assertModuleEnabled("pesajes");
  const result = await cachedServletPost<{ data?: unknown[]; rows?: unknown[] }>(
    "Pesaje2",
    "getAllGanancias",
    filtros
  );
  return result.data ?? result.rows ?? (result as unknown as unknown[]);
}

// ─────────────────────────────────────────────
// MÓDULO 3 — PARTOS
// ─────────────────────────────────────────────

/**
 * Retorna el historial de partos.
 * Servlet: Parto / getPartos
 */
export async function getPartos(
  filtros: FiltrosPartos = {}
): Promise<unknown[]> {
  assertModuleEnabled("partos");
  const result = await cachedServletPost<{ data?: unknown[]; rows?: unknown[] }>(
    "Parto",
    "getPartos",
    filtros
  );
  return result.data ?? result.rows ?? (result as unknown as unknown[]);
}

/**
 * Retorna animales próximos a parir.
 * Servlet: Parto / getPartosPendientes
 */
export async function getPartosPendientes(
  filtros: Omit<FiltrosPartos, "desde" | "hasta"> & {
    fecha?: string;
    desecho?: boolean;
    inseminacion_semen_id?: number;
    inseminacion_inseminador_id?: number;
  } = {}
): Promise<unknown[]> {
  assertModuleEnabled("partos");
  const result = await cachedServletPost<{ data?: unknown[]; rows?: unknown[] }>(
    "Parto",
    "getPartosPendientes",
    filtros
  );
  return result.data ?? result.rows ?? (result as unknown as unknown[]);
}

// ─────────────────────────────────────────────
// MÓDULO 4 — INSEMINACIONES
// ─────────────────────────────────────────────

/**
 * Retorna el historial de inseminaciones artificiales.
 * Servlet: Inseminacion / getAllInseminacion
 */
export async function getInseminaciones(
  filtros: FiltrosInseminaciones = {}
): Promise<unknown[]> {
  assertModuleEnabled("inseminaciones");
  const result = await cachedServletPost<{ data?: unknown[]; rows?: unknown[] }>(
    "Inseminacion",
    "getAllInseminacion",
    filtros
  );
  return result.data ?? result.rows ?? (result as unknown as unknown[]);
}

/**
 * Retorna candidatos a inseminación (animales en celo o programados).
 * Servlet: Inseminacion / getCandidatosInseminacion
 */
export async function getInseminacionesPendientes(
  filtros: FiltrosInseminaciones = {}
): Promise<unknown[]> {
  assertModuleEnabled("inseminaciones");
  const result = await cachedServletPost<{ data?: unknown[]; rows?: unknown[] }>(
    "Inseminacion",
    "getCandidatosInseminacion",
    filtros
  );
  return result.data ?? result.rows ?? (result as unknown as unknown[]);
}

// ─────────────────────────────────────────────
// MÓDULO 5 — ECOGRAFÍAS
// ─────────────────────────────────────────────

/**
 * Retorna el historial de ecografías reproductivas.
 * Servlet: Ecografia / getAllEcografia (deducido del patrón de módulos similares)
 */
export async function getEcografias(
  filtros: FiltrosEcografias = {}
): Promise<unknown[]> {
  assertModuleEnabled("ecografias");
  const result = await cachedServletPost<{ data?: unknown[]; rows?: unknown[] }>(
    "Ecografia",
    "getAllEcografia",
    filtros
  );
  return result.data ?? result.rows ?? (result as unknown as unknown[]);
}

/**
 * Retorna ecografías pendientes (animales inseminados sin confirmación).
 * Servlet: Ecografia / getCandidatosEcografia (deducido del patrón)
 */
export async function getEcografiasPendientes(
  filtros: FiltrosEcografias = {}
): Promise<unknown[]> {
  assertModuleEnabled("ecografias");
  const result = await cachedServletPost<{ data?: unknown[]; rows?: unknown[] }>(
    "Ecografia",
    "getCandidatosEcografia",
    filtros
  );
  return result.data ?? result.rows ?? (result as unknown as unknown[]);
}
