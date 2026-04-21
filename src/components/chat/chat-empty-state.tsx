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
  onSuggestionClick: (text: string, folderLabel?: string) => void;
  onQuickCommand?: (command: string, label: string) => void;
  onPredioClick?: (predioId: number, nombre: string) => void;
}

// AUT-268 — Comandos resueltos por SQL directo sin LLM (endpoint /api/chat/quick-query)
const QUICK_COMMANDS = new Set([
  "animales", "enfermos", "feedlot", "lotes", "pesajes",
  "partos", "bajas", "ventas", "tratamientos", "preñez",
]);

export function ChatEmptyState({ userName, onSuggestionClick, onQuickCommand }: ChatEmptyStateProps) {
  const firstName = userName?.split(" ")[0];
  const [cmds, setCmds] = useState<SlashCommand[]>([]);

  useEffect(() => {
    fetch("/api/chat/slash-commands")
      .then((r) => r.ok ? r.json() : [])
      .then(setCmds)
      .catch(() => {});
  }, []);

  // Fallback chips while loading — priorizan los 10 top del catálogo AUT-266 via quick-query
  const chips: SlashCommand[] = cmds.length > 0 ? cmds : [
    { id: 1, comando: "/animales",    label: "Animales",    modulo: null,      promptTemplate: "", orden: 1 },
    { id: 2, comando: "/feedlot",     label: "Feedlot",     modulo: "feedlot", promptTemplate: "", orden: 2 },
    { id: 3, comando: "/lotes",       label: "Lotes",       modulo: null,      promptTemplate: "", orden: 3 },
    { id: 4, comando: "/pesajes",     label: "Pesajes",     modulo: null,      promptTemplate: "", orden: 4 },
    { id: 5, comando: "/partos",      label: "Partos",      modulo: "crianza", promptTemplate: "", orden: 5 },
    { id: 6, comando: "/ventas",      label: "Ventas",      modulo: null,      promptTemplate: "", orden: 6 },
    { id: 7, comando: "/enfermos",    label: "Enfermos",    modulo: null,      promptTemplate: "", orden: 7 },
    { id: 8, comando: "/preñez",      label: "Preñez",      modulo: "crianza", promptTemplate: "", orden: 8 },
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

      {/* Hero — vaca robótica protagonista */}
      <div style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        marginBottom: 20,
        flexShrink: 0,
      }}>
        <img
          src="/cow_robot.png"
          alt="SmartCow — vaca robótica"
          style={{
            width: 320,
            height: 320,
            maxWidth: "80vw",
            objectFit: "contain",
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
        Pregunta sobre tu lote, pesajes o finanzas
      </p>

      {/* Slash command chips */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: "center",
      }}>
        {chips.map((cmd) => {
          const bare = cmd.comando.replace(/^\//, "");
          const isQuick = QUICK_COMMANDS.has(bare);
          return (
            <SlashChip
              key={cmd.id}
              comando={cmd.comando}
              onClick={() => {
                if (isQuick && onQuickCommand) {
                  onQuickCommand(bare, cmd.label);
                } else {
                  onSuggestionClick(cmd.promptTemplate, cmd.label);
                }
              }}
            />
          );
        })}
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
