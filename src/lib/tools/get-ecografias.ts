import { db } from "@/src/db/client";
import { ecografias } from "@/src/db/schema/index";
import { eq } from "drizzle-orm";

export async function get_ecografias(predioId: number) {
  try {
    const data = await db
      .select({
        resultado: ecografias.resultado,
        diasGestacion: ecografias.diasGestacion,
      })
      .from(ecografias)
      .where(eq(ecografias.predioId, predioId));

    let prenadas = 0;
    let vacias = 0;
    let partos_30d = 0;
    let partos_60d = 0;
    let partos_90d = 0;

    data.forEach(e => {
        if (e.resultado === 'preñada') {
            prenadas++;
            if (e.diasGestacion) {
                const diasRestantes = 283 - e.diasGestacion;
                if (diasRestantes <= 30) partos_30d++;
                else if (diasRestantes <= 60) partos_60d++;
                else if (diasRestantes <= 90) partos_90d++;
            }
        }
        if (e.resultado === 'vacia') vacias++;
    });

    return { 
        ok: true, 
        data: {
            prenadas,
            vacias,
            proximos_partos: {
                dias_30: partos_30d,
                dias_60: partos_60d,
                dias_90: partos_90d
            }
        } 
    };
  } catch (error: any) {
    return { ok: false, data: null, error: error.message };
  }
}
