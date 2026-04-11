/**
 * app/(protected)/conocimiento/page.tsx
 * Base de Conocimiento — documentos y manuales que alimentan el contexto de SmartCow IA.
 */

import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getNombrePredio } from "@/src/lib/queries/predio";
import { ChatSidebar } from "@/src/components/chat/chat-sidebar";
import { BookOpen, FileText, Upload, Sparkles } from "lucide-react";

export const metadata = { title: "Base de Conocimiento — SmartCow" };

const DOC_TYPES = [
  { label: "Manuales de manejo ganadero", icon: FileText, desc: "Protocolos sanitarios, planes de alimentación" },
  { label: "Historial veterinario", icon: FileText, desc: "Registros médicos y tratamientos previos" },
  { label: "Normativas y reglamentos", icon: FileText, desc: "SAG, trazabilidad bovina, exportación" },
];

export default async function ConocimientoPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const predioId = session.user.predios[0] ?? 0;
  const nombrePredio = await getNombrePredio(predioId);

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
              <BookOpen size={16} className="text-brand-dark" />
            </div>
            <div>
              <h1 className="text-gray-900 text-sm font-semibold">Base de Conocimiento</h1>
              <p className="text-gray-400 text-xs">Documentos que alimentan el contexto de SmartCow IA</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 border border-gray-200 rounded-full px-3 py-1">
            Próximamente
          </span>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Cómo funciona */}
          <div className="bg-brand-dark rounded-2xl p-6 mb-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-light/20 flex items-center justify-center flex-shrink-0">
              <Sparkles size={18} className="text-brand-light" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm mb-1">Cómo funciona</h2>
              <p className="text-white/60 text-xs leading-relaxed">
                Los documentos cargados aquí son procesados y fragmentados para enriquecer las respuestas del asistente IA. SmartCow podrá citar secciones específicas de tus manuales al responder consultas sobre manejo ganadero.
              </p>
            </div>
          </div>

          {/* Tipos de documentos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {DOC_TYPES.map((t) => (
              <div key={t.label} className="bg-white rounded-2xl border border-gray-100 p-5 opacity-60">
                <t.icon size={20} className="text-brand-dark mb-3" />
                <h3 className="text-gray-800 font-semibold text-sm mb-1">{t.label}</h3>
                <p className="text-gray-400 text-xs">{t.desc}</p>
              </div>
            ))}
          </div>

          {/* Upload zone (placeholder) */}
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 flex flex-col items-center justify-center gap-3 opacity-50 cursor-not-allowed">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
              <Upload size={22} className="text-gray-400" />
            </div>
            <p className="text-gray-600 font-semibold text-sm">Arrastra PDFs aquí o haz click para subir</p>
            <p className="text-gray-400 text-xs">PDF, DOCX · Máx 20 MB por archivo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
