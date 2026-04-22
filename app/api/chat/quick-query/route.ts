/**
 * POST /api/chat/quick-query — Atajos SQL directos sin LLM.
 * Ticket: AUT-268, AUT-287
 *
 * 10 comandos pre-definidos que resuelven las preguntas más frecuentes
 * del catálogo chat-queries-catalog.yaml con SQL directo. No pagan LLM.
 *
 * Handlers extraídos a src/lib/intent/handlers.ts — compartidos con
 * tryIntercept() del chat para evitar duplicación (AUT-287).
 *
 * Body: { command: string, predioId: number }
 * Response: { cached: false, quick: true, label, data, artifact }
 */

import { NextRequest } from "next/server";
import { withAuth, withAuthBearer, AuthError } from "@/src/lib/with-auth";
import { checkRateLimit, rateLimitHeaders } from "@/src/lib/rate-limit";
import { QUICK_HANDLERS as HANDLERS } from "@/src/lib/intent/handlers";
import { getPredioIdsDeOrg } from "@/src/lib/queries/predio";

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

  let body: { command?: string; predioId?: number; predioIds?: number[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }

  const command = String(body.command ?? "").trim().replace(/^\//, "");

  if (!command) {
    return Response.json({ error: "command requerido" }, { status: 400 });
  }

  // Scope de predios (AUT-288): usa predioIds[] del body si vino, o scope completo del usuario.
  const { rol, predios, id: userId, orgId } = session.user;
  const tieneAccesoTotal = rol === "superadmin" || rol === "admin_org";
  const prediosDelScope = tieneAccesoTotal ? await getPredioIdsDeOrg(orgId) : predios;

  let predioIds: number[];
  if (Array.isArray(body.predioIds) && body.predioIds.length > 0) {
    predioIds = body.predioIds.map(Number).filter((id) => prediosDelScope.includes(id));
    if (predioIds.length === 0) {
      return Response.json({ error: "Sin acceso a los predios solicitados" }, { status: 403 });
    }
  } else if (body.predioId) {
    const pid = Number(body.predioId);
    if (!prediosDelScope.includes(pid)) {
      return Response.json({ error: "Sin acceso a este predio" }, { status: 403 });
    }
    predioIds = [pid];
  } else {
    predioIds = prediosDelScope;
  }

  if (predioIds.length === 0) {
    return Response.json({ error: "No hay predios disponibles" }, { status: 400 });
  }

  // Rate limit (AUT-274) — 60 req/min por usuario (SQL directo, más generoso que /api/chat).
  const rl = checkRateLimit(userId, 60, 60_000);
  if (!rl.allowed) {
    console.warn(`[rate-limit] 429 userId=${userId} path=/api/chat/quick-query resetIn=${rl.resetIn}ms`);
    return Response.json(
      { error: "Rate limit", resetIn: rl.resetIn, code: "RATE_LIMITED" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rl.resetIn / 1000)),
          ...rateLimitHeaders(rl),
        },
      }
    );
  }
  const rlHeaders = rateLimitHeaders(rl);

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
    const result = await handler(predioIds);
    const latencyMs = Date.now() - startMs;

    return Response.json(
      {
        cached: false,
        quick: true,
        command,
        label: result.label,
        data: result.data,
        artifact: result.artifact,
        latencyMs,
      },
      { headers: rlHeaders }
    );
  } catch (err) {
    console.error(`[quick-query] error command=${command}:`, err instanceof Error ? err.message : err);
    return Response.json({ error: "Error ejecutando comando" }, { status: 500 });
  }
}
