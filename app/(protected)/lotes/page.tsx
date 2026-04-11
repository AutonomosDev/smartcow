/**
 * app/(protected)/lotes/page.tsx
 * Lista de lotes activos del predio con métricas de engorda.
 */

import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getLotesActivos, getNombrePredio } from "@/src/lib/queries/predio";
import { ChatSidebar } from "@/src/components/chat/chat-sidebar";
import { GitCompare, CalendarDays, Target } from "lucide-react";

export const metadata = { title: "Lotes — SmartCow" };

export default async function LotesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const predioId = session.user.predios[0] ?? 0;
  const [lotes, nombrePredio] = await Promise.all([
    getLotesActivos(predioId),
    getNombrePredio(predioId),
  ]);

  return (
    <div className="hidden md:flex h-screen overflow-hidden bg-[#F4F6F5]">
      <ChatSidebar
        orgName={nombrePredio}
        userName={session.user.nombre}
        userEmail={session.user.email}
      />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-light/15 flex items-center justify-center">
              <GitCompare size={16} className="text-brand-dark" />
            </div>
            <div>
              <h1 className="text-gray-900 text-sm font-semibold">Lotes</h1>
              <p className="text-gray-400 text-xs">{nombrePredio ?? "Predio"} · {lotes.length} activos</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {lotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-light/10 flex items-center justify-center">
                <GitCompare size={24} className="text-brand-dark/40" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Sin lotes activos</p>
              <p className="text-gray-400 text-xs">Los lotes de engorda activos aparecerán aquí.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {lotes.map((lote) => (
                <div key={lote.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-gray-900 font-semibold text-base">{lote.nombre}</h3>
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-light/15 text-brand-dark">
                        {lote.estado}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-brand-dark">{lote.totalAnimales}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">animales</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-gray-50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <CalendarDays size={12} />
                        Entrada
                      </span>
                      <span className="text-gray-700 font-medium">{lote.fechaEntrada}</span>
                    </div>
                    {lote.fechaSalidaEstimada && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Salida est.</span>
                        <span className="text-gray-700 font-medium">{lote.fechaSalidaEstimada}</span>
                      </div>
                    )}
                    {lote.objetivoPesoKg && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-gray-400">
                          <Target size={12} />
                          Obj. peso
                        </span>
                        <span className="text-gray-700 font-medium">{lote.objetivoPesoKg} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
