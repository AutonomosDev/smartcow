"use client";

import { Target } from "lucide-react";

const SUGGESTIONS = [
  "¿Cuántos animales hay en el predio?",
  "¿Cuál es el peso promedio del ganado?",
  "Muéstrame los partos del último mes",
  "¿Qué animales tienen pesajes pendientes?",
];

interface ChatEmptyStateProps {
  nombrePredio: string | null | undefined;
  onSuggestionClick: (text: string) => void;
}

export function ChatEmptyState({ nombrePredio, onSuggestionClick }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-brand-light/10 flex items-center justify-center mb-6 shadow-sm border border-brand-light/20 rotate-3">
        <Target size={28} className="text-brand-dark" />
      </div>
      <h3 className="text-gray-900 font-bold text-xl mb-2 tracking-tight">
        {nombrePredio ? `Asistente de ${nombrePredio}` : "Asistente SmartCow"}
      </h3>
      <p className="text-gray-500 text-sm mb-10 max-w-sm leading-relaxed">
        Pregúntame sobre animales, pesajes, partos o cualquier dato operativo del predio en tiempo real.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestionClick(s)}
            className="text-left text-[13px] text-gray-700 bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:bg-gray-50 hover:border-brand-light/40 hover:shadow-sm transition-all duration-300 group flex items-start gap-3"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-light mt-1.5 opacity-40 group-hover:opacity-100 transition-opacity" />
            <span className="flex-1">{s}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
