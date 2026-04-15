/**
 * app/api/auth/session/route.ts
 * DEPRECADO — Next-Auth maneja las sesiones via /api/auth/[...nextauth]
 * Mantenido solo para logout limpio durante transición.
 * Ticket: AUT-215
 */
import { NextResponse } from "next/server";
import { signOut } from "@/auth.config";

export async function DELETE() {
  await signOut({ redirect: false });
  return NextResponse.json({ ok: true });
}
