/**
 * app/api/cron/import-precios-feria/route.ts
 * Endpoint cron para refrescar precios_feria (AUT-267).
 *
 * Protegido con header X-Cron-Secret (comparar contra CRON_SECRET env var).
 * Cron externo (Hostinger VPS crontab, domingos 09:00 UTC = 06:00 CLT):
 *   0 9 * * 0 curl -H "X-Cron-Secret: $SECRET" https://smartcow.cl/api/cron/import-precios-feria
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
