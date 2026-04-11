"use client";

import { Sparkles } from "lucide-react";

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
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Sparkles size={22} className="text-gray-400" />
      </div>
      <h3 className="text-gray-800 font-semibold text-lg mb-1">
        {nombrePredio ? `Asistente de ${nombrePredio}` : "Asistente SmartCow"}
      </h3>
      <p className="text-gray-400 text-sm mb-8 max-w-xs">
        Pregúntame sobre animales, pesajes, partos o cualquier dato del predio.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestionClick(s)}
            className="text-left text-sm text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
