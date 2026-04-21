/**
 * app/api/cron/import-precios-feria/route.ts
 * Endpoint cron para refrescar precios_feria (AUT-271 / AUT-267).
 *
 * Fuente: ODEPA Boletín semanal AFECH (XLSX). Se publica lunes/martes.
 * Frecuencia recomendada: miércoles 09:00 UTC (06:00 CLT) — garantiza
 * que el boletín ya esté publicado antes de importarlo.
 *
 * Protegido con header X-Cron-Secret (comparar contra CRON_SECRET env var).
 * Cron externo (Hostinger VPS crontab):
 *   0 9 * * 3 curl -X POST -H "X-Cron-Secret: $SECRET" https://smartcow.cl/api/cron/import-precios-feria
 *
 * Incremental por defecto: trae boletines con fecha >= (MAX(fecha) - 14d).
 */

import { NextResponse } from "next/server";
import { importOdepa, importTattersall } from "@/src/etl/import-precios-feria";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado en el servidor" },
      { status: 500 }
    );
  }

  const received = req.headers.get("x-cron-secret");
  if (received !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const odepa = await importOdepa();
    const tattersall = await importTattersall();
    const total = odepa + tattersall;
    console.log(`[cron:precios-feria] importadas odepa=${odepa} tattersall=${tattersall}`);

    return NextResponse.json({
      ok: true,
      odepa,
      tattersall,
      total,
      at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron:precios-feria] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET opcional para healthcheck manual (también protegido)
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 500 });
  }
  const received = req.headers.get("x-cron-secret");
  if (received !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, endpoint: "import-precios-feria", method: "POST to trigger" });
}
