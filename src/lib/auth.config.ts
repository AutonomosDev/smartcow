/**
 * auth.config.ts — Config Edge-safe de NextAuth v5.
 * SIN imports de Node.js (no bcrypt, no pg, no crypto).
 * Usado por middleware.ts (Edge Runtime) y extendido por auth.ts (Node.js).
 *
 * Contiene: tipos, JWT/session callbacks, pages, session config.
 * NO contiene: providers con lógica de DB (eso va en auth.ts).
 */

import type { NextAuthConfig, Session, User as AuthUser } from "next-auth";
import type { JWT } from "@auth/core/jwt";

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

export interface SmartCowSession extends Session {
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

export interface SmartCowJWT extends JWT {
  userId: number;
  orgId: number;
  predios: number[];
  rol: UserRol;
  nombre: string;
  modulos: Record<string, boolean>;
  email?: string | null;
  sub?: string;
}

export interface SmartCowUser extends AuthUser {
  id: string;
  email: string;
  nombre: string;
  orgId: number;
  predios: number[];
  rol: UserRol;
  modulos: Record<string, boolean>;
}

// ─────────────────────────────────────────────
// CONFIG EDGE-SAFE
// ─────────────────────────────────────────────

export const authConfig: NextAuthConfig = {
  providers: [],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as SmartCowUser;
        const t = token as SmartCowJWT;
        t.userId = Number(u.id);
        t.orgId = u.orgId;
        t.predios = u.predios;
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
          predios: t.predios ?? [],
          rol: t.rol,
          modulos: t.modulos ?? {},
        },
      } as unknown as SmartCowSession;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
};
