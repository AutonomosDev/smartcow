/**
 * app/api/kb/list/route.ts — Lista documentos KB de un predio.
 * Ticket: AUT-176
 *
 * GET /api/kb/list?predio_id=N
 * Response: { files: KbDocument[] }
 */

import { NextRequest } from "next/server";
import { withAuth } from "@/src/lib/with-auth";
import { db } from "@/src/db/client";
import { kbDocuments } from "@/src/db/schema/index";
import { eq, desc } from "drizzle-orm";
import { AuthError } from "@/src/lib/with-auth";

export async function GET(req: NextRequest) {
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

  // 2. Validar predio_id
  const predioIdStr = req.nextUrl.searchParams.get("predio_id");
  if (!predioIdStr) {
    return Response.json({ error: "predio_id requerido" }, { status: 400 });
  }

  const predioId = parseInt(predioIdStr, 10);
  if (isNaN(predioId)) {
    return Response.json({ error: "predio_id inválido" }, { status: 400 });
  }

  // 3. Validar acceso
  const { rol, predios } = session.user;
  const tieneAccesoTotal = rol === "superadmin" || rol === "admin_org";
  if (!tieneAccesoTotal && !predios.includes(predioId)) {
    return Response.json({ error: "Sin acceso a este predio" }, { status: 403 });
  }

  // 4. Consultar BD
  const files = await db
    .select()
    .from(kbDocuments)
    .where(eq(kbDocuments.predioId, predioId))
    .orderBy(desc(kbDocuments.creadoEn));

  const now = new Date();
  return Response.json({
    files: files.map((f) => ({
      id: f.id,
      nombre: f.nombre,
      mimeType: f.mimeType,
      expiresAt: f.expiresAt.toISOString(),
      creadoEn: f.creadoEn.toISOString(),
      status: f.expiresAt > now ? "active" : "expired",
    })),
  });
}
