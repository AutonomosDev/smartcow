"use client";

/**
 * src/components/chat/chat-sidebar-v3.tsx
 * Chat sidebar V3 — historial de conversaciones agrupado por fecha.
 * Reemplaza el nav-link sidebar (V1/V2) por una lista de chats anteriores.
 * Ticket: AUT-209
 */

import { useState } from "react";
import { PanelLeftClose } from "lucide-react";

interface ChatHistoryItem {
  id: string;
  title: string;
}

interface ChatSidebarV3Props {
  orgName?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  onNewConversation: () => void;
}

const HISTORY_HOY: ChatHistoryItem[] = [
  { id: "h1", title: "Venta Lote Norte proyección" },
  { id: "h2", title: "Alertas Corral 3 bebedero" },
  { id: "h3", title: "GDP lotes esta semana" },
];

const HISTORY_AYER: ChatHistoryItem[] = [
  { id: "h4", title: "Receta Wagyu ajuste MS" },
  { id: "h5", title: "Vacunación lote programar" },
  { id: "h6", title: "Costo predio abril" },
];

const HISTORY_SEMANA: ChatHistoryItem[] = [
  { id: "h7", title: "Drone vuelo programar sáb" },
  { id: "h8", title: "Eficiencia alimentación" },
];

// Chat icon SVG (compact)
function ChatIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path
        d="M2 3h10v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M5 11v2M9 11v2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HistorySection({
  label,
  items,
  activeId,
  onSelect,
}: {
  label: string;
  items: ChatHistoryItem[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "#bbb",
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          padding: "0 4px",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 8px",
            borderRadius: 7,
            cursor: "pointer",
            fontSize: 12,
            color: activeId === item.id ? "#1e3a2f" : "#666",
            fontWeight: activeId === item.id ? 500 : 400,
            background: activeId === item.id ? "#f8f6f1" : "transparent",
            border: "none",
            width: "100%",
            textAlign: "left",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            if (activeId !== item.id)
              (e.currentTarget as HTMLElement).style.background = "#f8f6f1";
          }}
          onMouseLeave={(e) => {
            if (activeId !== item.id)
              (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <span style={{ color: activeId === item.id ? "#1e3a2f" : "#bbb", flexShrink: 0 }}>
            <ChatIcon />
          </span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {item.title}
          </span>
        </button>
      ))}
    </div>
  );
}

export function ChatSidebarV3({
  orgName,
  userName,
  userEmail,
  onNewConversation,
}: ChatSidebarV3Props) {
  const [activeId, setActiveId] = useState("h1");

  const initials = (userName ?? "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const orgInitial = (orgName ?? "F")[0].toUpperCase();

  return (
    <aside
      style={{
        width: 220,
        background: "#fff",
        borderRight: "0.5px solid #ebe9e3",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        fontFamily: "inherit",
      }}
    >
      {/* Top: logo + nueva conv */}
      <div
        style={{
          padding: "10px 10px 8px",
          borderBottom: "0.5px solid #ebe9e3",
        }}
      >
        {/* Logo row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
            padding: "0 2px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div
              style={{
                width: 26,
                height: 26,
                background: "#1e3a2f",
                borderRadius: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5" stroke="#7ecfa0" strokeWidth="1.5" />
                <path d="M5 7h4M7 5v4" stroke="#7ecfa0" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#1a1a1a",
                letterSpacing: "-0.3px",
              }}
            >
              smartCow
            </span>
          </div>
          <button
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#bbb",
              cursor: "pointer",
              background: "transparent",
              border: "none",
            }}
            title="Colapsar sidebar"
          >
            <PanelLeftClose size={14} />
          </button>
        </div>

        {/* Nueva conversación */}
        <button
          onClick={onNewConversation}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "7px 10px",
            borderRadius: 8,
            background: "#f8f6f1",
            border: "0.5px solid #e8e5df",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            color: "#555",
            width: "100%",
            fontFamily: "inherit",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Nueva conversación
        </button>
      </div>

      {/* History */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 8,
        }}
      >
        <HistorySection label="Hoy" items={HISTORY_HOY} activeId={activeId} onSelect={setActiveId} />
        <HistorySection label="Ayer" items={HISTORY_AYER} activeId={activeId} onSelect={setActiveId} />
        <HistorySection label="Esta semana" items={HISTORY_SEMANA} activeId={activeId} onSelect={setActiveId} />
      </div>

      {/* Footer: org + user */}
      <div
        style={{
          padding: "8px 10px",
          borderTop: "0.5px solid #f0ede8",
        }}
      >
        {/* Org selector */}
        <button
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "5px 6px",
            borderRadius: 7,
            cursor: "pointer",
            marginBottom: 4,
            background: "transparent",
            border: "none",
            width: "100%",
            fontFamily: "inherit",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#e6f3ec",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8,
                fontWeight: 700,
                color: "#1e3a2f",
              }}
            >
              {orgInitial}
            </div>
            <span style={{ fontSize: 11, color: "#555", fontWeight: 500 }}>
              {orgName ?? "Organización"}
            </span>
          </div>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M3 4l2-2 2 2M3 6l2 2 2-2"
              stroke="#bbb"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* User row */}
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 6px",
            borderRadius: 7,
            cursor: "pointer",
            background: "transparent",
            border: "none",
            width: "100%",
            fontFamily: "inherit",
            textAlign: "left",
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#1e3a2f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 700,
              color: "#7ecfa0",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#1a1a1a" }}>
              {userName ?? "Usuario"}
            </div>
            <div style={{ fontSize: 9, color: "#bbb" }}>{userEmail ?? ""}</div>
          </div>
        </button>
      </div>
    </aside>
  );
}
