/**
 * app/api/auth/session/route.ts — Gestión de sesión Firebase.
 *
 * POST  /api/auth/session — recibe Firebase ID token, crea session cookie HttpOnly
 * DELETE /api/auth/session — elimina session cookie (logout)
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/src/lib/firebase/admin";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const { idToken } = body as { idToken?: string };

  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json({ error: "idToken requerido" }, { status: 400 });
  }

  try {
    // Verificar el ID token antes de crear la session cookie
    await adminAuth.verifyIdToken(idToken);

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set("__session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_MS / 1000,
      path: "/",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/session POST]", err);
    return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
      await adminAuth.revokeRefreshTokens(decoded.uid);
    } catch {
      // Cookie inválida o expirada — igual la borramos
    }
    cookieStore.delete("__session");
  }

  return NextResponse.json({ ok: true });
}
