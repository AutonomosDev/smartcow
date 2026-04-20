/**
 * src/lib/queries/predio.ts — Queries compartidas de dominio ganadero.
 * Usadas por endpoints REST (mobile) y Server Components (web).
 *
 * Funciones exportadas:
 *   getPredioKpis           — KPIs del predio para home/dashboard
 *   getPredioKpisFiltered   — KPIs filtrados por tipo_ganado + estado_reproductivo
 *   getPrediosConAnimales   — Lista de predios con conteo de animales (para dropdown)
 *   getCategoriasPorPredio  — Tipos de ganado presentes en un predio
 *   getLotesActivos         — Lista de lotes activos con count de animales
 *   getLoteDetalle          — Detalle de un lote con GDP y peso promedio
 */

import { db } from "@/src/db/client";
import {
  animales,
  lotes,
  loteAnimales,
  pesajes,
  partos,
  ecografias,
  predios,
  potreros,
  movimientosPotrero,
  tipoGanado,
  razas,
  estadoReproductivo,
} from "@/src/db/schema/index";
import { eq, and, desc, isNull, inArray, sql, count } from "drizzle-orm";

// ─────────────────────────────────────────────
// PESAJES POR LOTE — contexto para chat LLM
// ─────────────────────────────────────────────

export interface PesajePorLote {
  loteId: number;
  loteNombre: string;
  fecha: string;
  pesoPromedioKg: number;
  gdpKgDia: number | null;
}

/**
 * Último pesaje promedio por lote activo del predio, con GDP calculado
 * desde fecha_entrada del lote. Usado para enriquecer el system prompt del chat.
 *
 * Ticket: AUT-256
 */
export async function getUltimoPesajePorLote(predioId: number): Promise<PesajePorLote[]> {
  const result = await db.execute(sql`
    WITH lotes_activos AS (
      SELECT l.id, l.nombre, l.fecha_entrada
      FROM lotes l
      WHERE l.predio_id = ${predioId} AND l.estado = 'activo'
    ),
    animales_en_lote AS (
      SELECT la.lote_id, la.animal_id, la.peso_entrada_kg
      FROM lote_animales la
      JOIN lotes_activos lo ON la.lote_id = lo.id
      WHERE la.fecha_salida IS NULL
    ),
    ultimos_pesajes AS (
      SELECT
        p.animal_id,
        p.peso_kg,
        p.fecha,
        ROW_NUMBER() OVER (PARTITION BY p.animal_id ORDER BY p.fecha DESC) AS rn
      FROM pesajes p
      WHERE p.predio_id = ${predioId}
    )
    SELECT
      al.lote_id,
      lo.nombre AS lote_nombre,
      MAX(up.fecha) AS ultimo_pesaje_fecha,
      ROUND(AVG(up.peso_kg::numeric), 1) AS peso_promedio_kg,
      ROUND(
        (AVG(up.peso_kg::numeric) - AVG(COALESCE(al.peso_entrada_kg::numeric, up.peso_kg::numeric))) /
        NULLIF(
          EXTRACT(EPOCH FROM (CURRENT_DATE - lo.fecha_entrada::date)) / 86400,
          0
        ),
        3
      ) AS gdp_kg_dia
    FROM animales_en_lote al
    JOIN lotes_activos lo ON al.lote_id = lo.id
    JOIN ultimos_pesajes up ON al.animal_id = up.animal_id AND up.rn = 1
    GROUP BY al.lote_id, lo.nombre, lo.fecha_entrada
    ORDER BY lo.nombre
  `);

  type Row = {
    lote_id: number | string;
    lote_nombre: string;
    ultimo_pesaje_fecha: string;
    peso_promedio_kg: string | number | null;
    gdp_kg_dia: string | number | null;
  };

  return (result.rows as Row[]).map((r) => ({
    loteId: Number(r.lote_id),
    loteNombre: r.lote_nombre,
    fecha: r.ultimo_pesaje_fecha,
    pesoPromedioKg: r.peso_promedio_kg != null ? Number(r.peso_promedio_kg) : 0,
    gdpKgDia: r.gdp_kg_dia != null ? Number(r.gdp_kg_dia) : null,
  }));
}

// ─────────────────────────────────────────────
// TIPOS PÚBLICOS
// ─────────────────────────────────────────────

export interface PredioKpis {
  totalAnimales: number;
  totalPesajes: number;
  totalPartos: number;
  totalEcografias: number;
  ultimoPesaje: { fecha: string; pesoKg: number } | null;
}

