/**
 * src/lib/tools/calculos.ts — Tools de cálculo determinísticas para el chat ganadero.
 * Ticket: AUT-268
 *
 * 5 funciones que el LLM puede invocar para obtener resultados exactos y rápidos
 * sin pasar por el modelo para matemática. Todas validan acceso al predio via
 * prediosPermitidos ([] = admin_org/superadmin, acceso total).
 *
 * Exports:
 *   calcular_gdp          — GDP (kg/día) a partir de últimos 2 pesajes
 *   proyectar_peso_venta  — Fecha estimada para alcanzar peso objetivo (regresión lineal)
 *   comparar_predios      — KPI agregado por predio, ordenado desc
 *   ranking_lotes         — Top N lotes por métrica
 *   detectar_anomalias    — Outliers vs avg/stddev del lote
 */

import { db } from "@/src/db/client";
import { sql } from "drizzle-orm";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function predioOk(predioId: number, prediosPermitidos: number[]): boolean {
  return prediosPermitidos.length === 0 || prediosPermitidos.includes(predioId);
}

interface FilaPesaje {
  peso: number;
  fecha: string;
  [key: string]: unknown;
}

// ─────────────────────────────────────────────
// 1. calcular_gdp
// ─────────────────────────────────────────────

export interface CalcularGdpParams {
  loteId?: number;
  animalId?: number;
  predioId?: number;
  rango?: { desde?: string; hasta?: string };
}

export interface CalcularGdpResult {
  gdp: number | null;
  dias: number;
  pesoInicial: number | null;
  pesoFinal: number | null;
  nAnimales: number;
  tendencia: "up" | "down" | "flat" | "n/a";
  scope: string;
  error?: string;
}

/**
 * GDP (kg/día) = (pesoFinal - pesoInicial) / días.
 *
 * Si animalId → último y primer pesaje del rango para ese animal.
 * Si loteId → promedio por animal del lote: primer pesaje vs último pesaje,
 *   luego promedio de las GDP individuales.
 * Si predioId → ídem lote pero para todos los animales del predio.
 */
export async function calcularGdp(
  params: CalcularGdpParams,
  prediosPermitidos: number[]
): Promise<CalcularGdpResult> {
  const desde = params.rango?.desde ?? "2026-01-01";
  const hasta = params.rango?.hasta ?? new Date().toISOString().slice(0, 10);

  if (params.animalId) {
    // Validar predio del animal
    const animalPredio = await db.execute<{ predio_id: number }>(
      sql`SELECT predio_id FROM animales WHERE id = ${params.animalId} LIMIT 1`
    );
    const predioId = Number(animalPredio.rows[0]?.predio_id);
    if (!predioId || !predioOk(predioId, prediosPermitidos)) {
      return emptyGdp("sin acceso al animal");
    }
    const rows = await db.execute<FilaPesaje>(
      sql`SELECT peso_kg::float AS peso, fecha::text AS fecha FROM pesajes
          WHERE animal_id = ${params.animalId}
            AND fecha BETWEEN ${desde}::date AND ${hasta}::date
          ORDER BY fecha ASC`
    );
    const pesajesArr = rows.rows.map((r) => ({ peso: Number(r.peso), fecha: String(r.fecha) }));
    const gdpInd = gdpIndividual(pesajesArr);
    return {
      gdp: gdpInd.gdp,
      dias: gdpInd.dias,
      pesoInicial: gdpInd.pesoInicial,
      pesoFinal: gdpInd.pesoFinal,
      nAnimales: 1,
      tendencia: tendenciaDeGdp(gdpInd.gdp),
      scope: `animal_id=${params.animalId}`,
    };
  }

  if (params.loteId) {
    // Validar predio del lote
    const loteRow = await db.execute<{ predio_id: number }>(
      sql`SELECT predio_id FROM lotes WHERE id = ${params.loteId} LIMIT 1`
    );
    const predioId = Number(loteRow.rows[0]?.predio_id);
    if (!predioId || !predioOk(predioId, prediosPermitidos)) {
      return emptyGdp("sin acceso al lote");
    }

    const rows = await db.execute<{ animal_id: number; peso: string; fecha: string }>(
      sql`SELECT p.animal_id, p.peso_kg::float AS peso, p.fecha::text AS fecha
          FROM pesajes p
          JOIN lote_animales la ON la.animal_id = p.animal_id AND la.lote_id = ${params.loteId}
          WHERE p.fecha BETWEEN ${desde}::date AND ${hasta}::date
            AND (la.fecha_salida IS NULL OR la.fecha_salida >= p.fecha)
          ORDER BY p.animal_id, p.fecha ASC`
    );
    return agregarGdp(rows.rows, `lote_id=${params.loteId}`);
  }

  if (params.predioId) {
    if (!predioOk(params.predioId, prediosPermitidos)) {
      return emptyGdp("sin acceso al predio");
    }
    const rows = await db.execute<{ animal_id: number; peso: string; fecha: string }>(
      sql`SELECT animal_id, peso_kg::float AS peso, fecha::text AS fecha
          FROM pesajes
          WHERE predio_id = ${params.predioId}
            AND fecha BETWEEN ${desde}::date AND ${hasta}::date
          ORDER BY animal_id, fecha ASC`
    );
    return agregarGdp(rows.rows, `predio_id=${params.predioId}`);
  }

  return emptyGdp("especificar loteId, animalId o predioId");
}

