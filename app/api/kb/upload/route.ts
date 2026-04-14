/**
 * app/api/kb/upload/route.ts — Upload de documento a Google Files API.
 * Ticket: AUT-176
 *
 * POST /api/kb/upload
 * Body: FormData { file: File, predio_id: string }
 * Response: { id, nombre, fileUri, expiresAt }
 */

import { NextRequest } from "next/server";
import { withAuth } from "@/src/lib/with-auth";
import { getGoogleAIClient } from "@/src/lib/claude";
import { db } from "@/src/db/client";
import { kbDocuments } from "@/src/db/schema/index";
import { AuthError } from "@/src/lib/with-auth";

// Tipos MIME aceptados
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
];

// 20 MB max
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export async function POST(req: NextRequest) {
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

  // 2. Parsear FormData
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "FormData inválido" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const predioIdStr = formData.get("predio_id") as string | null;

  if (!file || !predioIdStr) {
    return Response.json({ error: "file y predio_id son requeridos" }, { status: 400 });
  }

  const predioId = parseInt(predioIdStr, 10);
  if (isNaN(predioId)) {
    return Response.json({ error: "predio_id inválido" }, { status: 400 });
  }

  // 3. Validar acceso al predio
  const { rol, predios } = session.user;
  const tieneAccesoTotal = rol === "superadmin" || rol === "admin_org";
  if (!tieneAccesoTotal && !predios.includes(predioId)) {
    return Response.json({ error: "Sin acceso a este predio" }, { status: 403 });
  }

  // 4. Validar archivo
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "Archivo demasiado grande (máx 20MB)" }, { status: 400 });
  }

  const mimeType = file.type || "application/octet-stream";
  if (!ACCEPTED_MIME_TYPES.includes(mimeType)) {
    return Response.json({ error: "Tipo de archivo no soportado (PDF, XLSX, CSV)" }, { status: 400 });
  }

  // 5. Upload a Google Files API
  let uploadedFile;
  try {
    const ai = getGoogleAIClient();
    const fileBlob = new Blob([await file.arrayBuffer()], { type: mimeType });
    uploadedFile = await ai.files.upload({
      file: fileBlob,
      config: { mimeType, displayName: file.name },
    });
  } catch (err) {
    console.error("[kb/upload] Google Files API error:", err instanceof Error ? err.message : "unknown");
    return Response.json({ error: "Error al subir archivo a Google" }, { status: 502 });
  }

  if (!uploadedFile.uri || !uploadedFile.name) {
    return Response.json({ error: "Respuesta inválida de Google Files API" }, { status: 502 });
  }

  // 6. Calcular expiración (48h desde ahora, con margen de 1h)
  const expiresAt = new Date(Date.now() + 47 * 60 * 60 * 1000);

  // 7. Guardar en BD
  let inserted;
  try {
    inserted = await db
      .insert(kbDocuments)
      .values({
        predioId,
        nombre: file.name,
        mimeType,
        fileUri: uploadedFile.uri,
        googleFileName: uploadedFile.name,
        expiresAt,
      })
      .returning();
  } catch (err) {
    console.error("[kb/upload] DB insert error:", err instanceof Error ? err.message : "unknown");
    // Si falla la BD, intentar eliminar el archivo de Google
    try {
      const ai = getGoogleAIClient();
      await ai.files.delete({ name: uploadedFile.name });
    } catch {
      // ignorar error de limpieza
    }
    return Response.json({ error: "Error al guardar en base de datos" }, { status: 500 });
  }

  const doc = inserted[0];
  return Response.json({
    id: doc.id,
    nombre: doc.nombre,
    mimeType: doc.mimeType,
    fileUri: doc.fileUri,
    expiresAt: doc.expiresAt.toISOString(),
    creadoEn: doc.creadoEn.toISOString(),
  });
}
