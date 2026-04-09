/**
 * src/lib/mobile-jwt.ts — JWT para autenticación mobile.
 * Firma y verifica tokens Bearer usados por la app Expo.
 *
 * Usa el mismo AUTH_SECRET que NextAuth para tener un único secreto
 * en toda la plataforma. Alg: HS256. Expiración: 8h.
 *
 * Payload idéntico a SmartCowJWT para reutilizar withAuth helpers.
 */

import { SignJWT, jwtVerify } from "jose";
import type { UserRol } from "./auth";

export interface SmartCowJWT {
  userId: number;
  orgId: number;
  predios: number[];
  rol: UserRol;
  nombre: string;
  email?: string | null;
  modulos: Record<string, boolean>;
  iat?: number;
  exp?: number;
  jti?: string;
}

const getSecret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET no configurado");
  return new TextEncoder().encode(s);
};

const EXPIRATION = "8h";

/**
 * Firma un payload SmartCowJWT y retorna el token como string.
 */
export async function signMobileToken(payload: Omit<SmartCowJWT, "iat" | "exp" | "jti">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRATION)
    .sign(getSecret());
}

/**
 * Verifica y decodifica un Bearer token mobile.
 * Lanza JWTExpired / JWTInvalid si el token es inválido o expiró.
 */
export async function verifyMobileToken(token: string): Promise<SmartCowJWT> {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ["HS256"],
  });
  return payload as unknown as SmartCowJWT;
}
