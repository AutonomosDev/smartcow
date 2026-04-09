/**
 * app/api/predio/[id]/kpis/route.ts
 * GET /api/predio/:id/kpis
 *
 * Retorna KPIs del predio para el dashboard/home mobile:
 *   { lotesActivos, totalAnimales, ultimoPesaje }
 *
 * Auth: Bearer JWT (mobile). Valida acceso al predio.
 */

import { NextRequest } from "next/server";
import { withAuthBearer } from "@/src/lib/with-auth";
import { AuthError } from "@/src/lib/with-auth";
import { getPredioKpis } from "@/src/lib/queries/predio";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const predioId = Number(id);

  if (!Number.isInteger(predioId) || predioId <= 0) {
    return Response.json({ error: "ID de predio inválido" }, { status: 400 });
  }

  let session;
  try {
    session = await withAuthBearer(req, { predioId });
  } catch (err) {
    if (err instanceof AuthError) {
      return Response.json(
        { error: err.message },
        { status: err.code === "UNAUTHENTICATED" ? 401 : 403 }
      );
    }
    return Response.json({ error: "Error de autenticación" }, { status: 401 });
  }

  void session;

  const kpis = await getPredioKpis(predioId);
  return Response.json(kpis);
}
