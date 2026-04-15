import { db } from "@/src/db/client";
import { lotes, loteAnimales, pesajes } from "@/src/db/schema/index";
import { eq, sql, and, gte, lte } from "drizzle-orm";

export async function get_gdp(loteId: number, periodo?: { desde: string; hasta: string }) {
  try {
    const data = await db.execute(sql`
      WITH ultimos_pesajes AS (
        SELECT animal_id, peso_kg as peso_actual, fecha as fecha_ultimo_pesaje,
               ROW_NUMBER() OVER(PARTITION BY animal_id ORDER BY fecha DESC) as rn
        FROM pesajes
      )
      SELECT 
        la.lote_id,
        AVG((up.peso_actual - la.peso_entrada_kg) / 
            NULLIF(EXTRACT(EPOCH FROM (COALESCE(up.fecha_ultimo_pesaje, CURRENT_DATE) - la.fecha_entrada)) / 86400, 0)
        ) as gdp_promedio,
        AVG(up.peso_actual) as peso_promedio_actual,
        AVG(EXTRACT(EPOCH FROM (CURRENT_DATE - la.fecha_entrada)) / 86400) as dias_en_lote
      FROM lote_animales la
      JOIN ultimos_pesajes up ON la.animal_id = up.animal_id AND up.rn = 1
      WHERE la.lote_id = ${loteId} AND la.fecha_salida IS NULL
      GROUP BY la.lote_id
    `);

    return { ok: true, data: data.rows[0] || null };
  } catch (error: any) {
    return { ok: false, data: null, error: error.message };
  }
}