function emptyGdp(error: string): CalcularGdpResult {
  return {
    gdp: null,
    dias: 0,
    pesoInicial: null,
    pesoFinal: null,
    nAnimales: 0,
    tendencia: "n/a",
    scope: "",
    error,
  };
}

function gdpIndividual(ordenados: FilaPesaje[]): {
  gdp: number | null;
  dias: number;
  pesoInicial: number | null;
  pesoFinal: number | null;
} {
  if (ordenados.length < 2) {
    return { gdp: null, dias: 0, pesoInicial: ordenados[0]?.peso ?? null, pesoFinal: null };
  }
  const first = ordenados[0];
  const last = ordenados[ordenados.length - 1];
  const dias = Math.round(
    (new Date(last.fecha).getTime() - new Date(first.fecha).getTime()) / 86400000
  );
  if (dias <= 0) return { gdp: null, dias: 0, pesoInicial: first.peso, pesoFinal: last.peso };
  return {
    gdp: Number(((last.peso - first.peso) / dias).toFixed(3)),
    dias,
    pesoInicial: first.peso,
    pesoFinal: last.peso,
  };
}

function agregarGdp(
  rows: { animal_id: number; peso: string | number; fecha: string }[],
  scope: string
): CalcularGdpResult {
  const porAnimal = new Map<number, FilaPesaje[]>();
  for (const r of rows) {
    const k = Number(r.animal_id);
    if (!porAnimal.has(k)) porAnimal.set(k, []);
    porAnimal.get(k)!.push({ peso: Number(r.peso), fecha: String(r.fecha) });
  }

  const gdps: number[] = [];
  const pesosInic: number[] = [];
  const pesosFin: number[] = [];
  const dias: number[] = [];

  for (const arr of porAnimal.values()) {
    const g = gdpIndividual(arr);
    if (g.gdp !== null) {
      gdps.push(g.gdp);
      if (g.pesoInicial !== null) pesosInic.push(g.pesoInicial);
      if (g.pesoFinal !== null) pesosFin.push(g.pesoFinal);
      dias.push(g.dias);
    }
  }

  if (gdps.length === 0) return { ...emptyGdp("sin suficientes pesajes para calcular GDP"), scope };

  const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
  const gdpProm = Number(avg(gdps).toFixed(3));

  return {
    gdp: gdpProm,
    dias: Math.round(avg(dias)),
    pesoInicial: Number(avg(pesosInic).toFixed(1)),
    pesoFinal: Number(avg(pesosFin).toFixed(1)),
    nAnimales: gdps.length,
    tendencia: tendenciaDeGdp(gdpProm),
    scope,
  };
}

function tendenciaDeGdp(gdp: number | null): "up" | "down" | "flat" | "n/a" {
  if (gdp === null) return "n/a";
  if (gdp >= 0.8) return "up";
  if (gdp <= 0.3) return "down";
  return "flat";
}

