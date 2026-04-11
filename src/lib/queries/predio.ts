/**
 * src/lib/queries/predio.ts — Queries compartidas de dominio ganadero.
 * Usadas por endpoints REST (mobile) y Server Components (web).
 *
 * Funciones exportadas:
 *   getPredioKpis       — KPIs del predio para home/dashboard
 *   getLotesActivos     — Lista de lotes activos con count de animales
 *   getLoteDetalle      — Detalle de un lote con GDP y peso promedio
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
} from "@/src/db/schema/index";
import { eq, and, desc, isNull, inArray } from "drizzle-orm";

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
