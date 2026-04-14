import { NextRequest } from "next/server";
import { withAuthBearer, AuthError } from "@/src/lib/with-auth";
import { getAnimalByDiio, getAnimalHistorial } from "@/src/lib/queries/animales";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ diio: string }> }
) {
  const { diio } = await params;

  if (!diio || diio.trim() === "") {
    return Response.json({ error: "DIIO inválido" }, { status: 400 });
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

  const animal = await getAnimalByDiio(diio.trim(), session.user.predios);

  if (!animal) {
    return Response.json({ error: "Animal no encontrado" }, { status: 404 });
  }

  const historial = await getAnimalHistorial(animal.id);
  return Response.json(historial);
}
