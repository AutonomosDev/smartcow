import { db } from "@/src/db/client";
import { animales, razas } from "@/src/db/schema/index";
import { eq, and } from "drizzle-orm";

export async function get_animales(predioId: number, filtros?: { estado?: any, sexo?: any, modulo?: any, razaId?: number }) {
  try {
    const conditions = [eq(animales.predioId, predioId)];
    if (filtros?.estado) conditions.push(eq(animales.estado, filtros.estado));
    if (filtros?.sexo) conditions.push(eq(animales.sexo, filtros.sexo));
    if (filtros?.modulo) conditions.push(eq(animales.moduloActual, filtros.modulo));
    if (filtros?.razaId) conditions.push(eq(animales.razaId, filtros.razaId));

    const result = await db.select({
        id: animales.id,
        diio: animales.diio,
        estado: animales.estado,
        sexo: animales.sexo,
        modulo: animales.moduloActual,
        raza: razas.nombre,
      })
      .from(animales)
      .leftJoin(razas, eq(animales.razaId, razas.id))
      .where(and(...conditions))
      .limit(100);

    return { ok: true, data: { items: result, total: result.length } };
  } catch (error: any) {
    return { ok: false, data: null, error: error.message };
  }
}
