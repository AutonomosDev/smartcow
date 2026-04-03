/**
 * with-auth.ts — Helper withAuth() para server actions.
 * Toda server action que toque datos de fundo DEBE usar withAuth().
 * Ticket: AUT-110
 *
 * Uso:
 *   export async function miServerAction() {
 *     const session = await withAuth();
 *     // session.user.fundoId, session.user.rol garantizados
 *   }
 *
 *   // Con verificación de rol mínimo:
 *   const session = await withAuth("admin_fundo");
 */

import { auth } from "./auth";
import type { SmartCowSession, UserRol } from "./auth";

// Jerarquía de roles (mayor índice = mayor privilegio)
const ROL_RANK: Record<UserRol, number> = {
  viewer: 0,
  operador: 1,
  veterinario: 2,
  admin_fundo: 3,
  admin_org: 4,
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

/**
 * Verifica que la sesión existe y, opcionalmente, que el rol del usuario
 * tiene rango >= al rol mínimo requerido.
 *
 * Lanza AuthError en caso de fallo — nunca retorna null.
 */
export async function withAuth(rolMinimo?: UserRol): Promise<SmartCowSession> {
  const session = await auth();

  if (!session?.user) {
    throw new AuthError("No autenticado", "UNAUTHENTICATED");
  }

  if (rolMinimo !== undefined) {
    const rankUsuario = ROL_RANK[session.user.rol] ?? -1;
    const rankRequerido = ROL_RANK[rolMinimo] ?? 0;

    if (rankUsuario < rankRequerido) {
      throw new AuthError(
        // No exponer el rol del usuario en el mensaje de error
        "Permisos insuficientes",
        "FORBIDDEN"
      );
    }
  }

  return session;
}
