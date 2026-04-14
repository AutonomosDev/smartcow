import { NextRequest } from "next/server";
import { withAuthBearer, AuthError } from "@/src/lib/with-auth";
import { getPotrerosConAnimales } from "@/src/lib/queries/predio";

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

  const potreros = await getPotrerosConAnimales(predioId);
  return Response.json(potreros);
}
