/**
 * with-auth.ts — Helper withAuth() para server actions y route handlers.
 * Toda server action que toque datos de predio DEBE usar withAuth().
 *
 * withAuth()        — para Server Components y server actions (session cookie)
 * withAuthBearer()  — para endpoints REST mobile (Next-Auth JWT token)
 */

import { NextRequest } from "next/server";
import { decode } from "@auth/core/jwt";
import { auth, loadUserByEmail } from "./auth";
import type { SmartCowSession, UserRol } from "./auth";

// Jerarquía de roles (mayor índice = mayor privilegio)
// trial: read-only por 48h, rank -1 para que cualquier rolMinimo lo bloquee.
const ROL_RANK: Record<UserRol, number> = {
  trial: -1,
  viewer: 0,
  operador: 1,
  veterinario: 2,
  admin_fundo: 3,
  admin_org: 4,
  superadmin: 5,
};

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN"
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export interface WithAuthOptions {
  /** Rol mínimo requerido para ejecutar la acción */
  rolMinimo?: UserRol;
  /** Módulo que debe estar activo en la org del usuario */
  modulo?: string;
  /** ID de predio al que el usuario debe tener acceso explícito */
  predioId?: number;
}

function applyOptions(session: SmartCowSession, options?: WithAuthOptions): void {
  const { rolMinimo, modulo, predioId } = options ?? {};
  const { rol, predios, modulos, trialUntil } = session.user;

  // AUT-289 — Trial users: bloquear si trialUntil vencido.
  if (rol === "trial") {
    if (!trialUntil || new Date(trialUntil).getTime() <= Date.now()) {
      throw new AuthError("Período de demo finalizado", "FORBIDDEN");
    }
  }

  if (rolMinimo !== undefined) {
    if ((ROL_RANK[rol] ?? -1) < (ROL_RANK[rolMinimo] ?? 0)) {
      throw new AuthError("Permisos insuficientes", "FORBIDDEN");
    }
  }

  if (modulo !== undefined && !modulos[modulo]) {
    throw new AuthError("Módulo no disponible para esta organización", "FORBIDDEN");
  }

  if (predioId !== undefined) {
    const tieneAccesoTotal = rol === "superadmin" || rol === "admin_org";
    if (!tieneAccesoTotal && !predios.includes(predioId)) {
      throw new AuthError("Sin acceso a este predio", "FORBIDDEN");
    }
  }
}

/**
 * Verifica autenticación via session cookie (web).
 * Lanza AuthError en caso de fallo — nunca retorna null.
 */
export async function withAuth(options?: WithAuthOptions): Promise<SmartCowSession> {
  const session = await auth();

  if (!session?.user) {
    throw new AuthError("No autenticado", "UNAUTHENTICATED");
  }

  applyOptions(session, options);
  return session;
}

/**
 * Verifica autenticación via Next-Auth JWT token (Bearer, para mobile).
 * Header: Authorization: Bearer <nextauth-jwt-token>
 *
 * Lanza AuthError si el token falta, es inválido o expiró.
 */
export async function withAuthBearer(
  req: NextRequest,
  options?: WithAuthOptions
): Promise<SmartCowSession> {
  // Bypass en dev — mismo DEV_SESSION que auth() retorna
  if (process.env.NODE_ENV === "development") {
    const session = await auth();
    if (session) {
      applyOptions(session, options);
      return session;
    }
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Token Bearer requerido", "UNAUTHENTICATED");
  }

  const token = authHeader.slice(7).trim();

  let email: string;
  try {
    const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
    // Next-Auth v5 uses JWE encryption — use @auth/core/jwt decode
    const payload = await decode({
      token,
      secret,
      salt: "__session", // Same cookie name used in auth.config.ts
    });
    email = (payload?.email as string) ?? "";
    if (!email) throw new Error("No email in token");
  } catch {
    throw new AuthError("Token inválido o expirado", "UNAUTHENTICATED");
  }

  const session = await loadUserByEmail(email);
  if (!session) {
    throw new AuthError("Usuario no encontrado", "UNAUTHENTICATED");
  }

  applyOptions(session, options);
  return session;
}
