import { NextResponse } from "next/server";
import { withAuth } from "@/src/lib/with-auth";
import { AuthError } from "@/src/lib/with-auth";
import { db } from "@/src/db/client";
import { predios } from "@/src/db/schema/predios";
import { pesajes } from "@/src/db/schema/pesajes";
import { partos } from "@/src/db/schema/partos";
import { animales } from "@/src/db/schema/animales";
import { eq, inArray, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await withAuth();
    const { rol, orgId, predios: prediosPermitidos } = session.user;

    const tieneAccesoTotal = rol === "superadmin" || rol === "admin_org";

    // Todos los predios de la org (para "otros predios" en el dropdown)
    const todosPredios = tieneAccesoTotal
      ? await db.select({ id: predios.id, nombre: predios.nombre }).from(predios).where(eq(predios.orgId, orgId))
      : await db.select({ id: predios.id, nombre: predios.nombre }).from(predios).where(inArray(predios.id, prediosPermitidos));

    // Predios visibles en chips (máximo 4, resto van en "otros")
    const chipsIds = todosPredios.slice(0, 4).map((p) => p.id);
    const otrosPredios = todosPredios.slice(4);

    if (chipsIds.length === 0) {
      return NextResponse.json({ otros_predios: [], ultimos_pesajes: [], ultimos_partos: [] });
    }

    const [ultimosPesajes, ultimosPartos] = await Promise.all([
      db
        .select({
          id: pesajes.id,
          predioId: pesajes.predioId,
          fecha: pesajes.fecha,
          diio: animales.diio,
        })
        .from(pesajes)
        .leftJoin(animales, eq(pesajes.animalId, animales.id))
        .where(inArray(pesajes.predioId, chipsIds))
        .orderBy(desc(pesajes.fecha))
        .limit(5),
      db
        .select({
          id: partos.id,
          predioId: partos.predioId,
          fecha: partos.fecha,
          diio: animales.diio,
        })
        .from(partos)
        .leftJoin(animales, eq(partos.madreId, animales.id))
        .where(inArray(partos.predioId, chipsIds))
        .orderBy(desc(partos.fecha))
        .limit(5),
    ]);

    return NextResponse.json({
      otros_predios: otrosPredios,
      ultimos_pesajes: ultimosPesajes,
      ultimos_partos: ultimosPartos,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
