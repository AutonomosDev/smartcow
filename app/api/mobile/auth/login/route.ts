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
import { loadUserByFirebaseUid, loadUserByEmail } from "@/src/lib/auth";

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

  // En desarrollo: verifyIdToken requiere credenciales Admin SDK del proyecto activo.
  // Como fallback, decodificamos el payload JWT (sin verificar firma) y buscamos por email.
  let session;
  if (process.env.NODE_ENV === "development") {
    try {
      const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString());
      const email: string = payload.email ?? "";
      if (!email) return Response.json({ error: "Token sin email" }, { status: 401 });
      session = await loadUserByEmail(email);
    } catch {
      return Response.json({ error: "Token inválido" }, { status: 401 });
    }
  } else {
    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      return Response.json({ error: "Token inválido o expirado" }, { status: 401 });
    }
    session = await loadUserByFirebaseUid(uid);
  }
  if (!session) {
    return Response.json({ error: "Usuario no registrado en SmartCow" }, { status: 403 });
  }

  return Response.json({
    user: session.user,
    // El cliente mobile usa el Firebase ID token directamente como Bearer.
    // No se genera un JWT custom — usar idToken de Firebase en Authorization header.
  });
}
