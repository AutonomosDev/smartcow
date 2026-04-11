/**
 * app/(protected)/animales/page.tsx
 * Registro maestro de animales del hato.
 * Muestra los animales activos del predio con tipo, raza, sexo y módulo.
 */

import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getAnimales, getNombrePredio } from "@/src/lib/queries/predio";
import { ChatSidebar } from "@/src/components/chat/chat-sidebar";
import { Layers } from "lucide-react";

export const metadata = { title: "Animales — SmartCow" };

const SEXO_LABEL: Record<string, string> = { M: "Macho", H: "Hembra" };
const MODULO_LABEL: Record<string, string> = {
  feedlot: "Feedlot",
  crianza: "Crianza",
  ambos: "Ambos",
};

export default async function AnimalesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const predioId = session.user.predios[0] ?? 0;
  const [animales, nombrePredio] = await Promise.all([
    getAnimales(predioId),
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
              <Layers size={16} className="text-brand-dark" />
            </div>
            <div>
              <h1 className="text-gray-900 text-sm font-semibold">Animales</h1>
              <p className="text-gray-400 text-xs">{nombrePredio ?? "Predio"} · {animales.length} activos</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {animales.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-light/10 flex items-center justify-center">
                <Layers size={24} className="text-brand-dark/40" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Sin animales registrados</p>
              <p className="text-gray-400 text-xs">Los animales importados desde AgroApp aparecerán aquí.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">DIIO</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Raza</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Sexo</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Nac.</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Módulo</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">EID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {animales.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-brand-dark">{a.diio}</td>
                      <td className="px-5 py-3 text-gray-700">{a.tipoGanado}</td>
                      <td className="px-5 py-3 text-gray-500">{a.raza ?? "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          a.sexo === "M"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-pink-50 text-pink-700"
                        }`}>
                          {SEXO_LABEL[a.sexo] ?? a.sexo}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{a.fechaNacimiento ?? "—"}</td>
                      <td className="px-5 py-3">
                        {a.moduloActual ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-light/15 text-brand-dark">
                            {MODULO_LABEL[a.moduloActual]}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-400">{a.eid ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
