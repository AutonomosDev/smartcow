"use client";

/**
 * Chat empty state — basado en la referencia Dribbble
 * "Super Simple Mobile AI Chatbot Chat Interface"
 * Fondo blanco, texto grande centrado, suggestion chips.
 */

interface ChatEmptyStateProps {
  onSuggestionClick?: (text: string) => void;
  nombrePredio?: string | null;
}

export function ChatEmptyState({ nombrePredio, onSuggestionClick }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col h-full min-h-[75vh]">
      {/* Área central: pregunta grande */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-gray-900 text-[24px] font-semibold leading-snug tracking-tight">
            ¿En qué puedo<br />ayudarte{nombrePredio ? ` con ${nombrePredio}` : ""}?
          </h2>
        </div>
      </div>

      {/* Suggestion Chips */}
      <div className="px-2 pb-2">
        <div className="flex flex-wrap gap-2 justify-center">
          <button 
            onClick={() => onSuggestionClick?.("¿Cuál es el último pesaje?")}
            className="bg-[#e4e2e0] hover:bg-[#dbd9d6] text-gray-800 text-sm rounded-2xl px-4 py-3 transition-colors text-left flex-1 min-w-[140px]"
          >
            ¿Cuál es el último<br/>pesaje?
          </button>
          <button 
            onClick={() => onSuggestionClick?.("Registrar un parto")}
            className="bg-[#e4e2e0] hover:bg-[#dbd9d6] text-gray-800 text-sm rounded-2xl px-4 py-3 transition-colors text-left flex-1 min-w-[140px]"
          >
            Registrar<br/>un parto
          </button>
        </div>
      </div>
    </div>
  );
}
