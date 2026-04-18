/**
 * app/api/mobile/auth/refresh/route.ts — Refresh de token mobile
 * POST /api/mobile/auth/refresh
 * Body: { token: string }  ← el token actual (puede estar hasta 1h expirado)
 *
 * Verifica la firma del token con AUTH_SECRET. Si es válida (aunque haya
 * expirado hace < 1h), recarga el usuario de DB, emite un nuevo token 8h
 * y responde { token, user }.
 *
 * Responde 401 si:
 *   - El token es inválido o la firma no coincide
 *   - El token lleva más de 1h expirado
 *   - El usuario ya no existe o está desactivado en DB
 */

import { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { loadUserByEmail } from "@/src/lib/auth";
import type { SmartCowJWT } from "@/src/lib/mobile-jwt";

const TOLERANCE_SECONDS = 60 * 60; // 1 hora post-expiración

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  if (!s) throw new Error("AUTH_SECRET no configurado");
  return new TextEncoder().encode(s);
}

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

  // Verificar firma — clockTolerance permite tokens hasta TOLERANCE_SECONDS expirados
  let payload: SmartCowJWT;
  try {
    const { payload: raw } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
      clockTolerance: TOLERANCE_SECONDS,
    });
    payload = raw as unknown as SmartCowJWT;
  } catch {
    return Response.json({ error: "Token inválido o expirado" }, { status: 401 });
  }

  const email = payload.email;
  if (!email) {
    return Response.json({ error: "Token sin email — re-login requerido" }, { status: 401 });
  }

  // Recargar usuario de DB (puede haber cambiado rol, predios o estar desactivado)
  const session = await loadUserByEmail(email).catch(() => null);
  if (!session) {
    return Response.json({ error: "Usuario no encontrado — re-login requerido" }, { status: 401 });
  }

  // Emitir nuevo token 8h
  const newToken = await new SignJWT({
    userId: Number(session.user.id),
    orgId: session.user.orgId,
    predios: session.user.predios,
    rol: session.user.rol,
    nombre: session.user.nombre,
    email: session.user.email,
    modulos: session.user.modulos,
  } satisfies Omit<SmartCowJWT, "iat" | "exp" | "jti">)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());

  return Response.json({ token: newToken, user: session.user });
}
