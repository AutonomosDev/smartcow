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

export function ChatEmptyState({ nombrePredio }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Área central: pregunta grande */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="text-center">
          <h2 className="text-gray-900 text-[22px] font-semibold leading-snug">
            ¿En qué puedo<br />ayudarte{nombrePredio ? ` con ${nombrePredio}` : ""}?
          </h2>
        </div>
      </div>
    </div>
  );
}