export interface LoteResumen {
  id: number;
  nombre: string;
  totalAnimales: number;
  fechaEntrada: string;
  fechaSalidaEstimada: string | null;
  objetivoPesoKg: number | null;
  estado: string;
}

export interface LoteDetalle {
  id: number;
  nombre: string;
  fechaEntrada: string;
  fechaSalidaEstimada: string | null;
  objetivoPesoKg: number | null;
  estado: string;
  totalAnimales: number;
  avgPesoActualKg: number | null;
  avgPesoEntradaKg: number | null;
  diasEnLote: number;
  gdpKgDia: number | null;
}

// ─────────────────────────────────────────────
// IMPLEMENTACIONES
// ─────────────────────────────────────────────

/**
 * Primer predio de la organización, ordenado por id ASC.
 * Usado para admin_org que no tiene user_predios explícitos.
 */
export async function getPrimerPredioDeOrg(orgId: number): Promise<number | null> {
  const rows = await db
    .select({ id: predios.id })
    .from(predios)
    .where(eq(predios.orgId, orgId))
    .orderBy(predios.id)
    .limit(1);
  return rows[0]?.id ?? null;
}

/**
 * Nombre del predio por ID. Retorna null si no existe.
 */
export async function getNombrePredio(predioId: number): Promise<string | null> {
  const rows = await db
    .select({ nombre: predios.nombre })
    .from(predios)
    .where(eq(predios.id, predioId))
    .limit(1);
  return rows[0]?.nombre ?? null;
}

/**
 * Mapa id → nombre para una lista de predios.
 * Usado para inyectar nombres reales en el system prompt.
 */
export async function getPrediosNombres(predioIds: number[]): Promise<Map<number, string>> {
  if (predioIds.length === 0) return new Map();
  const rows = await db
    .select({ id: predios.id, nombre: predios.nombre })
    .from(predios)
    .where(inArray(predios.id, predioIds));
  return new Map(rows.map((r) => [r.id, r.nombre]));
}

/**
 * KPIs del predio para el dashboard/home:
 * - Lotes activos (estado = 'activo')
 * - Total animales activos
 * - Último pesaje registrado
 */
export async function getPredioKpis(predioId: number): Promise<PredioKpis> {
  const [animalesRows, pesajesRows, partosRows, ecografiasRows, pesajeRows] = await Promise.all([
    db
      .select({ id: animales.id })
      .from(animales)
      .where(and(eq(animales.predioId, predioId), eq(animales.estado, "activo"))),

    db
      .select({ id: pesajes.id })
      .from(pesajes)
      .where(eq(pesajes.predioId, predioId)),

    db
      .select({ id: partos.id })
      .from(partos)
      .where(eq(partos.predioId, predioId)),

    db
      .select({ id: ecografias.id })
      .from(ecografias)
      .where(eq(ecografias.predioId, predioId)),

    db
      .select({ fecha: pesajes.fecha, pesoKg: pesajes.pesoKg })
      .from(pesajes)
      .where(eq(pesajes.predioId, predioId))
      .orderBy(desc(pesajes.fecha))
      .limit(1),
  ]);

  return {
    totalAnimales: animalesRows.length,
    totalPesajes: pesajesRows.length,
    totalPartos: partosRows.length,
    totalEcografias: ecografiasRows.length,
    ultimoPesaje: pesajeRows[0]
      ? {
          fecha: pesajeRows[0].fecha,
          pesoKg: Number(pesajeRows[0].pesoKg),
        }
      : null,
  };
}

// ─────────────────────────────────────────────
// NUEVAS QUERIES PARA DASHBOARD FILTRADO
// ─────────────────────────────────────────────

export interface PredioConAnimales {
  id: number;
  nombre: string;
  totalAnimales: number;
}

export interface CategoriaConAnimales {
  id: number;
  nombre: string;
  totalAnimales: number;
  esMacho: boolean;
}

const TIPOS_MACHO = ["Novillo", "Ternero", "Toro"];

/**
 * Predios del usuario ordenados por cantidad de animales activos DESC.
 * Usado para popular el dropdown de predio en el dashboard.
 */
