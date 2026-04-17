"use client";

/**
 * src/components/chat/chat-sidebar-v3.tsx
 * Chat sidebar V3 — historial de conversaciones agrupado por fecha.
 * Reemplaza el nav-link sidebar (V1/V2) por una lista de chats anteriores.
 * Tickets: AUT-209, AUT-144
 */

import { useState, useEffect } from "react";
import { PanelLeftClose, Plus } from "lucide-react";

interface ChatHistoryItem {
  id: number;
  titulo: string;
  actualizadoEn: string;
}
interface ChatSidebarV3Props {
  orgName?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  predioId?: number;
  activeConversationId?: number | null;
  refreshTrigger?: number;
  onNewConversation: () => void;
  onSelectConversation: (id: number) => void;
  isEmbedded?: boolean;
}

// ─── Helpers de fecha (sin date-fns) ─────────────────────────────────────────

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  );
}

function isThisWeek(date: Date): boolean {
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);
  return date >= weekAgo && date <= now;
}

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
  activeId: number | null | undefined;
  onSelect: (id: number) => void;
}) {
  if (items.length === 0) return null;
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
            color: activeId === item.id ? "#1a1a1a" : "#666",
            fontWeight: activeId === item.id ? 600 : 400,
            background: activeId === item.id ? "#f5f5f5" : "transparent",
            border: "none",
            width: "100%",
            textAlign: "left",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            if (activeId !== item.id)
              (e.currentTarget as HTMLElement).style.background = "#fafafa";
          }}
          onMouseLeave={(e) => {
            if (activeId !== item.id)
              (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <span style={{ color: activeId === item.id ? "#1a1a1a" : "#ccc", flexShrink: 0 }}>
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
            {item.titulo}
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
  predioId,
  activeConversationId,
  refreshTrigger,
  onNewConversation,
  onSelectConversation,
  isEmbedded = false,
}: ChatSidebarV3Props) {
  const [historial, setHistorial] = useState<ChatHistoryItem[]>([]);

  useEffect(() => {
    if (!predioId) return;
    fetch(`/api/conversations?predio_id=${predioId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ChatHistoryItem[]) => setHistorial(data))
      .catch(() => {});
  }, [predioId, refreshTrigger]);

  const hoy = historial.filter((c) => isToday(new Date(c.actualizadoEn)));
  const ayer = historial.filter((c) => isYesterday(new Date(c.actualizadoEn)));
  const semana = historial.filter((c) => {
    const d = new Date(c.actualizadoEn);
    return isThisWeek(d) && !isToday(d) && !isYesterday(d);
  });

  const initials = (userName ?? "U")
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const orgInitial = (orgName ?? "F")[0].toUpperCase();

  const historyList = (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: isEmbedded ? "0" : "8px",
      }}
    >
      <HistorySection
        label="Hoy"
        items={hoy}
        activeId={activeConversationId}
        onSelect={onSelectConversation}
      />
      <HistorySection
        label="Ayer"
        items={ayer}
        activeId={activeConversationId}
        onSelect={onSelectConversation}
      />
      <HistorySection
        label="Esta semana"
        items={semana}
        activeId={activeConversationId}
        onSelect={onSelectConversation}
      />
      {historial.length === 0 && (
        <div
          style={{
            fontSize: 11,
            color: "#ccc",
            textAlign: "center",
            padding: "20px 8px",
          }}
        >
          Sin conversaciones
        </div>
      )}
    </div>
  );

  if (isEmbedded) return historyList;

  return (
    <aside
      style={{
        width: 260,
        background: "#fff",
        borderRight: "1px solid #f0f0f0",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        fontFamily: "inherit",
      }}
    >
      {/* Top: logo + nueva conv */}
      <div
        style={{
          padding: "20px 18px",
          borderBottom: "1px solid #f9f9f9",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: "#1a1a1a",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "#fff", fontWeight: "bold", fontSize: 13 }}>SC</span>
          </div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#1a1a1a",
              letterSpacing: "-0.5px",
            }}
          >
            smartCow
          </span>
        </div>

        <button
          onClick={onNewConversation}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px",
            borderRadius: 12,
            background: "#f5f5f5",
            border: "1px solid #eee",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            color: "#1a1a1a",
            width: "100%",
            fontFamily: "inherit",
          }}
        >
          <Plus size={16} />
          Nueva conversación
        </button>
      </div>

      {historyList}

      {/* Footer: User */}
      <div
        style={{
          padding: "16px 12px",
          borderTop: "1px solid #f9f9f9",
        }}
      >
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px",
            borderRadius: 12,
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
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#1a1a1a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>
              {userName ?? "Usuario"}
            </div>
            <div style={{ fontSize: 11, color: "#aaa" }}>{userEmail ?? ""}</div>
          </div>
        </button>
      </div>
    </aside>
  );
}
