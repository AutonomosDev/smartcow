/**
 * auth.ts — Configuración NextAuth v5 (Auth.js beta)
 * Provider: credentials (email + password)
 * JWT payload: { userId, fundoId, rol }
 * Roles: admin_fundo | operador | veterinario | viewer
 * Ticket: AUT-110
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/src/db/client";
import { users } from "@/src/db/schema/index";
import { eq } from "drizzle-orm";
import type { AuthError as NextAuthError } from "@auth/core/errors";
import type { JWT } from "@auth/core/jwt";
import type { Session, User as AuthUser } from "@auth/core/types";

// ─────────────────────────────────────────────
// TIPOS — extensión de sesión
// ─────────────────────────────────────────────

export type UserRol = "admin_fundo" | "operador" | "veterinario" | "viewer";

export interface SmartCowSession extends Session {
  user: {
    id: string;
    email: string;
    nombre: string;
    fundoId: number;
    rol: UserRol;
  };
}

export interface SmartCowJWT extends JWT {
  userId: number;
  fundoId: number;
  rol: UserRol;
  nombre: string;
}

export interface SmartCowUser extends AuthUser {
  id: string;
  email: string;
  nombre: string;
  fundoId: number;
  rol: UserRol;
}

// ─────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────

const nextAuth = NextAuth({
  providers: [
    Credentials({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (
          !credentials?.email ||
          !credentials?.password ||
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();

        const result = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        const user = result[0];
        if (!user) return null;

        const passwordOk = await compare(credentials.password, user.passwordHash);
        if (!passwordOk) return null;

        // No incluir passwordHash en el objeto retornado
        const smartCowUser: SmartCowUser = {
          id: String(user.id),
          email: user.email,
          nombre: user.nombre,
          fundoId: user.fundoId,
          rol: user.rol as UserRol,
        };

        return smartCowUser;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as SmartCowUser;
        const t = token as SmartCowJWT;
        t.userId = Number(u.id);
        t.fundoId = u.fundoId;
        t.rol = u.rol;
        t.nombre = u.nombre;
      }
      return token;
    },

    async session({ session, token }) {
      const t = token as SmartCowJWT;
      return {
        ...session,
        user: {
          id: String(t.userId),
          email: t.email ?? "",
          nombre: t.nombre,
          fundoId: t.fundoId,
          rol: t.rol,
        },
      } as unknown as SmartCowSession;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  // No registrar datos del usuario en logs
  logger: {
    error(error: unknown) {
      // Solo loguear el código de error, nunca credenciales ni PII
      const authErr = error as NextAuthError;
      console.error("[auth error]", authErr?.type ?? "unknown");
    },
  },
});

export const { handlers, signIn, signOut } = nextAuth;

/**
 * auth() tipado — retorna SmartCowSession | null.
 * Usar en Server Components y server actions.
 */
export async function auth(): Promise<SmartCowSession | null> {
  const session = await nextAuth.auth();
  return session as unknown as SmartCowSession | null;
}
