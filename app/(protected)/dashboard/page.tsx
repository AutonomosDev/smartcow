import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import {
  getPredioKpisFiltered,
  getRecentActivity,
  getPrediosConAnimales,
  getCategoriasPorPredio,
  type PredioKpis,
  type RecentEvent,
  type PredioConAnimales,
  type CategoriaConAnimales,
} from "@/src/lib/queries/predio";
import { db } from "@/src/db/client";
import { estadoReproductivo } from "@/src/db/schema/index";
import { eq } from "drizzle-orm";
import { DesktopView, MobileView } from "@/src/components/dashboard/dashboard-views";

interface PageProps {
  searchParams: Promise<{
    predioId?: string;
    categoriaId?: string;
    estado?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || !session.user) redirect("/login");

  const { nombre, predios: predioIds } = session.user;
  const params = await searchParams;

  // Predios del usuario ordenados por total de animales DESC
  const prediosConAnimales = await getPrediosConAnimales(predioIds);

  // Default: predio con más animales
  const defaultPredioId = prediosConAnimales[0]?.id ?? predioIds[0] ?? 0;
  const predioId = params.predioId ? Number(params.predioId) : defaultPredioId;

  // Categorías disponibles para el predio seleccionado
  const categorias = await getCategoriasPorPredio(predioId);

  // Resolver estadoReproductivoId desde params
  const categoriaId = params.categoriaId ? Number(params.categoriaId) : undefined;
  let estadoReproductivoId: number | undefined;
  if (params.estado && params.estado !== "") {
    const erRow = await db
      .select({ id: estadoReproductivo.id })
      .from(estadoReproductivo)
      .where(eq(estadoReproductivo.nombre, params.estado))
      .limit(1);
    estadoReproductivoId = erRow[0]?.id;
  }

  const [kpis, recentActivity] = await Promise.all([
    getPredioKpisFiltered(predioId, categoriaId, estadoReproductivoId),
    getRecentActivity(predioId),
  ]);

  const predioActual = prediosConAnimales.find((p) => p.id === predioId);

  return (
    <>
      <div className="hidden md:block">
        <DesktopView
          nombre={nombre}
          kpis={kpis}
          nombrePredio={predioActual?.nombre ?? null}
          recentActivity={recentActivity}
          predios={prediosConAnimales}
          categorias={categorias}
          currentPredioId={predioId}
          currentCategoriaId={params.categoriaId ?? ""}
          currentEstado={params.estado ?? ""}
        />
      </div>
      <div className="block md:hidden">
        <MobileView
          nombre={nombre}
          kpis={kpis}
          nombrePredio={predioActual?.nombre ?? null}
          recentActivity={recentActivity}
          predios={prediosConAnimales}
          categorias={categorias}
          currentPredioId={predioId}
          currentCategoriaId={params.categoriaId ?? ""}
          currentEstado={params.estado ?? ""}
        />
      </div>
    </>
  );
}
