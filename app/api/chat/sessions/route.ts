import { NextResponse } from "next/server";
import { withAuth } from "@/src/lib/with-auth";
import { AuthError } from "@/src/lib/with-auth";
import { db } from "@/src/db/client";
import { chatSessions } from "@/src/db/schema/chat_sessions";
import { predios } from "@/src/db/schema/predios";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await withAuth();
    const { id: userIdStr, rol, orgId, predios: prediosPermitidos } = session.user;
    const userId = parseInt(userIdStr, 10);

    // admin_org ve todos los predios de su org
    const tieneAccesoTotal = rol === "superadmin" || rol === "admin_org";

    const rows = await db
      .select({
        id: chatSessions.id,
        titulo: chatSessions.titulo,
        predioId: chatSessions.predioId,
        predioNombre: predios.nombre,
      })
      .from(chatSessions)
      .leftJoin(predios, eq(chatSessions.predioId, predios.id))
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.actualizadoEn))
      .limit(100);

    // Filtrar por predios permitidos si no es admin_org/superadmin
    const filtered = tieneAccesoTotal
      ? rows
      : rows.filter((r) => r.predioId === null || prediosPermitidos.includes(r.predioId));

    // Agrupar por predio
    const groupMap = new Map<string, { predio_id: number | null; predio_nombre: string; sesiones: { id: number; titulo: string }[] }>();

    for (const row of filtered) {
      const key = row.predioId !== null ? String(row.predioId) : "global";
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          predio_id: row.predioId,
          predio_nombre: row.predioNombre ?? "General",
          sesiones: [],
        });
      }
      groupMap.get(key)!.sesiones.push({ id: row.id, titulo: row.titulo });
    }

    return NextResponse.json(Array.from(groupMap.values()));
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
