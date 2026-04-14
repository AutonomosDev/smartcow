import { NextRequest } from "next/server";
import { withAuthBearer, AuthError } from "@/src/lib/with-auth";
import { getLotePesajesSeries } from "@/src/lib/queries/predio";
import { db } from "@/src/db/client";
import { lotes } from "@/src/db/schema/index";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const loteId = Number(id);

  if (!Number.isInteger(loteId) || loteId <= 0) {
    return Response.json({ error: "ID de lote inválido" }, { status: 400 });
  }

  // Resolver el predio del lote para validar acceso
  const loteRows = await db
    .select({ predioId: lotes.predioId })
    .from(lotes)
    .where(eq(lotes.id, loteId))
    .limit(1);

  if (!loteRows[0]) {
    return Response.json({ error: "Lote no encontrado" }, { status: 404 });
  }

  const predioId = loteRows[0].predioId;

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

  const result = await getLotePesajesSeries(loteId, predioId);
  return Response.json(result);
}
