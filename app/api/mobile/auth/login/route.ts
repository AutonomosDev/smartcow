/**
 * app/api/mobile/auth/login/route.ts — Login mobile via Next-Auth JWT token.
 * POST /api/mobile/auth/login
 * Body: { token: string }  ← Next-Auth JWT token del cliente Expo
 *
 * La app Expo autentica via credenciales (email/password) y recibe un JWT
 * de Next-Auth que envía aquí para validar y recibir datos del usuario.
 *
 * Ticket: AUT-216
 */

import { NextRequest } from "next/server";
import { decode } from "@auth/core/jwt";
import { loadUserByEmail } from "@/src/lib/auth";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const { token } = body as { token?: unknown };

  if (typeof token !== "string" || !token) {
    return Response.json({ error: "token requerido" }, { status: 400 });
  }

  let email: string;

  if (process.env.NODE_ENV === "development") {
    // En desarrollo: decodificar sin verificar firma para facilitar testing
    try {
      const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
      email = payload.email ?? "";
      if (!email) return Response.json({ error: "Token sin email" }, { status: 401 });
    } catch {
      return Response.json({ error: "Token inválido" }, { status: 401 });
    }
  } else {
    try {
      const secret = process.env.NEXTAUTH_SECRET ?? "";
      // Next-Auth v5 uses JWE encryption — use @auth/core/jwt decode
      const payload = await decode({
        token,
        secret,
        salt: "__session", // Same cookie name used in auth.config.ts
      });
      email = (payload?.email as string) ?? "";
      if (!email) throw new Error("No email in token");
    } catch {
      return Response.json({ error: "Token inválido o expirado" }, { status: 401 });
    }
  }

  const session = await loadUserByEmail(email);
  if (!session) {
    return Response.json({ error: "Usuario no registrado en SmartCow" }, { status: 403 });
  }

  return Response.json({
    user: session.user,
  });
}
