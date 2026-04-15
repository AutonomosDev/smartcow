import { db } from "@/src/db/client";
import { bajas, animales, bajaMotivo, bajaCausa } from "@/src/db/schema/index";
import { eq, and, sql, gte, lte } from "drizzle-orm";

export async function get_bajas(predioId: number, periodo?: { desde: string; hasta: string }) {
  try {
    const conditions = [eq(bajas.predioId, predioId)];
    if (periodo?.desde) conditions.push(gte(bajas.fecha, periodo.desde));
    if (periodo?.hasta) conditions.push(lte(bajas.fecha, periodo.hasta));

    const result = await db
      .select({
        motivo: bajaMotivo.nombre,
        causa: bajaCausa.nombre,
        total: sql<number>`count(*)::int`,
      })
      .from(bajas)
      .innerJoin(bajaMotivo, eq(bajas.motivoId, bajaMotivo.id))
      .leftJoin(bajaCausa, eq(bajas.causaId, bajaCausa.id))
      .where(and(...conditions))
      .groupBy(bajaMotivo.nombre, bajaCausa.nombre);
    
    const [{ totalActivos }] = await db.select({ totalActivos: sql<number>`count(*)::int` })
      .from(animales)
      .where(and(eq(animales.predioId, predioId), eq(animales.estado, 'activo')));

    const totalBajas = result.reduce((acc, curr) => acc + curr.total, 0);
    const mortalidad_pct = totalActivos > 0 ? (totalBajas / (totalActivos + totalBajas)) * 100 : 0;

    return { 
        ok: true, 
        data: {
            total: totalBajas,
            mortalidad_pct,
            detalle: result
        } 
    };
  } catch (error: any) {
    return { ok: false, data: null, error: error.message };
  }
}
