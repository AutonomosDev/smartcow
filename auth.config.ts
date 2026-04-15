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
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/src/db/client";
import { users, userPredios, organizaciones } from "@/src/db/schema/index";
import { eq } from "drizzle-orm";
import type { SmartCowSession, UserRol } from "@/src/lib/auth";

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

  return {
    id: String(user.id),
    email: user.email,
    nombre: user.nombre,
    orgId: user.orgId,
    predios: predioRows.map((r) => r.predioId),
    rol: user.rol as UserRol,
    modulos: (orgRows[0]?.modulos as Record<string, boolean>) ?? {},
  };
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
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

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
    async jwt({ token, user, account }) {
      if (user && (user as typeof user & { smartcow?: SmartCowSession["user"] }).smartcow) {
        token.smartcow = (user as typeof user & { smartcow: SmartCowSession["user"] }).smartcow;
      }
      // Para Google SSO: cargar datos SmartCow por email en el primer login
      if (account?.provider === "google" && token.email && !token.smartcow) {
        const smartCowUser = await loadSmartCowUser(token.email);
        if (smartCowUser) {
          token.smartcow = smartCowUser;
        }
      }
      return token;
    },
    // Exponer datos SmartCow en la session
    async session({ session, token }) {
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