// ─────────────────────────────────────────────
// 2. proyectar_peso_venta
// ─────────────────────────────────────────────

export interface ProyectarPesoParams {
  loteId: number;
  pesoObjetivo: number;
}

export interface ProyectarPesoResult {
  diasEstimados: number | null;
  fechaEstimada: string | null;
  gdpActual: number | null;
  pesoActual: number | null;
  pesoObjetivo: number;
  probabilidadOk: number;
  nAnimales: number;
  error?: string;
}

/**
 * Regresión lineal simple sobre últimos 3 pesajes promedio del lote →
 * fecha estimada para alcanzar pesoObjetivo.
 */
export async function proyectarPesoVenta(
  params: ProyectarPesoParams,
  prediosPermitidos: number[]
): Promise<ProyectarPesoResult> {
  // Validar predio del lote
  const loteRow = await db.execute<{ predio_id: number }>(
    sql`SELECT predio_id FROM lotes WHERE id = ${params.loteId} LIMIT 1`
  );
  const predioId = Number(loteRow.rows[0]?.predio_id);
  if (!predioId || !predioOk(predioId, prediosPermitidos)) {
    return {
      diasEstimados: null,
      fechaEstimada: null,
      gdpActual: null,
      pesoActual: null,
      pesoObjetivo: params.pesoObjetivo,
      probabilidadOk: 0,
      nAnimales: 0,
      error: "sin acceso al lote",
    };
  }

  // Últimos 3 pesajes promedio del lote (agrupados por fecha)
  const rows = await db.execute<{ fecha: string; peso_avg: string; n: number }>(
    sql`SELECT p.fecha::text AS fecha, AVG(p.peso_kg)::float AS peso_avg, COUNT(*)::int AS n
        FROM pesajes p
        JOIN lote_animales la ON la.animal_id = p.animal_id AND la.lote_id = ${params.loteId}
        WHERE (la.fecha_salida IS NULL OR la.fecha_salida >= p.fecha)
        GROUP BY p.fecha
        ORDER BY p.fecha DESC
        LIMIT 3`
  );
  const series = rows.rows
    .map((r) => ({ fecha: String(r.fecha), peso: Number(r.peso_avg), n: Number(r.n) }))
    .reverse(); // asc por fecha

  if (series.length < 2) {
    return {
      diasEstimados: null,
      fechaEstimada: null,
      gdpActual: null,
      pesoActual: series[0]?.peso ?? null,
      pesoObjetivo: params.pesoObjetivo,
      probabilidadOk: 0,
      nAnimales: series[0]?.n ?? 0,
      error: "insuficientes pesajes (necesita >=2 fechas)",
    };
  }

  // Regresión lineal: peso = slope * t + intercept (t = días desde primera fecha)
  const t0 = new Date(series[0].fecha).getTime();
  const xs = series.map((s) => (new Date(s.fecha).getTime() - t0) / 86400000);
  const ys = series.map((s) => s.peso);
  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, _, i) => a + xs[i] * ys[i], 0);
  const sumXX = xs.reduce((a, b) => a + b * b, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) {
    return {
      diasEstimados: null,
      fechaEstimada: null,
      gdpActual: 0,
      pesoActual: series[series.length - 1].peso,
      pesoObjetivo: params.pesoObjetivo,
      probabilidadOk: 0,
      nAnimales: series[series.length - 1].n,
      error: "serie sin variación temporal",
    };
  }
  const slope = (n * sumXY - sumX * sumY) / denom; // kg/día
  const intercept = (sumY - slope * sumX) / n;

  const pesoActual = series[series.length - 1].peso;
  const ahora = xs[xs.length - 1];

  if (slope <= 0) {
    return {
      diasEstimados: null,
      fechaEstimada: null,
      gdpActual: Number(slope.toFixed(3)),
      pesoActual: Number(pesoActual.toFixed(1)),
      pesoObjetivo: params.pesoObjetivo,
      probabilidadOk: 0,
      nAnimales: series[series.length - 1].n,
      error: "lote no está ganando peso; proyección no alcanzable",
    };
  }

  // tObjetivo: (pesoObjetivo - intercept) / slope
  const tObjetivo = (params.pesoObjetivo - intercept) / slope;
  const diasEstimados = Math.max(0, Math.round(tObjetivo - ahora));
  const fechaEstimada = new Date(Date.now() + diasEstimados * 86400000).toISOString().slice(0, 10);

  // Probabilidad heurística: gdp alto y consistente → mayor prob
  let probabilidadOk = 0.5;
  if (slope >= 1.0) probabilidadOk = 0.85;
  else if (slope >= 0.7) probabilidadOk = 0.7;
  else if (slope >= 0.4) probabilidadOk = 0.55;
  else probabilidadOk = 0.35;

  return {
    diasEstimados,
    fechaEstimada,
    gdpActual: Number(slope.toFixed(3)),
    pesoActual: Number(pesoActual.toFixed(1)),
    pesoObjetivo: params.pesoObjetivo,
    probabilidadOk,
    nAnimales: series[series.length - 1].n,
  };
}

