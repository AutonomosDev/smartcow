/**
 * middleware.ts — Protege rutas con Next-Auth v5
 * Reemplaza verificación manual de cookie Firebase (AUT-215)
 * Edge Runtime: next-auth/middleware corre en edge sin firebase-admin ni pg.
 */
import { auth } from "@/auth.config";
import { NextResponse } from "next/server";
import type { NextAuthRequest } from "next-auth";

export default auth(function middleware(req: NextAuthRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname === "/login" ||
    pathname === "/" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  if (isPublic) return NextResponse.next();

  if (process.env.NODE_ENV === "development") return NextResponse.next();

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/chat") ||
    (pathname.startsWith("/api") && !pathname.startsWith("/api/auth"));

  if (isProtected && !req.auth) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
