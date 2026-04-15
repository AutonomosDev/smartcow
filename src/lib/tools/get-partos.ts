import { db } from "@/src/db/client";
import { partos } from "@/src/db/schema/index";
import { eq, and, sql, gte, lte } from "drizzle-orm";

export async function get_partos(predioId: number, periodo?: { desde: string; hasta: string }) {
  try {
    const conditions = [eq(partos.predioId, predioId)];
    if (periodo?.desde) conditions.push(gte(partos.fecha, periodo.desde));
    if (periodo?.hasta) conditions.push(lte(partos.fecha, periodo.hasta));

    const data = await db
      .select({
        resultado: partos.resultado,
        total: sql<number>`count(*)::int`,
      })
      .from(partos)
      .where(and(...conditions))
      .groupBy(partos.resultado);

    const resultMetrics = {
       total: 0,
       vivos: 0,
       muertos: 0,
       abortos: 0,
       tasa_paricion: 0
    };

    data.forEach(r => {
      resultMetrics.total += r.total;
      if (r.resultado === 'vivo') resultMetrics.vivos += r.total;
      if (r.resultado === 'muerto') resultMetrics.muertos += r.total;
      if (r.resultado === 'aborto') resultMetrics.abortos += r.total;
    });
    
    if (resultMetrics.total > 0) {
      resultMetrics.tasa_paricion = (resultMetrics.vivos / resultMetrics.total) * 100;
    }

    return { ok: true, data: resultMetrics };
  } catch (error: any) {
    return { ok: false, data: null, error: error.message };
  }
}
