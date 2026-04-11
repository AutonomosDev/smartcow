/**
 * src/components/chat/artifacts-sidebar.tsx
 * Sistema de Renderizado de Documentos e Insights (Generative UI).
 * Inspirado en Claude.ai "Artifacts".
 */

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Download, 
  Share2, 
  FileText, 
  ChevronRight, 
  User, 
  Activity, 
  Calendar,
  AlertCircle
} from "lucide-react";

export type ArtifactType = "animal_card" | "report" | "pesajes_history" | "notification";

export interface ArtifactData {
  id: string;
  type: ArtifactType;
  title: string;
  content: any;
}

interface ArtifactsSidebarProps {
  artifact: ArtifactData | null;
  onClose: () => void;
  isOpen: boolean;
}

export function ArtifactsSidebar({ artifact, onClose, isOpen }: ArtifactsSidebarProps) {
  if (!artifact) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white border-l border-gray-100 shadow-2xl z-50 flex flex-col font-inter"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                {artifact.type === "animal_card" ? <User size={20} /> : <FileText size={20} />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink-title leading-tight">{artifact.title}</h3>
                <p className="text-[10px] text-ink-meta uppercase tracking-wider font-bold mt-0.5">Vista de Documento</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                <Download size={18} />
              </button>
              <button 
                onClick={onClose}
                className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content (Renderers por tipo) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {artifact.type === "animal_card" && <AnimalCardRenderer data={artifact.content} />}
            {artifact.type === "report" && <ReportRenderer data={artifact.content} />}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-50 bg-gray-50/30">
            <button className="w-full bg-[#252525] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-gray-200 hover:bg-black transition-all">
              Continuar con SmartCow AI <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Sub-renderers ────────────────────────────────────────────────────────────

function AnimalCardRenderer({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* Hero Animal */}
      <div className="bg-[#252525] rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 inline-block">
          RP: {data.rp || "2034"}
        </span>
        <h2 className="text-3xl font-bold mb-1">{data.nombre || "Vaca Angus #34"}</h2>
        <p className="text-white/60 text-sm font-medium">Categoría: {data.categoria || "Vaca de Cría"}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
          <Activity size={18} className="text-blue-500 mb-2" />
          <p className="text-[10px] text-blue-600/60 uppercase font-bold tracking-wider">Último Peso</p>
          <p className="text-lg font-bold text-blue-700">{data.peso || "450"} kg</p>
        </div>
        <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50">
          <Calendar size={18} className="text-orange-500 mb-2" />
          <p className="text-[10px] text-orange-600/60 uppercase font-bold tracking-wider">Fecha Nacimiento</p>
          <p className="text-lg font-bold text-orange-700">{data.nacimiento || "12/05/2022"}</p>
        </div>
      </div>

      {/* Health Alerts */}
      <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex items-start gap-4">
         <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 flex-shrink-0 shadow-sm">
           <AlertCircle size={20} />
         </div>
         <div>
           <h4 className="text-sm font-bold text-red-900">Alerta de Sanidad</h4>
           <p className="text-xs text-red-700/80 mt-1 leading-relaxed">Requiere vacuna anticlostridial antes del 15 de Abril. Su curva de peso ha bajado un 2%.</p>
         </div>
      </div>
    </div>
  );
}

function ReportRenderer({ data }: { data: any }) {
  return (
    <div className="space-y-6 prose prose-slate max-w-none">
       <div className="border-l-4 border-blue-500 pl-6 py-2">
         <h4 className="text-lg font-bold text-ink-title">Reporte de Eficiencia Reproductiva</h4>
         <p className="text-sm text-ink-meta">Periodo: Marzo 2026</p>
       </div>
       <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
         <table className="w-full text-sm">
           <thead>
             <tr className="border-b border-gray-200">
               <th className="text-left pb-3 font-bold text-ink-title">Indicador</th>
               <th className="text-right pb-3 font-bold text-ink-title">Valor</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
             <tr>
               <td className="py-3 text-ink-body">Tasa de Preñez</td>
               <td className="py-3 text-right font-bold text-blue-600">85%</td>
             </tr>
             <tr>
               <td className="py-3 text-ink-body">Partos Distribuidos</td>
               <td className="py-3 text-right font-bold text-ink-title">12 animales</td>
             </tr>
             <tr>
               <td className="py-3 text-ink-body">Mermas</td>
               <td className="py-3 text-right font-bold text-red-500">2%</td>
             </tr>
           </tbody>
         </table>
       </div>
    </div>
  );
}
