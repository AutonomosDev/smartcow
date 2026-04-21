/**
 * POST /api/chat/quick-query — Atajos SQL directos sin LLM.
 * Ticket: AUT-268
 *
 * 10 comandos pre-definidos que resuelven las preguntas más frecuentes
 * del catálogo chat-queries-catalog.yaml con SQL directo. No pagan LLM.
 *
 * Body: { command: string, predioId: number }
 * Response: { cached: false, quick: true, label, data, artifact }
 */

import { NextRequest } from "next/server";
import { withAuth, withAuthBearer, AuthError } from "@/src/lib/with-auth";
import { db } from "@/src/db/client";
import { sql } from "drizzle-orm";

// ─────────────────────────────────────────────
// Handlers por comando — cada uno retorna { data, artifact }
// ─────────────────────────────────────────────

type QuickHandler = (predioId: number) => Promise<{
  label: string;
  data: unknown;
  artifact: unknown;
}>;

const HANDLERS: Record<string, QuickHandler> = {
  animales: async (predioId) => {
    const r = await db.execute<{ total: number; machos: number; hembras: number }>(
      sql`SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE sexo = 'M')::int AS machos,
            COUNT(*) FILTER (WHERE sexo = 'H')::int AS hembras
          FROM animales
          WHERE predio_id = ${predioId} AND estado = 'activo'`
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

  enfermos: async (predioId) => {
    const r = await db.execute<{
      animal_id: number;
      diio: string;
      fecha: string;
      diagnostico: string | null;
    }>(
      sql`SELECT t.animal_id, a.diio, t.fecha::text AS fecha, t.diagnostico
          FROM tratamientos t
          JOIN animales a ON a.id = t.animal_id
          WHERE t.predio_id = ${predioId}
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

  feedlot: async (predioId) => {
    const r = await db.execute<{ total: number; lotes: number }>(
      sql`SELECT
            (SELECT COUNT(*)::int FROM animales
              WHERE predio_id = ${predioId}
                AND estado = 'activo'
                AND modulo_actual IN ('feedlot', 'ambos')) AS total,
            (SELECT COUNT(*)::int FROM lotes
              WHERE predio_id = ${predioId} AND estado = 'activo') AS lotes`
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

  lotes: async (predioId) => {
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
          WHERE l.predio_id = ${predioId} AND l.estado = 'activo'
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

  pesajes: async (predioId) => {
    const r = await db.execute<{
      fecha: string;
      diio: string;
      peso_kg: string;
    }>(
      sql`SELECT p.fecha::text AS fecha, a.diio, p.peso_kg::text
          FROM pesajes p
          JOIN animales a ON a.id = p.animal_id
          WHERE p.predio_id = ${predioId}
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

  partos: async (predioId) => {
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
          WHERE predio_id = ${predioId}
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
          { val: String(row.muertos), lbl: "Muertos", color: row.muertos > 0 ? "warn" : "ok" },
          { val: String(row.abortos), lbl: "Abortos", color: row.abortos > 0 ? "warn" : "ok" },
        ],
      },
    };
  },

  bajas: async (predioId) => {
    const r = await db.execute<{ total: number }>(
      sql`SELECT COUNT(*)::int AS total FROM bajas
          WHERE predio_id = ${predioId}
            AND fecha >= date_trunc('month', CURRENT_DATE)`
    );
    const total = Number(r.rows[0]?.total ?? 0);
    const byMotivo = await db.execute<{ motivo: string; n: number }>(
      sql`SELECT COALESCE(bm.nombre, 'sin motivo') AS motivo, COUNT(*)::int AS n
          FROM bajas b
          LEFT JOIN baja_motivo bm ON bm.id = b.motivo_id
          WHERE b.predio_id = ${predioId}
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

  ventas: async (predioId) => {
    const r = await db.execute<{
      total: number;
      peso_total: string | null;
      peso_prom: string | null;
    }>(
      sql`SELECT COUNT(*)::int AS total,
                 SUM(peso_kg)::float AS peso_total,
                 AVG(peso_kg)::float AS peso_prom
          FROM ventas
          WHERE predio_id = ${predioId}
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

  tratamientos: async (predioId) => {
    const r = await db.execute<{
      diagnostico: string;
      n: number;
    }>(
      sql`SELECT COALESCE(diagnostico, 'sin diagnóstico') AS diagnostico,
                 COUNT(*)::int AS n
          FROM tratamientos
          WHERE predio_id = ${predioId}
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

  preñez: async (predioId) => {
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
          WHERE predio_id = ${predioId}
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
          { val: String(row.vacias), lbl: "Vacías", color: "warn" },
          { val: String(row.dudosas), lbl: "Dudosas" },
        ],
      },
    };
  },
};

export async function POST(req: NextRequest) {
  // Auth
  let session;
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      session = await withAuthBearer(req);
    } else {
      session = await withAuth();
    }
  } catch (err) {
    if (err instanceof AuthError) {
      return Response.json(
        { error: err.message, code: err.code },
        { status: err.code === "UNAUTHENTICATED" ? 401 : 403 }
      );
    }
    return Response.json({ error: "Error de autenticación" }, { status: 401 });
  }

  let body: { command?: string; predioId?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }

  const command = String(body.command ?? "").trim().replace(/^\//, "");
  const predioId = Number(body.predioId);

  if (!command || !predioId) {
    return Response.json({ error: "command y predioId requeridos" }, { status: 400 });
  }

  // Validar acceso al predio
  const { rol, predios } = session.user;
  const tieneAccesoTotal = rol === "superadmin" || rol === "admin_org";
  if (!tieneAccesoTotal && !predios.includes(predioId)) {
    return Response.json({ error: "Sin acceso a este predio" }, { status: 403 });
  }

  const handler = HANDLERS[command];
  if (!handler) {
    return Response.json(
      {
        error: `Comando desconocido: ${command}`,
        comandosDisponibles: Object.keys(HANDLERS),
      },
      { status: 400 }
    );
  }

  try {
    const startMs = Date.now();
    const result = await handler(predioId);
    const latencyMs = Date.now() - startMs;

    return Response.json({
      cached: false,
      quick: true,
      command,
      label: result.label,
      data: result.data,
      artifact: result.artifact,
      latencyMs,
    });
  } catch (err) {
    console.error(`[quick-query] error command=${command}:`, err instanceof Error ? err.message : err);
    return Response.json({ error: "Error ejecutando comando" }, { status: 500 });
  }
}
