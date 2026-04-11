import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getPredioKpis, getNombrePredio, getRecentActivity } from "@/src/lib/queries/predio";
import { DesktopView, MobileView } from "@/src/components/dashboard/dashboard-views";

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const { nombre, predios } = session.user;
  const predioId = predios[0] ?? 0;
  const [kpis, nombrePredio, recentActivity] = await Promise.all([
    getPredioKpis(predioId),
    getNombrePredio(predioId),
    getRecentActivity(predioId),
  ]);

  return (
    <>
      <div className="hidden md:block">
        <DesktopView nombre={nombre} kpis={kpis} nombrePredio={nombrePredio} recentActivity={recentActivity} />
      </div>
      <div className="block md:hidden">
        <MobileView nombre={nombre} kpis={kpis} nombrePredio={nombrePredio} recentActivity={recentActivity} />
      </div>
    </>
  );
}
