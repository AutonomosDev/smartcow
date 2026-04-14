import { db } from "@/src/db/client";
import {
  animales,
  pesajes,
  partos,
  inseminaciones,
  ecografias,
  areteos,
  tipoGanado,
  razas,
} from "@/src/db/schema/index";
import { eq, and, desc, inArray } from "drizzle-orm";

// ─────────────────────────────────────────────
// TIPOS PÚBLICOS
// ─────────────────────────────────────────────

export interface AnimalDetalle {
  id: number;
  diio: string;
  eid: string | null;
  tipoGanado: string;
  raza: string | null;
  sexo: "M" | "H";
  fechaNacimiento: string | null;
  estado: "activo" | "baja" | "desecho";
}

export interface HistorialEvento {
  tipo: string;
  fecha: string;
  descripcion: string;
  detalle: Record<string, unknown>;
}

export interface AnimalHistorial {
  eventos: HistorialEvento[];
}

// ─────────────────────────────────────────────
// IMPLEMENTACIONES
// ─────────────────────────────────────────────

/**
 * Busca un animal por DIIO dentro de los predios del usuario.
 * Retorna null si no existe o no pertenece a ningún predio autorizado.
 */
export async function getAnimalByDiio(
  diio: string,
  predioIds: number[]
): Promise<AnimalDetalle | null> {
  if (predioIds.length === 0) return null;

  const rows = await db
    .select({
      id: animales.id,
      diio: animales.diio,
      eid: animales.eid,
      tipoGanado: tipoGanado.nombre,
      raza: razas.nombre,
      sexo: animales.sexo,
      fechaNacimiento: animales.fechaNacimiento,
      estado: animales.estado,
    })
    .from(animales)
    .leftJoin(tipoGanado, eq(animales.tipoGanadoId, tipoGanado.id))
    .leftJoin(razas, eq(animales.razaId, razas.id))
    .where(and(eq(animales.diio, diio), inArray(animales.predioId, predioIds)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    diio: row.diio,
    eid: row.eid ?? null,
    tipoGanado: row.tipoGanado ?? "—",
    raza: row.raza ?? null,
    sexo: row.sexo,
    fechaNacimiento: row.fechaNacimiento ?? null,
    estado: row.estado,
  };
}

/**
 * Historial completo de eventos de un animal.
 * Incluye pesajes, partos, inseminaciones, ecografías y areteos.
 * Ordenados por fecha DESC.
 */
export async function getAnimalHistorial(animalId: number): Promise<AnimalHistorial> {
  const [pesajesRows, partosRows, inseminacionesRows, ecografiasRows, areteosRows] =
    await Promise.all([
      db
        .select({ fecha: pesajes.fecha, pesoKg: pesajes.pesoKg })
        .from(pesajes)
        .where(eq(pesajes.animalId, animalId))
        .orderBy(desc(pesajes.fecha)),

      db
        .select({ fecha: partos.fecha, resultado: partos.resultado, observaciones: partos.observaciones })
        .from(partos)
        .where(eq(partos.madreId, animalId))
        .orderBy(desc(partos.fecha)),

      db
        .select({ fecha: inseminaciones.fecha, resultado: inseminaciones.resultado, observaciones: inseminaciones.observaciones })
        .from(inseminaciones)
        .where(eq(inseminaciones.animalId, animalId))
        .orderBy(desc(inseminaciones.fecha)),

      db
        .select({ fecha: ecografias.fecha, resultado: ecografias.resultado, diasGestacion: ecografias.diasGestacion, observaciones: ecografias.observaciones })
        .from(ecografias)
        .where(eq(ecografias.animalId, animalId))
        .orderBy(desc(ecografias.fecha)),

      db
        .select({ fecha: areteos.fecha, tipo: areteos.tipo, diioNuevo: areteos.diioNuevo, diioAnterior: areteos.diioAnterior })
        .from(areteos)
        .where(eq(areteos.animalId, animalId))
        .orderBy(desc(areteos.fecha)),
    ]);

  const eventos: HistorialEvento[] = [
    ...pesajesRows.map((p) => ({
      tipo: "pesaje",
      fecha: p.fecha,
      descripcion: `Pesaje · ${Number(p.pesoKg).toFixed(1)} kg`,
      detalle: { pesoKg: Number(p.pesoKg) },
    })),
    ...partosRows.map((p) => ({
      tipo: "parto",
      fecha: p.fecha,
      descripcion: `Parto · ${p.resultado}`,
      detalle: { resultado: p.resultado, observaciones: p.observaciones ?? null },
    })),
    ...inseminacionesRows.map((i) => ({
      tipo: "inseminacion",
      fecha: i.fecha,
      descripcion: `Inseminación · ${i.resultado}`,
      detalle: { resultado: i.resultado, observaciones: i.observaciones ?? null },
    })),
    ...ecografiasRows.map((e) => ({
      tipo: "ecografia",
      fecha: e.fecha,
      descripcion: `Ecografía · ${e.resultado}`,
      detalle: {
        resultado: e.resultado,
        diasGestacion: e.diasGestacion ?? null,
        observaciones: e.observaciones ?? null,
      },
    })),
    ...areteosRows.map((a) => ({
      tipo: "areteo",
      fecha: a.fecha,
      descripcion: `Areteo · ${a.tipo}`,
      detalle: {
        tipo: a.tipo,
        diioNuevo: a.diioNuevo,
        diioAnterior: a.diioAnterior ?? null,
      },
    })),
  ];

  eventos.sort((a, b) => {
    if (b.fecha > a.fecha) return 1;
    if (b.fecha < a.fecha) return -1;
    return 0;
  });

  return { eventos };
}
