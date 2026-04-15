import { db } from "@/db/client";
import { animales, razas, tipoGanado } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function get_animal(diio: string) {
  try {
    const [data] = await db
      .select({
        diio: animales.diio,
        sexo: animales.sexo,
        raza: razas.nombre,
        tipoGanado: tipoGanado.nombre,
        fechaNacimiento: animales.fechaNacimiento,
        estado: animales.estado,
        modulo: animales.moduloActual,
        tipoPropiedad: animales.tipoPropiedad,
        observaciones: animales.observaciones,
      })
      .from(animales)
      .leftJoin(razas, eq(animales.razaId, razas.id))
      .innerJoin(tipoGanado, eq(animales.tipoGanadoId, tipoGanado.id))
      .where(eq(animales.diio, diio))
      .limit(1);

    return { ok: true, data: data || null };
  } catch (error: any) {
    return { ok: false, data: null, error: error.message };
  }
}
