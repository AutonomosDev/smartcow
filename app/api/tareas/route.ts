import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/src/lib/with-auth";
import { AuthError } from "@/src/lib/with-auth";
import { db } from "@/src/db/client";
import { userTasks } from "@/src/db/schema/user_tasks";

export async function POST(req: NextRequest) {
  try {
    const session = await withAuth({ rolMinimo: "operador" });
    const { id: userIdStr, orgId } = session.user;
    const userId = parseInt(userIdStr, 10);

    const body = await req.json() as { titulo?: string; asignado_a?: number | null };
    const { titulo, asignado_a } = body;

    if (!titulo?.trim()) {
      return NextResponse.json({ error: "El título es requerido" }, { status: 400 });
    }

    const [task] = await db
      .insert(userTasks)
      .values({
        userId,
        orgId,
        titulo: titulo.trim(),
        asignadoA: asignado_a ?? null,
      })
      .returning();

    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
