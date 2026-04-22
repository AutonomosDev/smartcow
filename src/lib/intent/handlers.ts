/**
 * handlers.ts — Handlers determinísticos SQL para intents interceptables (AUT-287).
 *
 * Refactor AUT-288: handlers operan sobre predioIds[] (todos los predios del
 * usuario) en vez de un único predio. Elimina el lock a un predio.
 *
 * Cada handler retorna { label, data, artifact } — cost=0, latencia <200ms.
 */

import { db } from "@/src/db/client";
import { sql } from "drizzle-orm";

export type QuickHandler = (predioIds: number[]) => Promise<{
  label: string;
  data: unknown;
  artifact: unknown;
}>;

export const QUICK_HANDLERS: Record<string, QuickHandler> = {
  animales: async (predioIds) => {
    const r = await db.execute<{ total: number; machos: number; hembras: number }>(
      sql`SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE sexo = 'M')::int AS machos,
            COUNT(*) FILTER (WHERE sexo = 'H')::int AS hembras
          FROM animales
          WHERE predio_id = ANY(${predioIds}::int[]) AND estado = 'activo'`
    );
    const row = r.rows[0] ?? { total: 0, machos: 0, hembras: 0 };
    return {
      label: "Animales totales",
      data: row,
      artifact: {
        type: "kpi",
        title: "Animales activos",
        kpis: [
          { val: String(row.total), lbl: "Total", color: "ok" },
          { val: String(row.machos), lbl: "Machos" },
          { val: String(row.hembras), lbl: "Hembras" },
        ],
      },
    };
  },

  enfermos: async (predioIds) => {
    const r = await db.execute<{
      animal_id: number;
      diio: string;
      fecha: string;
      diagnostico: string | null;
    }>(
      sql`SELECT t.animal_id, a.diio, t.fecha::text AS fecha, t.diagnostico
          FROM tratamientos t
          JOIN animales a ON a.id = t.animal_id
          WHERE t.predio_id = ANY(${predioIds}::int[])
            AND t.fecha >= (CURRENT_DATE - INTERVAL '30 days')
          ORDER BY t.fecha DESC
          LIMIT 50`
    );
    return {
      label: "En tratamiento (últimos 30 días)",
      data: r.rows,
      artifact: {
        type: "table",
        title: `Animales en tratamiento — ${r.rows.length}`,
        rows: r.rows.slice(0, 20).map((row) => ({
          label: `DIIO ${row.diio}`,
          value: `${row.fecha} · ${row.diagnostico ?? "sin diagnóstico"}`,
        })),
      },
    };
  },

  feedlot: async (predioIds) => {
    const r = await db.execute<{ total: number; lotes: number }>(
      sql`SELECT
            (SELECT COUNT(*)::int FROM animales
              WHERE predio_id = ANY(${predioIds}::int[])
                AND estado = 'activo'
                AND modulo_actual IN ('feedlot', 'ambos')) AS total,
            (SELECT COUNT(*)::int FROM lotes
              WHERE predio_id = ANY(${predioIds}::int[]) AND estado = 'activo') AS lotes`
    );
    const row = r.rows[0] ?? { total: 0, lotes: 0 };
    return {
      label: "Ocupación feedlot",
      data: row,
      artifact: {
        type: "kpi",
        title: "Feedlot",
        kpis: [
          { val: String(row.total), lbl: "Animales", color: "ok" },
          { val: String(row.lotes), lbl: "Lotes activos" },
        ],
      },
    };
  },

  lotes: async (predioIds) => {
    const r = await db.execute<{
      id: number;
      nombre: string;
      fecha_entrada: string;
      n_animales: number;
    }>(
      sql`SELECT l.id, l.nombre, l.fecha_entrada::text AS fecha_entrada,
                 COUNT(la.id)::int AS n_animales
          FROM lotes l
          LEFT JOIN lote_animales la ON la.lote_id = l.id AND la.fecha_salida IS NULL
          WHERE l.predio_id = ANY(${predioIds}::int[]) AND l.estado = 'activo'
          GROUP BY l.id, l.nombre, l.fecha_entrada
          ORDER BY l.fecha_entrada DESC`
    );
    return {
      label: "Lotes activos",
      data: r.rows,
      artifact: {
        type: "table",
        title: `Lotes activos — ${r.rows.length}`,
        rows: r.rows.map((row) => ({
          label: row.nombre,
          value: `${row.n_animales} animales · desde ${row.fecha_entrada}`,
        })),
      },
    };
  },

  pesajes: async (predioIds) => {
    const r = await db.execute<{
      fecha: string;
      diio: string;
      peso_kg: string;
    }>(
      sql`SELECT p.fecha::text AS fecha, a.diio, p.peso_kg::text
          FROM pesajes p
          JOIN animales a ON a.id = p.animal_id
          WHERE p.predio_id = ANY(${predioIds}::int[])
          ORDER BY p.fecha DESC, p.id DESC
          LIMIT 20`
    );
    return {
      label: "Últimos 20 pesajes",
      data: r.rows,
      artifact: {
        type: "table",
        title: "Últimos pesajes",
        rows: r.rows.map((row) => ({
          label: `${row.fecha} · DIIO ${row.diio}`,
          value: `${Number(row.peso_kg).toFixed(1)} kg`,
        })),
      },
    };
  },

  partos: async (predioIds) => {
    const r = await db.execute<{
      total: number;
      vivos: number;
      muertos: number;
      abortos: number;
    }>(
      sql`SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE resultado = 'vivo')::int AS vivos,
            COUNT(*) FILTER (WHERE resultado = 'muerto')::int AS muertos,
            COUNT(*) FILTER (WHERE resultado = 'aborto')::int AS abortos
          FROM partos
          WHERE predio_id = ANY(${predioIds}::int[])
            AND fecha >= date_trunc('month', CURRENT_DATE)`
    );
    const row = r.rows[0] ?? { total: 0, vivos: 0, muertos: 0, abortos: 0 };
    return {
      label: "Partos del mes",
      data: row,
      artifact: {
        type: "kpi",
        title: "Partos — mes actual",
        kpis: [
          { val: String(row.total), lbl: "Total", color: "ok" },
          { val: String(row.vivos), lbl: "Vivos", color: "ok" },
          { val: String(row.muertos), lbl: "Muertos" },
          { val: String(row.abortos), lbl: "Abortos" },
        ],
      },
    };
  },

  bajas: async (predioIds) => {
    const r = await db.execute<{ total: number }>(
      sql`SELECT COUNT(*)::int AS total FROM bajas
          WHERE predio_id = ANY(${predioIds}::int[])
            AND fecha >= date_trunc('month', CURRENT_DATE)`
    );
    const total = Number(r.rows[0]?.total ?? 0);
    const byMotivo = await db.execute<{ motivo: string; n: number }>(
      sql`SELECT COALESCE(bm.nombre, 'sin motivo') AS motivo, COUNT(*)::int AS n
          FROM bajas b
          LEFT JOIN baja_motivo bm ON bm.id = b.motivo_id
          WHERE b.predio_id = ANY(${predioIds}::int[])
            AND b.fecha >= date_trunc('month', CURRENT_DATE)
          GROUP BY bm.nombre
          ORDER BY n DESC`
    );
    return {
      label: "Bajas del mes",
      data: { total, porMotivo: byMotivo.rows },
      artifact: {
        type: "table",
        title: `Bajas del mes — ${total}`,
        rows: byMotivo.rows.length > 0
          ? byMotivo.rows.map((r) => ({ label: r.motivo, value: `${r.n}` }))
          : [{ label: "Sin bajas", value: "0" }],
      },
    };
  },

  ventas: async (predioIds) => {
    const r = await db.execute<{
      total: number;
      peso_total: string | null;
      peso_prom: string | null;
    }>(
      sql`SELECT COUNT(*)::int AS total,
                 SUM(peso_kg)::float AS peso_total,
                 AVG(peso_kg)::float AS peso_prom
          FROM ventas
          WHERE predio_id = ANY(${predioIds}::int[])
            AND fecha >= date_trunc('month', CURRENT_DATE)`
    );
    const row = r.rows[0] ?? { total: 0, peso_total: null, peso_prom: null };
    return {
      label: "Ventas del mes",
      data: row,
      artifact: {
        type: "kpi",
        title: "Ventas — mes actual",
        kpis: [
          { val: String(row.total), lbl: "Animales", color: "ok" },
          {
            val: row.peso_total ? `${Number(row.peso_total).toFixed(0)} kg` : "—",
            lbl: "Peso total",
          },
          {
            val: row.peso_prom ? `${Number(row.peso_prom).toFixed(1)} kg` : "—",
            lbl: "Peso promedio",
          },
        ],
      },
    };
  },

  tratamientos: async (predioIds) => {
    const r = await db.execute<{
      diagnostico: string;
      n: number;
    }>(
      sql`SELECT COALESCE(diagnostico, 'sin diagnóstico') AS diagnostico,
                 COUNT(*)::int AS n
          FROM tratamientos
          WHERE predio_id = ANY(${predioIds}::int[])
            AND fecha >= (CURRENT_DATE - INTERVAL '30 days')
          GROUP BY diagnostico
          ORDER BY n DESC
          LIMIT 20`
    );
    return {
      label: "Tratamientos últimos 30 días",
      data: r.rows,
      artifact: {
        type: "table",
        title: "Diagnósticos más frecuentes (30d)",
        rows: r.rows.length > 0
          ? r.rows.map((row) => ({ label: row.diagnostico, value: `${row.n}` }))
          : [{ label: "Sin tratamientos", value: "0" }],
      },
    };
  },

  preñez: async (predioIds) => {
    const r = await db.execute<{
      total: number;
      prenadas: number;
      vacias: number;
      dudosas: number;
    }>(
      sql`SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE resultado = 'preñada')::int AS prenadas,
            COUNT(*) FILTER (WHERE resultado = 'vacia')::int AS vacias,
            COUNT(*) FILTER (WHERE resultado = 'dudosa')::int AS dudosas
          FROM ecografias
          WHERE predio_id = ANY(${predioIds}::int[])
            AND fecha >= '2026-01-01'`
    );
    const row = r.rows[0] ?? { total: 0, prenadas: 0, vacias: 0, dudosas: 0 };
    const pct = row.total > 0 ? ((row.prenadas / row.total) * 100).toFixed(1) : "0";
    return {
      label: "Vacas preñadas (2026)",
      data: { ...row, tasaPrenezPct: Number(pct) },
      artifact: {
        type: "kpi",
        title: "Ecografías — 2026",
        kpis: [
          { val: String(row.prenadas), lbl: "Preñadas", color: "ok" },
          { val: `${pct}%`, lbl: "Tasa preñez" },
          { val: String(row.vacias), lbl: "Vacías" },
          { val: String(row.dudosas), lbl: "Dudosas" },
        ],
      },
    };
  },
};