// ─────────────────────────────────────────────
// 3. comparar_predios
// ─────────────────────────────────────────────

export type ComparacionMetrica = "cantidad" | "peso_prom" | "gdp" | "preñez";

export interface CompararPrediosParams {
  predioIds: number[];
  metrica: ComparacionMetrica;
}

export interface CompararPrediosResult {
  metrica: ComparacionMetrica;
  filas: Array<{ predioId: number; nombre: string; valor: number | null }>;
  error?: string;
}

export async function compararPredios(
  params: CompararPrediosParams,
  prediosPermitidos: number[]
): Promise<CompararPrediosResult> {
  const permitidos =
    prediosPermitidos.length === 0
      ? params.predioIds
      : params.predioIds.filter((id) => prediosPermitidos.includes(id));

  if (permitidos.length === 0) {
    return { metrica: params.metrica, filas: [], error: "sin acceso a los predios" };
  }

  const filas: Array<{ predioId: number; nombre: string; valor: number | null }> = [];

  for (const predioId of permitidos) {
    const predioRow = await db.execute<{ nombre: string }>(
      sql`SELECT nombre FROM predios WHERE id = ${predioId} LIMIT 1`
    );
    const nombre = String(predioRow.rows[0]?.nombre ?? `Predio ${predioId}`);
    let valor: number | null = null;

    if (params.metrica === "cantidad") {
      const r = await db.execute<{ n: number }>(
        sql`SELECT COUNT(*)::int AS n FROM animales WHERE predio_id = ${predioId} AND estado = 'activo'`
      );
      valor = Number(r.rows[0]?.n ?? 0);
    } else if (params.metrica === "peso_prom") {
      const r = await db.execute<{ avg: string | null }>(
        sql`SELECT AVG(peso_kg)::float AS avg FROM pesajes
            WHERE predio_id = ${predioId}
              AND fecha >= '2026-01-01'`
      );
      valor = r.rows[0]?.avg !== null && r.rows[0]?.avg !== undefined
        ? Number(Number(r.rows[0].avg).toFixed(1))
        : null;
    } else if (params.metrica === "gdp") {
      const g = await calcularGdp({ predioId }, prediosPermitidos);
      valor = g.gdp;
    } else if (params.metrica === "preñez") {
      const r = await db.execute<{ total: number; prenadas: number }>(
        sql`SELECT
              (SELECT COUNT(*)::int FROM ecografias
                WHERE predio_id = ${predioId} AND fecha >= '2026-01-01') AS total,
              (SELECT COUNT(*)::int FROM ecografias
                WHERE predio_id = ${predioId} AND fecha >= '2026-01-01' AND resultado = 'preñada') AS prenadas`
      );
      const total = Number(r.rows[0]?.total ?? 0);
      const prenadas = Number(r.rows[0]?.prenadas ?? 0);
      valor = total > 0 ? Number(((prenadas / total) * 100).toFixed(1)) : null;
    }

    filas.push({ predioId, nombre, valor });
  }

  filas.sort((a, b) => (b.valor ?? -Infinity) - (a.valor ?? -Infinity));
  return { metrica: params.metrica, filas };
}

