/**
 * app/(protected)/reportes/page.tsx
 * Reportes PDF — snapshots de datos operativos del predio.
 */

import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getPredioKpis, getNombrePredio } from "@/src/lib/queries/predio";
import { ChatSidebar } from "@/src/components/chat/chat-sidebar";
import { FileSearch, Download, Layers, Weight, Baby, Stethoscope } from "lucide-react";

export const metadata = { title: "Reportes — SmartCow" };

export default async function ReportesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const predioId = session.user.predios[0] ?? 0;
  const [kpis, nombrePredio] = await Promise.all([
    getPredioKpis(predioId),
    getNombrePredio(predioId),
  ]);

  const reportes = [
    {
      id: "inventario",
      title: "Inventario de Animales",
      desc: "Listado completo con DIIO, tipo, raza y estado reproductivo.",
      icon: Layers,
      stat: `${kpis.totalAnimales} animales`,
      ready: false,
    },
    {
      id: "pesajes",
      title: "Historial de Pesajes",
      desc: "Evolución de peso por animal y por lote. Incluye GDP.",
      icon: Weight,
      stat: `${kpis.totalPesajes} registros`,
      ready: false,
    },
    {
      id: "partos",
      title: "Registro de Partos",
      desc: "Partos del predio con resultado, madre, cría y observaciones.",
      icon: Baby,
      stat: `${kpis.totalPartos} partos`,
      ready: false,
    },
    {
      id: "sanidad",
      title: "Controles Sanitarios",
      desc: "Ecografías, vacunaciones y eventos preventivos registrados.",
      icon: Stethoscope,
      stat: `${kpis.totalEcografias} ecografías`,
      ready: false,
    },
  ];

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
              <FileSearch size={16} className="text-brand-dark" />
            </div>
            <div>
              <h1 className="text-gray-900 text-sm font-semibold">Reportes PDF</h1>
              <p className="text-gray-400 text-xs">{nombrePredio ?? "Predio"} · Snapshots operativos</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 border border-gray-200 rounded-full px-3 py-1">
            Próximamente
          </span>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportes.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-light/10 flex items-center justify-center flex-shrink-0">
                      <r.icon size={17} className="text-brand-dark" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-semibold text-sm">{r.title}</h3>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{r.desc}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="text-xs text-gray-400 font-medium">{r.stat}</span>
                  <button
                    disabled
                    className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-100"
                  >
                    <Download size={12} />
                    Descargar PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
