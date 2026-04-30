/**
 * app/api/mobile/animales/eid/[eid]/route.ts
 * GET /api/mobile/animales/eid/:eid
 *
 * Lookup de animal por EID (RFID) para flujo bastoneo.
 * Retorna animal + último pesaje + alertas operativas.
 *
 * Auth: Bearer JWT (mobile). Filtra por predios permitidos del user.
 */

import { NextRequest } from "next/server";
import { withAuthBearer, AuthError } from "@/src/lib/with-auth";
import { db } from "@/src/db/client";
import { animales, pesajes, predios, razas, tratamientos } from "@/src/db/schema/index";
import { and, desc, eq, gte, inArray } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eid: string }> }
) {
  const { eid: eidRaw } = await params;
  const eid = decodeURIComponent(eidRaw).trim();

  if (!eid) {
    return Response.json({ error: "EID requerido" }, { status: 400 });
  }

  let session;
  try {
    session = await withAuthBearer(req);
  } catch (err) {
    if (err instanceof AuthError) {
      return Response.json(
        { error: err.message },
        { status: err.code === "UNAUTHENTICATED" ? 401 : 403 }
      );
    }
    return Response.json({ error: "Error de autenticación" }, { status: 401 });
  }

  const prediosPermitidos = session.user.predios ?? [];
  if (prediosPermitidos.length === 0) {
    return Response.json({ error: "Sin predios asignados" }, { status: 403 });
  }

  const animalRows = await db
    .select({
      id: animales.id,
      diio: animales.diio,
      eid: animales.eid,
      sexo: animales.sexo,
      fechaNacimiento: animales.fechaNacimiento,
      estado: animales.estado,
      moduloActual: animales.moduloActual,
      predioId: animales.predioId,
      razaNombre: razas.nombre,
      predioNombre: predios.nombre,
    })
    .from(animales)
    .leftJoin(razas, eq(animales.razaId, razas.id))
    .leftJoin(predios, eq(animales.predioId, predios.id))
    .where(
      and(
        eq(animales.eid, eid),
        inArray(animales.predioId, prediosPermitidos)
      )
    )
    .limit(1);

  const animal = animalRows[0];
  if (!animal) {
    return Response.json(
      { found: false, eid, error: "Animal no encontrado o fuera de tus predios" },
      { status: 404 }
    );
  }

  const ultimoPesajeRows = await db
    .select({
      pesoKg: pesajes.pesoKg,
      fecha: pesajes.fecha,
    })
    .from(pesajes)
    .where(eq(pesajes.animalId, animal.id))
    .orderBy(desc(pesajes.fecha))
    .limit(1);

  const ultimoPesaje = ultimoPesajeRows[0] ?? null;

  const hoy = new Date().toISOString().slice(0, 10);
  const resguardoCarne = await db
    .select({
      id: tratamientos.id,
      diagnostico: tratamientos.diagnostico,
      liberacionCarneMax: tratamientos.liberacionCarneMax,
    })
    .from(tratamientos)
    .where(
      and(
        eq(tratamientos.animalId, animal.id),
        gte(tratamientos.liberacionCarneMax, hoy)
      )
    )
    .orderBy(desc(tratamientos.liberacionCarneMax))
    .limit(1);

  const alertas: Array<{ tipo: string; mensaje: string }> = [];
  if (animal.estado === "baja") {
    alertas.push({ tipo: "baja", mensaje: "Animal dado de baja" });
  }
  if (resguardoCarne.length > 0) {
    const r = resguardoCarne[0];
    alertas.push({
      tipo: "resguardo_carne",
      mensaje: `Resguardo carne hasta ${r.liberacionCarneMax}${r.diagnostico ? ` · ${r.diagnostico}` : ""}`,
    });
  }

  let edadMeses: number | null = null;
  if (animal.fechaNacimiento) {
    const nac = new Date(animal.fechaNacimiento);
    const ahora = new Date();
    edadMeses =
      (ahora.getFullYear() - nac.getFullYear()) * 12 +
      (ahora.getMonth() - nac.getMonth());
  }

  return Response.json({
    found: true,
    animal: {
      id: animal.id,
      diio: animal.diio,
      eid: animal.eid,
      sexo: animal.sexo,
      fechaNacimiento: animal.fechaNacimiento,
      edadMeses,
      estado: animal.estado,
      moduloActual: animal.moduloActual,
      raza: animal.razaNombre,
      predio: {
        id: animal.predioId,
        nombre: animal.predioNombre,
      },
    },
    ultimoPesaje: ultimoPesaje
      ? { pesoKg: Number(ultimoPesaje.pesoKg), fecha: ultimoPesaje.fecha }
      : null,
    alertas,
  });
}
