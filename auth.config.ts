/**
 * auth.config.ts — Configuración Next-Auth v5
 * Reemplaza Firebase Auth + firebase/admin.ts + firebase/client.ts
 *
 * Providers:
 *   - CredentialsProvider: email/password con bcryptjs
 *   - GoogleProvider: SSO via Google OAuth
 *
 * Session: JWT + cookie httpOnly (mismo comportamiento que __session de Firebase)
 * Adapter: @auth/drizzle-adapter sobre PostgreSQL (misma DB)
 *
 * Ticket: AUT-215
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/src/db/client";
import { users, userPredios, organizaciones, predios } from "@/src/db/schema/index";
import { eq } from "drizzle-orm";
import type { SmartCowSession, UserRol } from "@/src/lib/auth";
import { TRIAL_ORG_ID, TRIAL_DURATION_MS } from "@/src/lib/auth";
import type { JWT } from "@auth/core/jwt";
import type { Session, Account, User } from "next-auth";

// ─── Helper: cargar datos SmartCow por email ──────────────────────────────────

async function loadSmartCowUser(email: string): Promise<SmartCowSession["user"] | null> {
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

  // Org 99 (demo): predios array = todos los predios de la org (sin user_predios explícitos).
  // Aplica tanto a rol='trial' (Google SSO auto-creado) como a testers internos (rol='viewer').
  let predioIds = predioRows.map((r) => r.predioId);
  if (user.orgId === TRIAL_ORG_ID) {
    const orgPredios = await db
      .select({ id: predios.id })
      .from(predios)
      .where(eq(predios.orgId, TRIAL_ORG_ID));
    predioIds = orgPredios.map((p) => p.id);
  }

  return {
    id: String(user.id),
    email: user.email,
    nombre: user.nombre,
    orgId: user.orgId,
    predios: predioIds,
    rol: user.rol as UserRol,
    modulos: (orgRows[0]?.modulos as Record<string, boolean>) ?? {},
    trialUntil: user.trialUntil ? user.trialUntil.toISOString() : null,
  };
}

// AUT-289 — Auto-create Google users as trial (48h read-only, org_id=99)
async function createTrialUser(email: string, nombre: string): Promise<SmartCowSession["user"] | null> {
  // Verificar que org 99 exista. Si no, abortar (seed no corrió aún).
  const orgCheck = await db
    .select({ id: organizaciones.id })
    .from(organizaciones)
    .where(eq(organizaciones.id, TRIAL_ORG_ID))
    .limit(1);

  if (!orgCheck[0]) {
    console.error(`[auth] createTrialUser aborted: org ${TRIAL_ORG_ID} no existe. Correr seed-synthetic-dataset.ts`);
    return null;
  }

  const trialUntil = new Date(Date.now() + TRIAL_DURATION_MS);

  await db.insert(users).values({
    orgId: TRIAL_ORG_ID,
    email,
    nombre: nombre || email.split("@")[0],
    rol: "trial",
    trialUntil,
  });

  return loadSmartCowUser(email);
}

// ─── Next-Auth config ─────────────────────────────────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Sin adapter de tabla — usamos JWT strategy con nuestra propia tabla users
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas — mismo que Firebase
  },
  cookies: {
    sessionToken: {
      name: "__session", // Mismo nombre de cookie que Firebase para no romper middleware
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    // ── Email + Password ──────────────────────────────────────────────────────
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials: Partial<Record<"email" | "password", unknown>>) {
        const email = (credentials?.email as string | undefined) ?? "";
        const password = (credentials?.password as string | undefined) ?? "";

        if (!email || !password) return null;

        const result = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        const user = result[0];
        if (!user) return null;

        // passwordHash es una nueva columna que agregaremos en la migración
        const hash = (user as typeof user & { passwordHash?: string }).passwordHash;
        if (!hash) return null;

        const valid = await bcrypt.compare(password, hash);
        if (!valid) return null;

        const smartCowUser = await loadSmartCowUser(email);
        if (!smartCowUser) return null;

        return {
          id: smartCowUser.id,
          email: smartCowUser.email,
          name: smartCowUser.nombre,
          smartcow: smartCowUser,
        };
      },
    }),

    // ── Google SSO ────────────────────────────────────────────────────────────
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // Enriquecer el JWT con datos SmartCow
    async jwt({ token, user, account }: { token: JWT; user: User; account?: Account | null }) {
      const u = user as User & { smartcow?: SmartCowSession["user"] };
      if (u?.smartcow) {
        token.smartcow = u.smartcow;
      }
      // Para Google SSO: cargar datos SmartCow por email. Si no existe → crear como trial.
      if (account?.provider === "google" && token.email && !token.smartcow) {
        let smartCowUser = await loadSmartCowUser(token.email);
        if (!smartCowUser) {
          smartCowUser = await createTrialUser(token.email, (token.name as string) ?? token.email);
        }
        if (smartCowUser) {
          token.smartcow = smartCowUser;
        }
      }
      return token;
    },
    // Exponer datos SmartCow en la session
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.smartcow) {
        session.user = token.smartcow as typeof session.user;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
});
