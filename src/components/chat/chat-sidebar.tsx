"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SessionItem {
  id: number;
  titulo: string;
}

interface PredioGroup {
  predio_id: number | null;
  predio_nombre: string;
  sesiones: SessionItem[];
}

// ─── Session dot SVG ────────────────────────────────────────────────────────

function SessionDot({ active }: { active?: boolean }) {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeDasharray={active ? "0" : "2 2.5"}
    >
      <circle cx="12" cy="12" r="8" />
      {active && <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />}
    </svg>
  );
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface ChatSidebarProps {
  open?: boolean;
  onClose?: () => void;
  userName?: string | null;
  activeSessionId?: number | null;
  // legacy props used by non-chat pages — accepted but ignored
  orgName?: string | null;
  userEmail?: string | null;
  onKBClick?: () => void;
  onOrgClick?: () => void;
  onNotificationsClick?: () => void;
  onHistoryClick?: () => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
}

// ─── Sidebar ────────────────────────────────────────────────────────────────

export function ChatSidebar({ open = false, onClose, userName, activeSessionId }: ChatSidebarProps) {
  const router = useRouter();
  const [groups, setGroups] = useState<PredioGroup[]>([]);

  const handleNewSession = () => {
    onClose?.();
    router.push("/chat");
    router.refresh();
    if (typeof window !== "undefined" && window.location.pathname === "/chat") {
      window.location.href = "/chat";
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  useEffect(() => {
    if (!open) return;
    fetch("/api/chat/sessions")
      .then((r) => r.ok ? r.json() : [])
      .then(setGroups)
      .catch(() => {});
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={() => onClose?.()}
          style={{
            position: "absolute", inset: "37px 0 0 0",
            background: "transparent", zIndex: 40, pointerEvents: "auto",
          }}
        />
      )}

      {/* Panel */}
      <div
        style={{
          position: "absolute", left: 0, top: 37, bottom: 0,
          width: 310,
          background: "#fff",
          borderRight: "1px solid #e4e4e4",
          boxShadow: "4px 0 20px rgba(0,0,0,.04)",
          zIndex: 50,
          display: "flex", flexDirection: "column",
          fontSize: 14.3,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "transform .2s cubic-bezier(.2,.7,.2,1), opacity .18s ease",
        }}
      >
        {/* Tabs row */}
        <div style={{ display: "flex", gap: 4, padding: "10px 14px 6px" }}>
          <div style={tabStyle} title="Chats">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/>
            </svg>
          </div>
          <div style={tabStyle} title="Tareas">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h10M4 18h16"/>
            </svg>
          </div>
          <div style={{ ...tabStyle, width: "auto", padding: "0 10px", gap: 5, fontFamily: "var(--cw-mono)", fontSize: 13.2, fontWeight: 500, background: "#f1f1f1", color: "#333" }}>
            <span>smartCow</span>
          </div>
        </div>

        {/* Top menu */}
        <div style={{ padding: "2px 8px 6px", display: "flex", flexDirection: "column" }}>
          <button onClick={handleNewSession} style={{ ...menuItem, background: "transparent", border: "none", textAlign: "left", width: "100%", font: "inherit" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            <span>Nueva sesión</span>
          </button>
          <div style={menuItem}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/></svg>
            <span>Routines</span>
          </div>
          <div style={menuItem}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><rect x="3" y="7" width="18" height="13" rx="2"/></svg>
            <span>Configurar</span>
          </div>
        </div>

        {/* Session list */}
        <div
          className="cw-scrollbar"
          style={{ flex: 1, overflowY: "auto", padding: "4px 8px 6px" }}
        >
          {groups.length > 0 ? (
            groups.map((group) => (
              <div key={group.predio_id ?? "global"}>
                <SbSection label={group.predio_nombre} />
                {group.sesiones.map((s) => (
                  <SbItem
                    key={s.id}
                    label={s.titulo}
                    active={s.id === activeSessionId}
                  />
                ))}
              </div>
            ))
          ) : (
            <>
              <SbSection label="smartcow" />
              <SbItem label="Nueva conversación" active />
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #eee", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 14.3, color: "#333" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>
            </svg>
          </div>
          <span style={{ flex: 1, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName ?? "Usuario"}</span>
          <button
            onClick={() => alert("Google Drive — próximamente")}
            title="Google Drive"
            style={iconBtn}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.01 2 7 11l5 8.5L17 11Z"/>
              <path d="M7 11H2l5 8.5"/>
              <path d="M17 11h5l-5 8.5"/>
              <path d="m7 11 5-8.5L17 11"/>
            </svg>
          </button>
          <button
            onClick={() => alert("Configuración — próximamente")}
            title="Configuración"
            style={iconBtn}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
            </svg>
          </button>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            style={iconBtn}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const tabStyle: React.CSSProperties = {
  width: 32, height: 28, borderRadius: 6,
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#777", cursor: "pointer",
};

const iconBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 6,
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#777", cursor: "pointer",
  background: "transparent", border: "none", padding: 0,
  flexShrink: 0,
};

const menuItem: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10,
  padding: "8px 11px", borderRadius: 6, cursor: "pointer",
  color: "#1a1a1a", fontSize: 14.3, textDecoration: "none",
};

function SbSection({ label }: { label: string }) {
  return (
    <div style={{ padding: "14px 10px 6px", fontSize: 12.1, color: "#999", fontWeight: 500, letterSpacing: ".1px" }}>
      {label}
    </div>
  );
}

function SbItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 11px", borderRadius: 6, cursor: "pointer",
      color: active ? "#1a1a1a" : "#333",
      background: active ? "#ececec" : "transparent",
      whiteSpace: "nowrap", overflow: "hidden",
      fontSize: 14.3,
    }}>
      <span style={{ color: active ? "#777" : "#aaa", flexShrink: 0, display: "flex", alignItems: "center" }}>
        <SessionDot active={active} />
      </span>
      <span style={{ flex: 1, textOverflow: "ellipsis", overflow: "hidden" }}>{label}</span>
    </div>
  );
}
