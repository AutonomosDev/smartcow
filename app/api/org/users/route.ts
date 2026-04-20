import { NextResponse } from "next/server";
import { withAuth } from "@/src/lib/with-auth";
import { AuthError } from "@/src/lib/with-auth";
import { db } from "@/src/db/client";
import { users } from "@/src/db/schema/users";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await withAuth();
    const { orgId } = session.user;

    const rows = await db
      .select({ id: users.id, nombre: users.nombre, email: users.email })
      .from(users)
      .where(eq(users.orgId, orgId));

    return NextResponse.json(rows);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
