import { NextRequest } from "next/server";
import { withAuthBearer, AuthError } from "@/src/lib/with-auth";
import { db } from "@/src/db/client";
import { inseminaciones, partos } from "@/src/db/schema/index";
import { eq, and, gte } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const predioId = Number(id);

  if (!Number.isInteger(predioId) || predioId <= 0) {
    return Response.json({ error: "ID de predio inválido" }, { status: 400 });
  }

  try {
    await withAuthBearer(req, { predioId });
  } catch (err) {
    if (err instanceof AuthError) {
      return Response.json(
        { error: err.message },
        { status: err.code === "UNAUTHENTICATED" ? 401 : 403 }
      );
    }
    return Response.json({ error: "Error de autenticación" }, { status: 401 });
  }

  const periodoMeses = 12;
  const fechaDesde = new Date();
  fechaDesde.setMonth(fechaDesde.getMonth() - periodoMeses);
  const fechaDesdeStr = fechaDesde.toISOString().slice(0, 10);

  const [inseminacionesRows, partosRows] = await Promise.all([
    db
      .select({ resultado: inseminaciones.resultado })
      .from(inseminaciones)
      .where(
        and(
          eq(inseminaciones.predioId, predioId),
          gte(inseminaciones.fecha, fechaDesdeStr)
        )
      ),

    db
      .select({ id: partos.id })
      .from(partos)
      .where(
        and(
          eq(partos.predioId, predioId),
          gte(partos.fecha, fechaDesdeStr)
        )
      ),
  ]);

  const totalInseminaciones = inseminacionesRows.length;
  const totalPreñadas = inseminacionesRows.filter((i) => i.resultado === "preñada").length;
  const totalPartos = partosRows.length;

  const tasaPreñez =
    totalInseminaciones > 0
      ? Math.round((totalPreñadas / totalInseminaciones) * 1000) / 10
      : null;

  const tasaPartos =
    totalInseminaciones > 0
      ? Math.round((totalPartos / totalInseminaciones) * 1000) / 10
      : null;

  return Response.json({
    tasaPreñez,
    totalInseminaciones,
    totalPreñadas,
    totalPartos,
    tasaPartos,
    periodoMeses,
  });
}
