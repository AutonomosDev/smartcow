/**
 * app/api/mobile/auth/login/route.ts — Login mobile via email/password.
 * POST /api/mobile/auth/login
 * Body: { email: string, password: string }
 *
 * Verifica credenciales contra DB (bcrypt), emite un SmartCow JWT (NextAuth format)
 * para usar como Bearer token en requests móviles posteriores.
 */

import { NextRequest } from "next/server";
import { encode } from "@auth/core/jwt";
import { loadUserByEmail } from "@/src/lib/auth";
import { db } from "@/src/db/client";
import { users } from "@/src/db/schema/index";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const { email, password } = body as { email?: unknown; password?: unknown };

  if (typeof email !== "string" || !email) {
    return Response.json({ error: "email requerido" }, { status: 400 });
  }
  if (typeof password !== "string" || !password) {
    return Response.json({ error: "password requerido" }, { status: 400 });
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = result[0];

  if (!user) {
    return Response.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const hash = (user as typeof user & { passwordHash?: string }).passwordHash;
  if (!hash) {
    return Response.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    return Response.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const session = await loadUserByEmail(email);
  if (!session) {
    return Response.json({ error: "Usuario no registrado en SmartCow" }, { status: 403 });
  }

  // Emitir SmartCow JWT (NextAuth JWE format) para uso como Bearer token
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  const token = await encode({
    token: {
      sub: session.user.id,
      email: session.user.email,
      smartcow: session.user,
    },
    secret,
    salt: "__session",
    maxAge: 8 * 60 * 60, // 8 horas
  });

  return Response.json({ user: session.user, token });
}
