/**
 * app/(protected)/chat/page.tsx
 *
 * AUT-288: el chat opera sobre todos los predios del scope del usuario.
 * Si el usuario tiene >1 predio, abre un artifact "dashboard" consolidado
 * (totales de toda la operación + breakdown por predio). Con 1 predio,
 * vista individual.
 */

import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { ChatPageClient } from "./chat-page-client";
import { getDistribucionPredios } from "@/src/lib/queries/predio";
import { db } from "@/src/db/client";
import { predios } from "@/src/db/schema/index";
import { inArray, or, ilike, and } from "drizzle-orm";
import type { DashboardData } from "@/src/components/chat/artifacts/dashboard-artifact";

export const metadata = {
  title: "Chat IA — smartCow",
};

export const dynamic = "force-dynamic";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const initialMessage = params.q;

  const predioIds = Array.isArray(session.user.predios) ? session.user.predios : [];

  let initialDashboard: DashboardData | null = null;
  try {
    if (predioIds.length > 0) {
      const targets = await db
        .select({ id: predios.id, nombre: predios.nombre })
        .from(predios)
        .where(
          and(
            inArray(predios.id, predioIds),
            or(
              ilike(predios.nombre, "san pedro%"),
              ilike(predios.nombre, "recr%feedlot%"),
              ilike(predios.nombre, "recr%ft%"),
              ilike(predios.nombre, "mollendo%"),
              ilike(predios.nombre, "medieria ft%")
            )
          )
        );

      // Orden operacional: cría → recría → engorda → medierías
      const order = ["san pedro", "recría feedlot", "recría ft", "mollendo", "medieria ft"];
      const sorted = targets.sort((a, b) => {
        const ra = order.findIndex((k) => a.nombre.toLowerCase().startsWith(k));
        const rb = order.findIndex((k) => b.nombre.toLowerCase().startsWith(k));
        return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
      });

      const distribuciones = await getDistribucionPredios(sorted.map((p) => p.id));
      if (distribuciones.length > 0) {
        initialDashboard = { predios: distribuciones };
      }
    }
  } catch {
    // Fallo en query del dashboard: seguimos sin artifact inicial.
  }

  return (
    <ChatPageClient
      initialMessage={initialMessage}
      session={session}
      initialDashboard={initialDashboard}
    />
  );
}