export async function getPrediosConAnimales(
  predioIds: number[]
): Promise<PredioConAnimales[]> {
  if (predioIds.length === 0) return [];
  const rows = await db
    .select({
      id: predios.id,
      nombre: predios.nombre,
      totalAnimales: sql<number>`cast(count(${animales.id}) as int)`,
    })
    .from(predios)
    .leftJoin(
      animales,
      and(eq(animales.predioId, predios.id), eq(animales.estado, "activo"))
    )
    .where(inArray(predios.id, predioIds))
    .groupBy(predios.id)
    .orderBy(sql`count(${animales.id}) desc`);

  return rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    totalAnimales: r.totalAnimales,
  }));
}

/**
 * Tipos de ganado presentes en un predio con su conteo.
 * Incluye flag esMacho para controlar el selector de estado en UI.
 */
export async function getCategoriasPorPredio(
  predioId: number
): Promise<CategoriaConAnimales[]> {
  const rows = await db
    .select({
      id: tipoGanado.id,
      nombre: tipoGanado.nombre,
      totalAnimales: sql<number>`cast(count(${animales.id}) as int)`,
    })
    .from(animales)
    .innerJoin(tipoGanado, eq(animales.tipoGanadoId, tipoGanado.id))
    .where(and(eq(animales.predioId, predioId), eq(animales.estado, "activo")))
    .groupBy(tipoGanado.id)
    .orderBy(sql`count(${animales.id}) desc`);

  return rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    totalAnimales: r.totalAnimales,
    esMacho: TIPOS_MACHO.includes(r.nombre),
  }));
}

/**
 * KPIs filtrados por tipo_ganado y/o estado_reproductivo.
 * Si los filtros son undefined → comportamiento igual a getPredioKpis.
 */
export async function getPredioKpisFiltered(
  predioId: number,
  tipoGanadoId?: number,
  estadoReproductivoId?: number
): Promise<PredioKpis> {
  const baseWhere = and(
    eq(animales.predioId, predioId),
    eq(animales.estado, "activo"),
    tipoGanadoId !== undefined ? eq(animales.tipoGanadoId, tipoGanadoId) : undefined,
    estadoReproductivoId !== undefined
      ? eq(animales.estadoReproductivoId, estadoReproductivoId)
      : undefined
  );

  const pesajesWhere = and(
    eq(pesajes.predioId, predioId),
    tipoGanadoId !== undefined
      ? sql`${pesajes.animalId} IN (SELECT id FROM animales WHERE predio_id = ${predioId} AND tipo_ganado_id = ${tipoGanadoId} AND estado = 'activo')`
      : undefined
  );

  const partosWhere = and(
    eq(partos.predioId, predioId),
    tipoGanadoId !== undefined
      ? sql`${partos.madreId} IN (SELECT id FROM animales WHERE predio_id = ${predioId} AND tipo_ganado_id = ${tipoGanadoId} AND estado = 'activo')`
      : undefined
  );

  const [animalesRows, pesajesRows, partosRows, ecografiasRows, pesajeRows] =
    await Promise.all([
      db.select({ id: animales.id }).from(animales).where(baseWhere),

      db.select({ id: pesajes.id }).from(pesajes).where(pesajesWhere),

      db.select({ id: partos.id }).from(partos).where(partosWhere),

      db
        .select({ id: ecografias.id })
        .from(ecografias)
        .where(eq(ecografias.predioId, predioId)),

      db
        .select({ fecha: pesajes.fecha, pesoKg: pesajes.pesoKg })
        .from(pesajes)
        .where(eq(pesajes.predioId, predioId))
        .orderBy(desc(pesajes.fecha))
        .limit(1),
    ]);

  return {
    totalAnimales: animalesRows.length,
    totalPesajes: pesajesRows.length,
    totalPartos: partosRows.length,
    totalEcografias: ecografiasRows.length,
    ultimoPesaje: pesajeRows[0]
      ? { fecha: pesajeRows[0].fecha, pesoKg: Number(pesajeRows[0].pesoKg) }
      : null,
  };
}

/**
 * Lista de lotes activos del predio, con cantidad de animales actualmente en cada lote
 * (animales sin fecha_salida en lote_animales).
 */
