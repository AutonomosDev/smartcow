/**
 * app/(protected)/chat/page.tsx
 *
 * AUT-288: el chat opera sobre todos los predios del scope del usuario.
 * Al entrar, server-fetch del resumen del primer predio para abrir un artifact
 * "dashboard" en el panel derecho (contexto inmediato, no chat vacío).
 */

import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { ChatPageClient } from "./chat-page-client";
import {
  getNombrePredio,
  getPredioKpis,
  getLotesActivos,
  getRecentActivity,
} from "@/src/lib/queries/predio";
import type { DashboardData } from "@/src/components/chat/artifacts/dashboard-artifact";

export const metadata = {
  title: "Chat IA — smartCow",
};

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

  const predioId = Array.isArray(session.user.predios)
    ? (session.user.predios[0] as number | undefined)
    : undefined;

  let initialDashboard: DashboardData | null = null;
  if (predioId) {
    try {
      const [predioNombre, kpis, lotes, actividad] = await Promise.all([
        getNombrePredio(predioId),
        getPredioKpis(predioId),
        getLotesActivos(predioId),
        getRecentActivity(predioId, 5),
      ]);
      if (predioNombre) {
        initialDashboard = {
          predioId,
          predioNombre,
          kpis: {
            totalAnimales: kpis.totalAnimales,
            lotesActivos: lotes.length,
            totalPesajes: kpis.totalPesajes,
            totalPartos: kpis.totalPartos,
            totalEcografias: kpis.totalEcografias,
          },
          ultimoPesaje: kpis.ultimoPesaje,
          actividad: actividad.map((a) => ({
            type: a.type,
            fecha: a.fecha,
            descripcion: a.descripcion,
          })),
        };
      }
    } catch {
      // Fallo en queries del dashboard: seguimos sin artifact inicial.
    }
  }

  return (
    <ChatPageClient
      initialMessage={initialMessage}
      session={session}
      initialDashboard={initialDashboard}
    />
  );
}
