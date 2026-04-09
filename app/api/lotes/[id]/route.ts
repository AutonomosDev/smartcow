/**
 * app/api/lotes/[id]/route.ts
 * GET /api/lotes/:id
 *
 * Retorna detalle de un lote con métricas:
 *   { id, nombre, fechaEntrada, totalAnimales, avgPesoActualKg, avgPesoEntradaKg, diasEnLote, gdpKgDia, ... }
 *
 * Auth: Bearer JWT (mobile). Usa el primer predio del usuario para validar pertenencia del lote.
 * Retorna 404 si el lote no pertenece a ningún predio del usuario.
 */

import { NextRequest } from "next/server";
import { withAuthBearer, AuthError } from "@/src/lib/with-auth";
import { getLoteDetalle } from "@/src/lib/queries/predio";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const loteId = Number(id);

  if (!Number.isInteger(loteId) || loteId <= 0) {
    return Response.json({ error: "ID de lote inválido" }, { status: 400 });
  }

  let session;
  try {
    session = await withAuthBearer(req);
  } catch (err) {
    if (err instanceof AuthError) {
      return Response.json(
        { error: err.message },
        { status: err.code === "UNAUTHENTICATED" ? 401 : 403 }
      );
    }
    return Response.json({ error: "Error de autenticación" }, { status: 401 });
  }

  // Intentar con cada predio del usuario hasta encontrar el lote
  const predios = session.user.predios;
  for (const predioId of predios) {
    const detalle = await getLoteDetalle(loteId, predioId);
    if (detalle) {
      return Response.json(detalle);
    }
  }

  return Response.json({ error: "Lote no encontrado" }, { status: 404 });
}
