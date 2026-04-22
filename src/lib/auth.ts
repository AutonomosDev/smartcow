/**
 * src/lib/auth.ts — Autenticación via Next-Auth v5
 * Reemplaza Firebase Admin SDK (AUT-215)
 *
 * La función auth() es compatible con el código existente —
 * mismo shape SmartCowSession, mismo uso en Server Components.
 */
import "server-only";
import { auth as nextAuthSession } from "@/auth.config";

// ─── Tipos (mismos que antes — sin cambios en el resto de la app) ─────────────

export type UserRol =
  | "superadmin"
  | "admin_org"
  | "admin_fundo"
  | "operador"
  | "veterinario"
  | "viewer"
  | "trial";

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
    trialUntil?: string | null;
  };
}

// Org ID reservado para modo demo/trial. AUT-289.
export const TRIAL_ORG_ID = 99;
export const TRIAL_DURATION_MS = 48 * 60 * 60 * 1000;

// ─── DEV SESSION (bypass en desarrollo) ──────────────────────────────────────

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

// ─── auth() — Para Server Components y server actions ────────────────────────

/**
 * Retorna SmartCowSession | null.
 * En development retorna DEV_SESSION sin verificar cookie.
 * En producción usa Next-Auth JWT cookie __session.
 */
export async function auth(): Promise<SmartCowSession | null> {
  if (process.env.NODE_ENV === "development") return DEV_SESSION;

  const session = await nextAuthSession();
  if (!session?.user) return null;

  // Next-Auth session.user tiene el shape SmartCowSession.user
  // gracias al callback jwt en auth.config.ts
  const u = session.user as unknown as SmartCowSession["user"];
  if (!u.orgId || !u.rol) return null;

  return {
    expires: session.expires ?? new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    user: u,
  };
}

// ─── Helpers legacy (por compatibilidad con código existente) ─────────────────

import { db } from "@/src/db/client";
import { users, userPredios, organizaciones } from "@/src/db/schema/index";
import { eq } from "drizzle-orm";

export async function loadUserByEmail(email: string): Promise<SmartCowSession | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
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
      trialUntil: user.trialUntil ? user.trialUntil.toISOString() : null,
    },
  };
}
