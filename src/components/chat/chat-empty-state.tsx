"use client";

const SUGGESTIONS = [
  { title: "¿Cómo van los lotes esta semana?", desc: "Resumen GDP y alertas" },
  { title: "¿Cuánto gano si vendo hoy?", desc: "Proyección financiera en vivo" },
  { title: "¿Qué animales necesitan atención?", desc: "Alertas sanitarias y GDP bajo" },
  { title: "¿Cuánto me cuesta el predio hoy?", desc: "Costos y proyección mensual" },
];

interface ChatEmptyStateProps {
  nombrePredio: string | null | undefined;
  userName?: string | null;
  onSuggestionClick: (text: string) => void;
}

export function ChatEmptyState({ nombrePredio, userName, onSuggestionClick }: ChatEmptyStateProps) {
  const firstName = userName?.split(" ")[0];

  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
      <div className="w-[46px] h-[46px] bg-[#1e3a2f] rounded-[13px] flex items-center justify-center mb-[12px]">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="8" stroke="#7ecfa0" strokeWidth="1.8"/>
          <path d="M8 11h6M11 8v6" stroke="#7ecfa0" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>

      <h3 className="text-[#1a1a1a] font-bold text-[18px] mb-[4px] tracking-tight">
        {firstName ? `¿En qué te ayudo, ${firstName}?` : "¿En qué te ayudo?"}
      </h3>
      <p className="text-[#999] text-[13px] mb-[22px]">
        {nombrePredio ? `${nombrePredio} · ` : ""}Pregunta sobre tus lotes, animales o finanzas
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[6px] w-full max-w-md">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            onClick={() => onSuggestionClick(s.title)}
            className="text-left bg-white border border-[#e0ddd8] rounded-[10px] px-[13px] py-[10px] cursor-pointer hover:border-[#1e3a2f] hover:bg-[#f8f6f1] transition-all duration-200"
          >
            <div className="text-[12px] font-semibold text-[#1a1a1a] mb-[2px]">{s.title}</div>
            <div className="text-[11px] text-[#aaa]">{s.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
