import { NextResponse } from "next/server";
import { withAuth } from "@/src/lib/with-auth";
import { AuthError } from "@/src/lib/with-auth";
import { db } from "@/src/db/client";
import { predios } from "@/src/db/schema/predios";
import { userPredios } from "@/src/db/schema/users";
import { eq, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const session = await withAuth();
    const { id: userIdStr, rol, orgId, predios: prediosPermitidos } = session.user;

    const tieneAccesoTotal = rol === "superadmin" || rol === "admin_org";

    let rows;
    if (tieneAccesoTotal) {
      rows = await db
        .select({ id: predios.id, nombre: predios.nombre })
        .from(predios)
        .where(eq(predios.orgId, orgId));
    } else {
      rows = await db
        .select({ id: predios.id, nombre: predios.nombre })
        .from(predios)
        .where(inArray(predios.id, prediosPermitidos));
    }

    return NextResponse.json(rows);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