export async function getLotesActivos(predioId: number): Promise<LoteResumen[]> {
  // 1. Lotes activos del predio
  const lotesRows = await db
    .select({
      id: lotes.id,
      nombre: lotes.nombre,
      fechaEntrada: lotes.fechaEntrada,
      fechaSalidaEstimada: lotes.fechaSalidaEstimada,
      objetivoPesoKg: lotes.objetivoPesoKg,
      estado: lotes.estado,
    })
    .from(lotes)
    .where(and(eq(lotes.predioId, predioId), eq(lotes.estado, "activo")))
    .orderBy(desc(lotes.fechaEntrada));

  if (lotesRows.length === 0) return [];

  // 2. Count de animales activos por lote (sin fecha_salida)
  const loteIds = lotesRows.map((l) => l.id);
  const memberRows = await db
    .select({ loteId: loteAnimales.loteId, animalId: loteAnimales.animalId })
    .from(loteAnimales)
    .where(
      and(inArray(loteAnimales.loteId, loteIds), isNull(loteAnimales.fechaSalida))
    );

  const countByLote = new Map<number, number>();
  for (const m of memberRows) {
    countByLote.set(m.loteId, (countByLote.get(m.loteId) ?? 0) + 1);
  }

  return lotesRows.map((l) => ({
    id: l.id,
    nombre: l.nombre,
    totalAnimales: countByLote.get(l.id) ?? 0,
    fechaEntrada: l.fechaEntrada,
    fechaSalidaEstimada: l.fechaSalidaEstimada ?? null,
    objetivoPesoKg: l.objetivoPesoKg ? Number(l.objetivoPesoKg) : null,
    estado: l.estado,
  }));
}

/**
 * Detalle de un lote específico con métricas de desempeño:
 * - GDP (ganancia diaria de peso)
 * - Peso promedio actual (último pesaje por animal en el lote)
 * - Peso promedio de entrada
 *
 * Retorna null si el lote no pertenece al predio.
 */
export async function getLoteDetalle(
  loteId: number,
  predioId: number
): Promise<LoteDetalle | null> {
  // 1. Info del lote (validar pertenencia al predio)
  const loteRows = await db
    .select({
      id: lotes.id,
      nombre: lotes.nombre,
      fechaEntrada: lotes.fechaEntrada,
      fechaSalidaEstimada: lotes.fechaSalidaEstimada,
      objetivoPesoKg: lotes.objetivoPesoKg,
      estado: lotes.estado,
    })
    .from(lotes)
    .where(and(eq(lotes.id, loteId), eq(lotes.predioId, predioId)))
    .limit(1);

  if (!loteRows[0]) return null;

  const lote = loteRows[0];

  // 2. Animales actualmente en el lote (sin fecha_salida)
  const memberRows = await db
    .select({
      animalId: loteAnimales.animalId,
      pesoEntradaKg: loteAnimales.pesoEntradaKg,
    })
    .from(loteAnimales)
    .where(
      and(eq(loteAnimales.loteId, loteId), isNull(loteAnimales.fechaSalida))
    );

  const totalAnimales = memberRows.length;
  const animalIds = memberRows.map((m) => m.animalId);

  // Calcular días en lote desde fecha_entrada del lote
  const fechaEntradaDate = new Date(lote.fechaEntrada);
  const hoy = new Date();
  const diasEnLote = Math.max(
    1,
    Math.floor((hoy.getTime() - fechaEntradaDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Promedio peso entrada
  const pesosEntrada = memberRows
    .map((m) => (m.pesoEntradaKg ? Number(m.pesoEntradaKg) : null))
    .filter((p): p is number => p !== null);
  const avgPesoEntradaKg =
    pesosEntrada.length > 0
      ? pesosEntrada.reduce((a, b) => a + b, 0) / pesosEntrada.length
      : null;

  // 3. Último pesaje por animal en el lote → peso promedio actual
  let avgPesoActualKg: number | null = null;

  if (animalIds.length > 0) {
    const pesajeRows = await db
      .select({
        animalId: pesajes.animalId,
        pesoKg: pesajes.pesoKg,
        fecha: pesajes.fecha,
      })
      .from(pesajes)
      .where(inArray(pesajes.animalId, animalIds))
      .orderBy(desc(pesajes.fecha));

    const latestByAnimal = new Map<number, number>();
    for (const p of pesajeRows) {
      if (!latestByAnimal.has(p.animalId)) {
        latestByAnimal.set(p.animalId, Number(p.pesoKg));
      }
    }

    const pesosActuales = Array.from(latestByAnimal.values());
    if (pesosActuales.length > 0) {
      avgPesoActualKg =
        pesosActuales.reduce((a, b) => a + b, 0) / pesosActuales.length;
    }
  }

  // GDP = (peso actual - peso entrada) / días
  const gdpKgDia =
    avgPesoActualKg !== null && avgPesoEntradaKg !== null && diasEnLote > 0
      ? (avgPesoActualKg - avgPesoEntradaKg) / diasEnLote
      : null;

  return {
    id: lote.id,
    nombre: lote.nombre,
    fechaEntrada: lote.fechaEntrada,
    fechaSalidaEstimada: lote.fechaSalidaEstimada ?? null,
    objetivoPesoKg: lote.objetivoPesoKg ? Number(lote.objetivoPesoKg) : null,
    estado: lote.estado,
    totalAnimales,
    avgPesoActualKg: avgPesoActualKg !== null ? Math.round(avgPesoActualKg * 10) / 10 : null,
    avgPesoEntradaKg: avgPesoEntradaKg !== null ? Math.round(avgPesoEntradaKg * 10) / 10 : null,
    diasEnLote,
    gdpKgDia: gdpKgDia !== null ? Math.round(gdpKgDia * 100) / 100 : null,
  };
}

// ─────────────────────────────────────────────
// ANIMALES
// ─────────────────────────────────────────────

export interface AnimalResumen {
  id: number;
  diio: string;
  eid: string | null;
  tipoGanado: string;
  raza: string | null;
  sexo: "M" | "H";
  fechaNacimiento: string | null;
  estado: "activo" | "baja" | "desecho";
  moduloActual: "feedlot" | "crianza" | "ambos" | null;
}

/**
 * Lista de animales activos del predio con tipo y raza resueltos.
 */
export async function getAnimales(
  predioId: number,
  limit = 500
): Promise<AnimalResumen[]> {
  const rows = await db
    .select({
      id: animales.id,
      diio: animales.diio,
      eid: animales.eid,
      tipoGanado: tipoGanado.nombre,
      raza: razas.nombre,
      sexo: animales.sexo,
      fechaNacimiento: animales.fechaNacimiento,
      estado: animales.estado,
      moduloActual: animales.moduloActual,
    })
    .from(animales)
    .leftJoin(tipoGanado, eq(animales.tipoGanadoId, tipoGanado.id))
    .leftJoin(razas, eq(animales.razaId, razas.id))
    .where(and(eq(animales.predioId, predioId), eq(animales.estado, "activo")))
    .orderBy(animales.diio)
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    diio: r.diio,
    eid: r.eid,
    tipoGanado: r.tipoGanado ?? "—",
    raza: r.raza ?? null,
    sexo: r.sexo,
    fechaNacimiento: r.fechaNacimiento,
    estado: r.estado,
    moduloActual: r.moduloActual,
  }));
}

