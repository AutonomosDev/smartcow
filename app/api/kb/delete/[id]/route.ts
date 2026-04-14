/**
 * app/api/kb/delete/[id]/route.ts — Elimina un documento KB.
 * Ticket: AUT-176
 *
 * DELETE /api/kb/delete/:id
 * Response: { ok: true }
 */

import { NextRequest } from "next/server";
import { withAuth } from "@/src/lib/with-auth";
import { getGoogleAIClient } from "@/src/lib/claude";
import { db } from "@/src/db/client";
import { kbDocuments } from "@/src/db/schema/index";
import { eq, and } from "drizzle-orm";
import { AuthError } from "@/src/lib/with-auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth
  let session;
  try {
    session = await withAuth();
  } catch (err) {
    if (err instanceof AuthError) {
      return Response.json({ error: err.message }, { status: err.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    return Response.json({ error: "Error de autenticación" }, { status: 401 });
  }

  // 2. Obtener ID
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return Response.json({ error: "ID inválido" }, { status: 400 });
  }

  // 3. Buscar documento
  const [doc] = await db
    .select()
    .from(kbDocuments)
    .where(eq(kbDocuments.id, id))
    .limit(1);

  if (!doc) {
    return Response.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  // 4. Validar acceso al predio del documento
  const { rol, predios } = session.user;
  const tieneAccesoTotal = rol === "superadmin" || rol === "admin_org";
  if (!tieneAccesoTotal && !predios.includes(doc.predioId)) {
    return Response.json({ error: "Sin acceso a este documento" }, { status: 403 });
  }

  // 5. Eliminar de Google Files API (best-effort — puede ya estar expirado)
  try {
    const ai = getGoogleAIClient();
    await ai.files.delete({ name: doc.googleFileName });
  } catch {
    // Ignorar — el archivo puede haber expirado en Google
  }

  // 6. Eliminar de BD
  await db.delete(kbDocuments).where(and(eq(kbDocuments.id, id)));

  return Response.json({ ok: true });
}
