import { db } from "@/src/db/client";
import { lotes, loteAnimales } from "@/src/db/schema/index";
import { eq, sql } from "drizzle-orm";

export async function get_lotes(predioId: number) {
  try {
    const data = await db
      .select({
        id: lotes.id,
        nombre: lotes.nombre,
        fechaEntrada: lotes.fechaEntrada,
        objetivoPesoKg: lotes.objetivoPesoKg,
        estado: lotes.estado,
        fechaSalidaEstimada: lotes.fechaSalidaEstimada,
        total_animales: sql<number>`count(${loteAnimales.animalId})::int`,
      })
      .from(lotes)
      .leftJoin(loteAnimales, eq(lotes.id, loteAnimales.loteId))
      .where(eq(lotes.predioId, predioId))
      .groupBy(lotes.id);

    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, data: null, error: error.message };
  }
}
