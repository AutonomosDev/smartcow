/**
 * app/api/auth/[...nextauth]/route.ts — obsoleto post-migración Firebase.
 * La lógica de sesión está en /api/auth/session (POST/DELETE).
 */
export async function GET() {
  return Response.json({ error: "Usar /api/auth/session" }, { status: 410 });
}

export async function POST() {
  return Response.json({ error: "Usar /api/auth/session" }, { status: 410 });
}