// ─────────────────────────────────────────────
// 4. ranking_lotes
// ─────────────────────────────────────────────

export type RankingMetrica = "peso_prom" | "gdp" | "nAnimales";

export interface RankingLotesParams {
  predioId: number;
  metrica: RankingMetrica;
  topN?: number;
}

export interface RankingLotesResult {
  metrica: RankingMetrica;
  filas: Array<{ loteId: number; nombre: string; valor: number | null; rank: number }>;
  error?: string;
}

export async function rankingLotes(
  params: RankingLotesParams,
  prediosPermitidos: number[]
): Promise<RankingLotesResult> {
  if (!predioOk(params.predioId, prediosPermitidos)) {
    return { metrica: params.metrica, filas: [], error: "sin acceso al predio" };
  }
  const topN = Math.max(1, Math.min(params.topN ?? 10, 50));

  if (params.metrica === "nAnimales") {
    const rows = await db.execute<{ lote_id: number; nombre: string; n: number }>(
      sql`SELECT l.id AS lote_id, l.nombre, COUNT(la.id)::int AS n
          FROM lotes l
          LEFT JOIN lote_animales la ON la.lote_id = l.id AND la.fecha_salida IS NULL
          WHERE l.predio_id = ${params.predioId} AND l.estado = 'activo'
          GROUP BY l.id, l.nombre
          ORDER BY n DESC
          LIMIT ${topN}`
    );
    return {
      metrica: params.metrica,
      filas: rows.rows.map((r, i) => ({
        loteId: Number(r.lote_id),
        nombre: String(r.nombre),
        valor: Number(r.n),
        rank: i + 1,
      })),
    };
  }

  if (params.metrica === "peso_prom") {
    const rows = await db.execute<{ lote_id: number; nombre: string; avg: string | null }>(
      sql`SELECT l.id AS lote_id, l.nombre,
                 (SELECT AVG(p.peso_kg)::float
                    FROM pesajes p
                    JOIN lote_animales la ON la.animal_id = p.animal_id AND la.lote_id = l.id
                    WHERE p.fecha >= '2026-01-01'
                      AND (la.fecha_salida IS NULL OR la.fecha_salida >= p.fecha)) AS avg
          FROM lotes l
          WHERE l.predio_id = ${params.predioId} AND l.estado = 'activo'`
    );
    const filas = rows.rows
      .map((r) => ({
        loteId: Number(r.lote_id),
        nombre: String(r.nombre),
        valor: r.avg !== null && r.avg !== undefined ? Number(Number(r.avg).toFixed(1)) : null,
      }))
      .sort((a, b) => (b.valor ?? -Infinity) - (a.valor ?? -Infinity))
      .slice(0, topN)
      .map((f, i) => ({ ...f, rank: i + 1 }));
    return { metrica: params.metrica, filas };
  }

  // gdp
  const lotes = await db.execute<{ id: number; nombre: string }>(
    sql`SELECT id, nombre FROM lotes
        WHERE predio_id = ${params.predioId} AND estado = 'activo'`
  );

  const filasRaw: Array<{ loteId: number; nombre: string; valor: number | null }> = [];
  for (const l of lotes.rows) {
    const g = await calcularGdp({ loteId: Number(l.id) }, prediosPermitidos);
    filasRaw.push({ loteId: Number(l.id), nombre: String(l.nombre), valor: g.gdp });
  }
  const filas = filasRaw
    .sort((a, b) => (b.valor ?? -Infinity) - (a.valor ?? -Infinity))
    .slice(0, topN)
    .map((f, i) => ({ ...f, rank: i + 1 }));
  return { metrica: params.metrica, filas };
}

// ─────────────────────────────────────────────
// 5. detectar_anomalias
// ─────────────────────────────────────────────

export interface DetectarAnomaliasParams {
  animalId?: number;
  loteId?: number;
}

