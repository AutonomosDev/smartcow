/**
 * POST /api/chat/upload-data
 * Recibe datos CSV/XLSX ya parseados client-side y los guarda en chat_attachments.
 * Ticket: AUT-259
 *
 * Body: { filename, mimeType, columnas: string[], filas: object[], predio_id: number }
 * Response: { id, columnas, filasCount }
 */

import { NextRequest } from "next/server";
import { withAuth, withAuthBearer, AuthError } from "@/src/lib/with-auth";
import { db } from "@/src/db/client";
import { chatAttachments } from "@/src/db/schema/index";

const MAX_FILAS = 10_000;
const MAX_COLUMNAS = 50;

export async function POST(req: NextRequest) {
  // Auth — Bearer (mobile) o cookie (web)
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

  let body: {
    filename: string;
    mimeType: string;
    columnas: string[];
    filas: Record<string, unknown>[];
    predio_id: number;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }

  const { filename, mimeType, columnas, filas, predio_id: predioId } = body;

  if (!filename || !mimeType || !Array.isArray(columnas) || !Array.isArray(filas) || !predioId) {
    return Response.json({ error: "Campos requeridos: filename, mimeType, columnas, filas, predio_id" }, { status: 400 });
  }

  // Validar acceso al predio
  const { rol, predios, id: userId } = session.user;
  const tieneAccesoTotal = rol === "superadmin" || rol === "admin_org";
  if (!tieneAccesoTotal && !predios.includes(predioId)) {
    return Response.json({ error: "Sin acceso a este predio" }, { status: 403 });
  }

  // Validar límites
  if (filas.length > MAX_FILAS) {
    return Response.json({ error: `Máximo ${MAX_FILAS.toLocaleString()} filas permitidas` }, { status: 400 });
  }
  if (columnas.length > MAX_COLUMNAS) {
    return Response.json({ error: `Máximo ${MAX_COLUMNAS} columnas permitidas` }, { status: 400 });
  }

  try {
    const [inserted] = await db
      .insert(chatAttachments)
      .values({
        userId: Number(userId),
        predioId,
        filename,
        mimeType,
        columnas,
        contenidoJson: filas,
        filasCount: filas.length,
      })
      .returning({ id: chatAttachments.id });

    return Response.json({ id: inserted.id, columnas, filasCount: filas.length });
  } catch (err) {
    console.error("[upload-data] error:", err instanceof Error ? err.message : err);
    return Response.json({ error: "Error al guardar el archivo" }, { status: 500 });
  }
}
