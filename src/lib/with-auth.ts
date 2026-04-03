/**
 * with-auth.ts — Helper withAuth() para server actions.
 * Toda server action que toque datos de fundo DEBE usar withAuth().
 * Ticket: AUT-110 | AUT-130
 *
 * Uso básico:
 *   const session = await withAuth();
 *
 * Con rol mínimo requerido:
 *   const session = await withAuth({ rolMinimo: "admin_fundo" });
 *
 * Con validación de módulo:
 *   const session = await withAuth({ modulo: "feedlot" });
 *   // Lanza 403 si la org no tiene feedlot activado
 *
 * Con validación de fundo:
 *   const session = await withAuth({ fundoId: 3 });
 *   // Lanza 403 si el usuario no tiene acceso al fundo
 *
 * Combinado:
 *   const session = await withAuth({ rolMinimo: "operador", modulo: "crianza", fundoId: 5 });
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
  /** ID de fundo al que el usuario debe tener acceso explícito */
  fundoId?: number;
}

/**
 * Verifica autenticación y, opcionalmente:
 * - que el rol del usuario tenga rango >= rolMinimo
 * - que el módulo solicitado esté activo en la org
 * - que el usuario tenga acceso al fundoId indicado
 *   (superadmin y admin_org pasan sin verificación de fundo)
 *
 * Lanza AuthError en caso de fallo — nunca retorna null.
 */
export async function withAuth(options?: WithAuthOptions): Promise<SmartCowSession> {
  const session = await auth();

  if (!session?.user) {
    throw new AuthError("No autenticado", "UNAUTHENTICATED");
  }

  const { rolMinimo, modulo, fundoId } = options ?? {};
  const { rol, fundos, modulos } = session.user;

  // Verificar rol mínimo
  if (rolMinimo !== undefined) {
    const rankUsuario = ROL_RANK[rol] ?? -1;
    const rankRequerido = ROL_RANK[rolMinimo] ?? 0;

    if (rankUsuario < rankRequerido) {
      throw new AuthError("Permisos insuficientes", "FORBIDDEN");
    }
  }

  // Verificar que el módulo está activo en la org
  if (modulo !== undefined) {
    if (!modulos[modulo]) {
      throw new AuthError("Módulo no disponible para esta organización", "FORBIDDEN");
    }
  }

  // Verificar acceso al fundo solicitado
  // superadmin y admin_org tienen acceso implícito a todos los fundos de su org
  if (fundoId !== undefined) {
    const tieneAccesoTotal = rol === "superadmin" || rol === "admin_org";
    if (!tieneAccesoTotal && !fundos.includes(fundoId)) {
      throw new AuthError("Sin acceso a este fundo", "FORBIDDEN");
    }
  }

  return session;
}
