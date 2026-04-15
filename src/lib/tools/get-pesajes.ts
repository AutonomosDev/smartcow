import { db } from "@/db/client";
import { pesajes, animales } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export async function get_pesajes(args: { animalId?: number; predioId?: number; periodo?: { desde: string; hasta: string } }) {
  try {
    const conditions = [];
    if (args.animalId) conditions.push(eq(pesajes.animalId, args.animalId));
    if (args.predioId) conditions.push(eq(pesajes.predioId, args.predioId));
    if (args.periodo?.desde) conditions.push(gte(pesajes.fecha, args.periodo.desde));
    if (args.periodo?.hasta) conditions.push(lte(pesajes.fecha, args.periodo.hasta));

    const data = await db
      .select({
        id: pesajes.id,
        pesoKg: pesajes.pesoKg,
        fecha: pesajes.fecha,
        diio: animales.diio,
      })
      .from(pesajes)
      .innerJoin(animales, eq(pesajes.animalId, animales.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(100);

    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, data: null, error: error.message };
  }
}
