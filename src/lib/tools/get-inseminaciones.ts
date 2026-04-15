import { db } from "@/src/db/client";
import { inseminaciones } from "@/src/db/schema/index";
import { eq, and, sql, gte, lte } from "drizzle-orm";

export async function get_inseminaciones(predioId: number, periodo?: { desde: string; hasta: string }) {
  try {
    const conditions = [eq(inseminaciones.predioId, predioId)];
    if (periodo?.desde) conditions.push(gte(inseminaciones.fecha, periodo.desde));
    if (periodo?.hasta) conditions.push(lte(inseminaciones.fecha, periodo.hasta));

    const data = await db
      .select({
        resultado: inseminaciones.resultado,
        total: sql<number>`count(*)::int`,
      })
      .from(inseminaciones)
      .where(and(...conditions))
      .groupBy(inseminaciones.resultado);

    const resultMetrics = {
       total: 0,
       prenadas: 0,
       vacias: 0,
       pendientes: 0,
       tasa_prenez: 0
    };

    data.forEach(r => {
      resultMetrics.total += r.total;
      if (r.resultado === 'preñada') resultMetrics.prenadas += r.total;
      if (r.resultado === 'vacia') resultMetrics.vacias += r.total;
      if (r.resultado === 'pendiente') resultMetrics.pendientes += r.total;
    });
    
    const confirmadas = resultMetrics.prenadas + resultMetrics.vacias;
    if (confirmadas > 0) {
      resultMetrics.tasa_prenez = (resultMetrics.prenadas / confirmadas) * 100;
    }

    return { ok: true, data: resultMetrics };
  } catch (error: any) {
    return { ok: false, data: null, error: error.message };
  }
}
