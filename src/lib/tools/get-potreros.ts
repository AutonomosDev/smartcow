import { db } from "@/src/db/client";
import { potreros } from "@/src/db/schema/index";
import { eq } from "drizzle-orm";

export async function get_potreros(predioId: number) {
  try {
    const data = await db
      .select({
        nombre: potreros.nombre,
        hectareas: potreros.hectareas,
        capacidadAnimales: potreros.capacidadAnimales,
        tipo: potreros.tipo,
      })
      .from(potreros)
      .where(eq(potreros.predioId, predioId));

    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, data: null, error: error.message };
  }
}
