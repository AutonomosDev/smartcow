/**
 * middleware.ts — Protege rutas verificando presencia de session cookie.
 * La verificación criptográfica real ocurre en auth() (Node.js runtime).
 * Edge Runtime: solo chequeo de cookie, sin firebase-admin ni pg.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname === "/login" ||
    pathname === "/" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon");

  if (isPublic) return NextResponse.next();

  // En desarrollo no hay verificación — auth() retorna DEV_SESSION
  if (process.env.NODE_ENV === "development") return NextResponse.next();

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/chat") ||
    (pathname.startsWith("/api") && !pathname.startsWith("/api/auth"));

  if (isProtected) {
    const sessionCookie = req.cookies.get("__session")?.value;
    if (!sessionCookie) {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
