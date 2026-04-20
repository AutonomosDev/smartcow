"use client";

import { useEffect, useState } from "react";

const font = "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)";
const mono = "var(--cw-mono, 'JetBrains Mono', 'Fira Mono', monospace)";

interface SlashCommand {
  id: number;
  comando: string;
  label: string;
  modulo: string | null;
  promptTemplate: string;
  orden: number;
}

interface ChatEmptyStateProps {
  nombrePredio: string | null | undefined;
  userName?: string | null;
  onSuggestionClick: (text: string) => void;
  onPredioClick?: (predioId: number, nombre: string) => void;
}

export function ChatEmptyState({ userName, onSuggestionClick }: ChatEmptyStateProps) {
  const firstName = userName?.split(" ")[0];
  const [cmds, setCmds] = useState<SlashCommand[]>([]);

  useEffect(() => {
    fetch("/api/chat/slash-commands")
      .then((r) => r.ok ? r.json() : [])
      .then(setCmds)
      .catch(() => {});
  }, []);

  // Fallback chips while loading
  const chips: SlashCommand[] = cmds.length > 0 ? cmds : [
    { id: 1, comando: "/feedlot",    label: "Feedlot",    modulo: "feedlot", promptTemplate: "Focus en feedlot: últimos pesajes, GDP por lote, días en engorde.", orden: 1 },
    { id: 2, comando: "/medieriaFT", label: "Medieria FT", modulo: "feedlot", promptTemplate: "Focus en mediería Frigo Temuco: inventario, pesajes, GDP.", orden: 2 },
    { id: 3, comando: "/novillos",   label: "Novillos",   modulo: null,      promptTemplate: "Focus en novillos: conteo, pesajes, GDP.", orden: 4 },
    { id: 4, comando: "/partos",     label: "Partos",     modulo: "crianza", promptTemplate: "Últimos partos del predio 2026: fecha, resultado, tasa.", orden: 5 },
    { id: 5, comando: "/pesajes",    label: "Pesajes",    modulo: null,      promptTemplate: "Últimos pesajes del predio con GDP por lote.", orden: 6 },
    { id: 6, comando: "/ventas",     label: "Ventas",     modulo: null,      promptTemplate: "Ventas 2026: total, peso promedio, destino.", orden: 8 },
  ];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 20px 40px",
      textAlign: "center",
      fontFamily: font,
      width: "100%",
      maxWidth: 680,
      margin: "0 auto",
    }}>

      {/* Hero image — vaca protagonista */}
      <div style={{
        width: "100%", maxWidth: 420,
        marginBottom: 24,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 2px 18px rgba(0,0,0,.10)",
        flexShrink: 0,
      }}>
        <img
          src="/hero_cows.jpg"
          alt="SmartCow — hato ganadero"
          style={{
            width: "100%",
            height: 200,
            objectFit: "cover",
            objectPosition: "center 40%",
            display: "block",
          }}
        />
      </div>

      {/* Heading */}
      <h3 style={{
        fontFamily: font,
        fontSize: 20,
        fontWeight: 700,
        color: "var(--cw-ink1, #1a1a1a)",
        margin: "0 0 6px",
        letterSpacing: "-.4px",
      }}>
        {firstName ? `¿Qué quieres saber, ${firstName}?` : "¿Qué quieres saber?"}
      </h3>

      <p style={{
        fontFamily: font,
        fontSize: 13.5,
        color: "var(--cw-ink3, #888)",
        margin: "0 0 24px",
        fontWeight: 400,
      }}>
        Pregunta sobre tu hato, pesajes, lotes o finanzas
      </p>

      {/* Slash command chips */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: "center",
      }}>
        {chips.map((cmd) => (
          <SlashChip
            key={cmd.id}
            comando={cmd.comando}
            onClick={() => onSuggestionClick(cmd.promptTemplate)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Slash chip ───────────────────────────────────────────────────────────────

function SlashChip({ comando, onClick }: { comando: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: mono,
        fontSize: 12.5,
        fontWeight: 500,
        background: hovered ? "#dde8f3" : "var(--cw-blue, #e8f0f8)",
        color: "var(--cw-blue-fg, #1a5276)",
        padding: "7px 16px",
        borderRadius: 8,
        border: hovered ? "1px solid rgba(26,82,118,.22)" : "1px solid transparent",
        cursor: "pointer",
        letterSpacing: ".2px",
        transition: "background .12s, border-color .12s",
        userSelect: "none",
      }}
    >
      {comando}
    </button>
  );
}
