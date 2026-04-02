/**
 * middleware.ts — Protege /api/* y /dashboard/* con NextAuth v5.
 * Rutas públicas: /login, /api/auth/* (callbacks de NextAuth)
 * Ticket: AUT-110
 */

import { auth } from "@/src/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas públicas — dejar pasar siempre
  const isPublic =
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  if (isPublic) return NextResponse.next();

  // Rutas protegidas: /dashboard/* y /api/* (excepto /api/auth/*)
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/api");

  if (isProtected) {
    const session = await auth();
    if (!session) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
      }
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Proteger dashboard y API, excluir rutas estáticas de Next.js
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
