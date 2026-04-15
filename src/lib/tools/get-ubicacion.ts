import { db } from "@/src/db/client";
import { movimientosPotrero, potreros, animales } from "@/src/db/schema/index";
import { eq, isNull, and } from "drizzle-orm";

export async function get_ubicacion_animales(predioId: number) {
  try {
    const data = await db
      .select({
        potreroId: potreros.id,
        potrero: potreros.nombre,
        hectareas: potreros.hectareas,
        diio: animales.diio,
        animalId: animales.id
      })
      .from(movimientosPotrero)
      .innerJoin(potreros, eq(movimientosPotrero.potreroId, potreros.id))
      .innerJoin(animales, eq(movimientosPotrero.animalId, animales.id))
      .where(and(
          eq(potreros.predioId, predioId),
          isNull(movimientosPotrero.fechaSalida)
      ));

    const agrupado: Record<string, { count: number; animales: string[] }> = {};
    for (const row of data) {
        if (!agrupado[row.potrero]) {
            agrupado[row.potrero] = { count: 0, animales: [] };
        }
        agrupado[row.potrero].count++;
        agrupado[row.potrero].animales.push(row.diio);
    }

    return { ok: true, data: agrupado };
  } catch (error: any) {
    return { ok: false, data: null, error: error.message };
  }
}
