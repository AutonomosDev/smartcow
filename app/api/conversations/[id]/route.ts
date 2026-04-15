/**
 * app/api/conversations/[id]/route.ts — Endpoint para actualizar mensajes de una conversación.
 * Ticket: AUT-144
 *
 * PATCH /api/conversations/:id   — Actualiza mensajes (llamado al evento SSE "done")
 *
 * Auth: withAuth() — session cookie __session (web)
 */

import { NextRequest } from "next/server";
import { withAuth, AuthError } from "@/src/lib/with-auth";
import { actualizarMensajes } from "@/src/lib/queries/conversaciones";
import type { MensajeChat } from "@/src/db/schema/conversaciones";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (isNaN(id)) {
    return Response.json({ error: "ID inválido" }, { status: 400 });
  }

  let body: { mensajes?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!Array.isArray(body.mensajes)) {
    return Response.json({ error: "mensajes debe ser un array" }, { status: 400 });
  }

  const mensajes = body.mensajes as MensajeChat[];
  const userId = parseInt(session.user.id, 10);

  // actualizarMensajes valida ownership (WHERE id AND user_id)
  await actualizarMensajes(id, userId, mensajes);

  return Response.json({ ok: true });
}