// ─────────────────────────────────────────────
// POTREROS
// ─────────────────────────────────────────────

export interface PotreroCon {
  id: number;
  nombre: string;
  hectareas: number | null;
  capacidad: number | null;
  animalesActuales: number;
}

/**
 * Potreros del predio con conteo de animales actualmente en cada potrero
 * (movimientos_potrero con fecha_salida IS NULL).
 */
export async function getPotrerosConAnimales(predioId: number): Promise<PotreroCon[]> {
  const potrerosRows = await db
    .select({
      id: potreros.id,
      nombre: potreros.nombre,
      hectareas: potreros.hectareas,
      capacidad: potreros.capacidadAnimales,
    })
    .from(potreros)
    .where(eq(potreros.predioId, predioId))
    .orderBy(potreros.nombre);

  if (potrerosRows.length === 0) return [];

  const potreroIds = potrerosRows.map((p) => p.id);
  const movRows = await db
    .select({ potreroId: movimientosPotrero.potreroId })
    .from(movimientosPotrero)
    .where(
      and(
        inArray(movimientosPotrero.potreroId, potreroIds),
        isNull(movimientosPotrero.fechaSalida)
      )
    );

  const countByPotrero = new Map<number, number>();
  for (const m of movRows) {
    countByPotrero.set(m.potreroId, (countByPotrero.get(m.potreroId) ?? 0) + 1);
  }

  return potrerosRows.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    hectareas: p.hectareas ? Number(p.hectareas) : null,
    capacidad: p.capacidad ?? null,
    animalesActuales: countByPotrero.get(p.id) ?? 0,
  }));
}

// ─────────────────────────────────────────────
// LOTE PESAJES SERIES
// ─────────────────────────────────────────────

export interface PesajeSerie {
  fecha: string;
  avgPesoKg: number;
  gdpKgDia: number | null;
}

export interface LotePesajesResult {
  series: PesajeSerie[];
  periodosDias: number;
}

/**
 * Serie temporal de pesajes promedio para un lote.
 * Agrupa todos los pesajes de animales del lote por fecha,
 * calcula promedio de peso y GDP entre fechas consecutivas.
 */
