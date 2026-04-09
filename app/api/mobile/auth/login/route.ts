/**
 * app/api/mobile/auth/login/route.ts — Login mobile via Firebase ID token.
 * POST /api/mobile/auth/login
 * Body: { idToken: string }  ← Firebase ID token del cliente Expo
 *
 * La app Expo autentica con Firebase Client SDK (email/password),
 * obtiene el ID token y lo envía aquí para validar y recibir datos del usuario.
 */

import { NextRequest } from "next/server";
import { adminAuth } from "@/src/lib/firebase/admin";
import { loadUserByFirebaseUid } from "@/src/lib/auth";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const { idToken } = body as { idToken?: unknown };

  if (typeof idToken !== "string" || !idToken) {
    return Response.json({ error: "idToken requerido" }, { status: 400 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return Response.json({ error: "Token inválido o expirado" }, { status: 401 });
  }

  const session = await loadUserByFirebaseUid(uid);
  if (!session) {
    return Response.json({ error: "Usuario no registrado en SmartCow" }, { status: 403 });
  }

  return Response.json({
    user: session.user,
    // El cliente mobile usa el Firebase ID token directamente como Bearer.
    // No se genera un JWT custom — usar idToken de Firebase en Authorization header.
  });
}
