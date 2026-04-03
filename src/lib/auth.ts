/**
 * auth.ts — Configuración NextAuth v5 (Auth.js beta)
 * Provider: credentials (email + password)
 * JWT payload: { userId, orgId, fundos, rol, modulos }
 * Roles: superadmin | admin_org | admin_fundo | operador | veterinario | viewer
 * Ticket: AUT-110 | AUT-128 | AUT-130
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/src/db/client";
import { users, userFundos, organizaciones } from "@/src/db/schema/index";
import { eq } from "drizzle-orm";
import type { AuthError as NextAuthError } from "@auth/core/errors";
import type { JWT } from "@auth/core/jwt";
import type { Session, User as AuthUser } from "@auth/core/types";

// ─────────────────────────────────────────────
// TIPOS — extensión de sesión
// ─────────────────────────────────────────────

export type UserRol =
  | "superadmin"
  | "admin_org"
  | "admin_fundo"
  | "operador"
  | "veterinario"
  | "viewer";

export interface SmartCowSession extends Session {
  user: {
    id: string;
    email: string;
    nombre: string;
    orgId: number;
    /** IDs de fundos accesibles para este usuario */
    fundos: number[];
    rol: UserRol;
    /** Feature flags activos en la org: { feedlot: true, crianza: true, … } */
    modulos: Record<string, boolean>;
  };
}

export interface SmartCowJWT extends JWT {
  userId: number;
  orgId: number;
  fundos: number[];
  rol: UserRol;
  nombre: string;
  modulos: Record<string, boolean>;
}

export interface SmartCowUser extends AuthUser {
  id: string;
  email: string;
  nombre: string;
  orgId: number;
  fundos: number[];
  rol: UserRol;
  modulos: Record<string, boolean>;
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

        // Obtener fundos asignados al usuario
        const fundoRows = await db
          .select({ fundoId: userFundos.fundoId })
          .from(userFundos)
          .where(eq(userFundos.userId, user.id));

        const fundoIds = fundoRows.map((r) => r.fundoId);

        // Obtener módulos activos de la org
        const orgRows = await db
          .select({ modulos: organizaciones.modulos })
          .from(organizaciones)
          .where(eq(organizaciones.id, user.orgId))
          .limit(1);

        const modulos = (orgRows[0]?.modulos as Record<string, boolean>) ?? {};

        // No incluir passwordHash en el objeto retornado
        const smartCowUser: SmartCowUser = {
          id: String(user.id),
          email: user.email,
          nombre: user.nombre,
          orgId: user.orgId,
          fundos: fundoIds,
          rol: user.rol as UserRol,
          modulos,
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
        t.orgId = u.orgId;
        t.fundos = u.fundos;
        t.rol = u.rol;
        t.nombre = u.nombre;
        t.modulos = u.modulos;
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
          orgId: t.orgId,
          fundos: t.fundos ?? [],
          rol: t.rol,
          modulos: t.modulos ?? {},
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
