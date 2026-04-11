/**
 * src/lib/auth.ts — Autenticación via Firebase Admin SDK.
 * Verifica session cookie __session y carga datos del usuario desde DB.
 * Server-only (Node.js runtime).
 *
 * Reemplaza NextAuth v5 + auth.config.ts.
 */
import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "./firebase/admin";
import { db } from "@/src/db/client";
import { users, userPredios, organizaciones } from "@/src/db/schema/index";
import { eq } from "drizzle-orm";

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export type UserRol =
  | "superadmin"
  | "admin_org"
  | "admin_fundo"
  | "operador"
  | "veterinario"
  | "viewer";

export interface SmartCowSession {
  expires: string;
  user: {
    id: string;
    email: string;
    nombre: string;
    orgId: number;
    predios: number[];
    rol: UserRol;
    modulos: Record<string, boolean>;
  };
}

// ─────────────────────────────────────────────
// DEV SESSION (bypass en desarrollo)
// ─────────────────────────────────────────────

const DEV_SESSION: SmartCowSession = {
  user: {
    id: "1",
    email: "admin@smartcow.cl",
    nombre: "Admin Dev",
    orgId: 1,
    predios: [11, 7, 9, 8, 10, 6, 5],
    rol: "admin_org",
    modulos: { feedlot: true, crianza: true },
  },
  expires: "2099-12-31",
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Carga datos del usuario SmartCow a partir de su Firebase UID.
 * Retorna null si el UID no existe en nuestra DB.
 */
export async function loadUserByFirebaseUid(
  uid: string
): Promise<SmartCowSession | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.firebaseUid, uid))
    .limit(1);

  const user = result[0];
  if (!user) return null;

  const [predioRows, orgRows] = await Promise.all([
    db
      .select({ predioId: userPredios.predioId })
      .from(userPredios)
      .where(eq(userPredios.userId, user.id)),
    db
      .select({ modulos: organizaciones.modulos })
      .from(organizaciones)
      .where(eq(organizaciones.id, user.orgId))
      .limit(1),
  ]);

  return {
    expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    user: {
      id: String(user.id),
      email: user.email,
      nombre: user.nombre,
      orgId: user.orgId,
      predios: predioRows.map((r) => r.predioId),
      rol: user.rol as UserRol,
      modulos: (orgRows[0]?.modulos as Record<string, boolean>) ?? {},
    },
  };
}

// ─────────────────────────────────────────────
// auth() — Para Server Components y server actions
// ─────────────────────────────────────────────

/**
 * Verifica la session cookie __session y retorna SmartCowSession | null.
 * En development retorna DEV_SESSION sin verificar cookie.
 */
export async function auth(): Promise<SmartCowSession | null> {
  if (process.env.NODE_ENV === "development") return DEV_SESSION;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return loadUserByFirebaseUid(decoded.uid);
  } catch {
    return null;
  }
}
