"use client";

import { useEffect, useState } from "react";

const font = "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)";

interface Predio {
  id: number;
  nombre: string;
}

interface ChatEmptyStateProps {
  nombrePredio: string | null | undefined;
  userName?: string | null;
  onSuggestionClick: (text: string) => void;
  onPredioClick?: (predioId: number, nombre: string) => void;
}

export function ChatEmptyState({ nombrePredio, userName, onSuggestionClick, onPredioClick }: ChatEmptyStateProps) {
  const firstName = userName?.split(" ")[0];
  const [predios, setPredios] = useState<Predio[]>([]);

  useEffect(() => {
    fetch("/api/predios/mis-predios")
      .then((r) => r.ok ? r.json() : [])
      .then(setPredios)
      .catch(() => {});
  }, []);

  const handleChipClick = (p: Predio) => {
    if (onPredioClick) {
      onPredioClick(p.id, p.nombre);
    } else {
      onSuggestionClick(`Muéstrame el resumen del predio ${p.nombre}`);
    }
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "48px 16px", textAlign: "center",
      fontFamily: font,
    }}>
      <img
        src="/cow_robot.png"
        alt="SmartCow"
        style={{ width: 52, height: 52, objectFit: "contain", marginBottom: 14, background: "#ffffff" }}
      />

      <h3 style={{
        fontFamily: font, fontSize: 18, fontWeight: 600, color: "var(--cw-ink1)",
        margin: "0 0 4px", letterSpacing: "-.3px",
      }}>
        {firstName ? `¿En qué te ayudo, ${firstName}?` : "¿En qué te ayudo?"}
      </h3>

      <p style={{
        fontFamily: font, fontSize: 13, color: "var(--cw-ink3)",
        margin: "0 0 22px", fontWeight: 400,
      }}>
        {nombrePredio ? `${nombrePredio} · ` : ""}Pregunta sobre tus lotes, animales o finanzas
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {predios.length > 0 ? (
          predios.map((p) => (
            <button
              key={p.id}
              onClick={() => handleChipClick(p)}
              style={{
                fontFamily: "var(--cw-mono)",
                fontSize: 12,
                fontWeight: 500,
                background: "var(--cw-blue)",
                color: "var(--cw-blue-fg)",
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid transparent",
                cursor: "pointer",
                letterSpacing: ".2px",
                transition: "background .12s, border-color .12s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "#dde8f3";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(26,82,118,.18)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--cw-blue)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
              }}
            >
              {p.nombre}
            </button>
          ))
        ) : (
          // Fallback mientras carga
          ["/feedlot", "/FT", "/vaquillas", "/partos", "/tratamientos", "/ventas"].map((chip) => (
            <button
              key={chip}
              onClick={() => onSuggestionClick(chip)}
              style={{
                fontFamily: "var(--cw-mono)",
                fontSize: 12,
                fontWeight: 500,
                background: "var(--cw-blue)",
                color: "var(--cw-blue-fg)",
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid transparent",
                cursor: "pointer",
                letterSpacing: ".2px",
              }}
            >
              {chip}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