export interface AnomaliaItem {
  animalId: number;
  diio: string;
  tipo: "peso_alto" | "peso_bajo";
  valor: number;
  avg: number;
  stddev: number;
  severidad: "leve" | "moderada" | "alta";
}

export interface DetectarAnomaliasResult {
  items: AnomaliaItem[];
  contexto: { avg: number | null; stddev: number | null; n: number };
  error?: string;
}

/**
 * Regla: |peso - avg(lote)| > 2 * stddev(lote) → anomalía.
 * severidad: leve ≤2.5σ, moderada ≤3σ, alta >3σ.
 */
export async function detectarAnomalias(
  params: DetectarAnomaliasParams,
  prediosPermitidos: number[]
): Promise<DetectarAnomaliasResult> {
  let loteId = params.loteId;

  if (!loteId && params.animalId) {
    // Buscar el lote activo del animal
    const r = await db.execute<{ lote_id: number }>(
      sql`SELECT lote_id FROM lote_animales
          WHERE animal_id = ${params.animalId} AND fecha_salida IS NULL
          ORDER BY fecha_entrada DESC LIMIT 1`
    );
    loteId = r.rows[0]?.lote_id !== undefined ? Number(r.rows[0].lote_id) : undefined;
  }

  if (!loteId) {
    return {
      items: [],
      contexto: { avg: null, stddev: null, n: 0 },
      error: "especificar loteId o animalId con lote activo",
    };
  }

  // Validar acceso
  const loteRow = await db.execute<{ predio_id: number }>(
    sql`SELECT predio_id FROM lotes WHERE id = ${loteId} LIMIT 1`
  );
  const predioId = Number(loteRow.rows[0]?.predio_id);
  if (!predioId || !predioOk(predioId, prediosPermitidos)) {
    return {
      items: [],
      contexto: { avg: null, stddev: null, n: 0 },
      error: "sin acceso al lote",
    };
  }

  // Último pesaje por animal del lote
  const rows = await db.execute<{ animal_id: number; diio: string; peso: string; fecha: string }>(
    sql`SELECT DISTINCT ON (p.animal_id)
           p.animal_id, a.diio, p.peso_kg::float AS peso, p.fecha::text AS fecha
        FROM pesajes p
        JOIN animales a ON a.id = p.animal_id
        JOIN lote_animales la ON la.animal_id = p.animal_id AND la.lote_id = ${loteId}
        WHERE (la.fecha_salida IS NULL OR la.fecha_salida >= p.fecha)
        ORDER BY p.animal_id, p.fecha DESC`
  );
  const pesos = rows.rows.map((r) => Number(r.peso));
  const n = pesos.length;
  if (n < 3) {
    return {
      items: [],
      contexto: { avg: null, stddev: null, n },
      error: "insuficientes animales pesados para detectar anomalías",
    };
  }
  const avg = pesos.reduce((a, b) => a + b, 0) / n;
  const varianza = pesos.reduce((a, b) => a + (b - avg) ** 2, 0) / n;
  const stddev = Math.sqrt(varianza);

  if (stddev === 0) {
    return { items: [], contexto: { avg, stddev, n } };
  }

  const items: AnomaliaItem[] = [];
  for (const r of rows.rows) {
    if (params.animalId && Number(r.animal_id) !== params.animalId) continue;
    const peso = Number(r.peso);
    const z = Math.abs(peso - avg) / stddev;
    if (z > 2) {
      items.push({
        animalId: Number(r.animal_id),
        diio: String(r.diio),
        tipo: peso > avg ? "peso_alto" : "peso_bajo",
        valor: Number(peso.toFixed(1)),
        avg: Number(avg.toFixed(1)),
        stddev: Number(stddev.toFixed(2)),
        severidad: z > 3 ? "alta" : z > 2.5 ? "moderada" : "leve",
      });
    }
  }

  // Ordenar por severidad descendente
  items.sort((a, b) => {
    const rank = { alta: 3, moderada: 2, leve: 1 };
    return rank[b.severidad] - rank[a.severidad];
  });

  return {
    items,
    contexto: {
      avg: Number(avg.toFixed(1)),
      stddev: Number(stddev.toFixed(2)),
      n,
    },
  };
}