export async function getLotePesajesSeries(
  loteId: number,
  predioId: number
): Promise<LotePesajesResult> {
  // 1. Validar que el lote pertenece al predio
  const loteRows = await db
    .select({ id: lotes.id, fechaEntrada: lotes.fechaEntrada })
    .from(lotes)
    .where(and(eq(lotes.id, loteId), eq(lotes.predioId, predioId)))
    .limit(1);

  if (!loteRows[0]) return { series: [], periodosDias: 0 };

  // 2. Animales del lote
  const memberRows = await db
    .select({ animalId: loteAnimales.animalId })
    .from(loteAnimales)
    .where(eq(loteAnimales.loteId, loteId));

  if (memberRows.length === 0) return { series: [], periodosDias: 0 };

  const animalIds = memberRows.map((m) => m.animalId);

  // 3. Todos los pesajes de esos animales ordenados por fecha
  const pesajeRows = await db
    .select({
      fecha: pesajes.fecha,
      pesoKg: pesajes.pesoKg,
    })
    .from(pesajes)
    .where(inArray(pesajes.animalId, animalIds))
    .orderBy(pesajes.fecha);

  if (pesajeRows.length === 0) return { series: [], periodosDias: 0 };

  // 4. Agrupar por fecha y calcular promedio
  const byFecha = new Map<string, number[]>();
  for (const p of pesajeRows) {
    const list = byFecha.get(p.fecha) ?? [];
    list.push(Number(p.pesoKg));
    byFecha.set(p.fecha, list);
  }

  const fechasOrdenadas = Array.from(byFecha.keys()).sort();
  const seriesRaw = fechasOrdenadas.map((fecha) => {
    const pesos = byFecha.get(fecha)!;
    const avg = pesos.reduce((a, b) => a + b, 0) / pesos.length;
    return { fecha, avgPesoKg: Math.round(avg * 10) / 10 };
  });

  // 5. Calcular GDP entre fechas consecutivas
  const series: PesajeSerie[] = seriesRaw.map((s, i) => {
    if (i === 0) return { ...s, gdpKgDia: null };
    const prev = seriesRaw[i - 1];
    const dias =
      (new Date(s.fecha).getTime() - new Date(prev.fecha).getTime()) /
      (1000 * 60 * 60 * 24);
    const gdp = dias > 0 ? (s.avgPesoKg - prev.avgPesoKg) / dias : null;
    return {
      ...s,
      gdpKgDia: gdp !== null ? Math.round(gdp * 100) / 100 : null,
    };
  });

  const periodosDias =
    fechasOrdenadas.length >= 2
      ? Math.round(
          (new Date(fechasOrdenadas[fechasOrdenadas.length - 1]).getTime() -
            new Date(fechasOrdenadas[0]).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  return { series, periodosDias };
}

// ─────────────────────────────────────────────
// ACTIVIDAD RECIENTE
// ─────────────────────────────────────────────

export interface RecentEvent {
  type: "pesaje" | "parto";
  fecha: string;
  descripcion: string;
  creadoEn: string;
}

/**
 * Últimos N eventos del predio (pesajes + partos) ordenados por fecha de creación.
 */
export async function getRecentActivity(
  predioId: number,
  limit = 8
): Promise<RecentEvent[]> {
  const [pesajesRows, partosRows] = await Promise.all([
    db
      .select({ fecha: pesajes.fecha, pesoKg: pesajes.pesoKg, creadoEn: pesajes.creadoEn })
      .from(pesajes)
      .where(eq(pesajes.predioId, predioId))
      .orderBy(desc(pesajes.creadoEn))
      .limit(limit),
    db
      .select({ fecha: partos.fecha, resultado: partos.resultado, creadoEn: partos.creadoEn })
      .from(partos)
      .where(eq(partos.predioId, predioId))
      .orderBy(desc(partos.creadoEn))
      .limit(limit),
  ]);

  const events: RecentEvent[] = [
    ...pesajesRows.map((p) => ({
      type: "pesaje" as const,
      fecha: p.fecha,
      descripcion: `Pesaje · ${Number(p.pesoKg).toFixed(1)} kg`,
      creadoEn: p.creadoEn.toISOString(),
    })),
    ...partosRows.map((p) => ({
      type: "parto" as const,
      fecha: p.fecha,
      descripcion: `Parto · ${p.resultado}`,
      creadoEn: p.creadoEn.toISOString(),
    })),
  ];

  return events
    .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
    .slice(0, limit);
}
