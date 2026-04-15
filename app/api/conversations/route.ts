/**
 * app/api/conversations/route.ts — Endpoints para historial de conversaciones del chat IA.
 * Ticket: AUT-144
 *
 * GET  /api/conversations?predio_id=N   — Lista conversaciones del usuario (sidebar)
 * POST /api/conversations               — Crea nueva conversación
 *
 * Auth: withAuth() — session cookie __session (web)
 */

import { NextRequest } from "next/server";
import { withAuth, AuthError } from "@/src/lib/with-auth";
import {
  getConversacionesUsuario,
  crearConversacion,
} from "@/src/lib/queries/conversaciones";

export async function GET(req: NextRequest) {
  let session;
  try {
    session = await withAuth();
  } catch (err) {
    if (err instanceof AuthError) {
      return Response.json(
        { error: err.message },
        { status: err.code === "UNAUTHENTICATED" ? 401 : 403 }
      );
    }
    return Response.json({ error: "Error de autenticación" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const predioIdParam = searchParams.get("predio_id");
  if (!predioIdParam) {
    return Response.json({ error: "predio_id requerido" }, { status: 400 });
  }

  const predioId = parseInt(predioIdParam, 10);
  if (isNaN(predioId)) {
    return Response.json({ error: "predio_id inválido" }, { status: 400 });
  }

  // Validar que el usuario tenga acceso al predio
  if (!session.user.predios.includes(predioId)) {
    return Response.json({ error: "Sin acceso a este predio" }, { status: 403 });
  }

  const userId = parseInt(session.user.id, 10);
  const conversaciones = await getConversacionesUsuario(userId, predioId);

  return Response.json(conversaciones);
}

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await withAuth();
  } catch (err) {
    if (err instanceof AuthError) {
      return Response.json(
        { error: err.message },
        { status: err.code === "UNAUTHENTICATED" ? 401 : 403 }
      );
    }
    return Response.json({ error: "Error de autenticación" }, { status: 401 });
  }

  let body: { predio_id?: unknown; titulo?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }

  const predioId = typeof body.predio_id === "number" ? body.predio_id : NaN;
  const titulo =
    typeof body.titulo === "string" && body.titulo.trim().length > 0
      ? body.titulo.trim().slice(0, 300)
      : "Conversación";

  if (isNaN(predioId)) {
    return Response.json({ error: "predio_id requerido" }, { status: 400 });
  }

  // Validar acceso al predio
  if (!session.user.predios.includes(predioId)) {
    return Response.json({ error: "Sin acceso a este predio" }, { status: 403 });
  }

  const userId = parseInt(session.user.id, 10);
  const conversacion = await crearConversacion({ userId, predioId, titulo });

  return Response.json({ id: conversacion.id }, { status: 201 });
}
