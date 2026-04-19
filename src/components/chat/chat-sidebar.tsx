"use client";

import React from "react";
import { IconX, IconPlus, IconZap, IconChat } from "./chat-icons";

// ── Static sessions ────────────────────────────────────────────────────────────

const SESSIONS = {
  pinned: [] as string[],
  smartcow_prod: [
    "Initialize project setup",
    "Importar Excels AgroApp",
    "Schema Drizzle — tratamientos",
    "Fix DIIO resolver bajas",
    "Revisar partos duplicados",
  ],
  fundos_chile: [
    "Los Aromos — resumen semanal",
    "Plan vacunación Q2 2026",
    "Reporte movimientos marzo",
    "Auditoría tratamientos ISA",
  ],
};

// ── Dot icon ───────────────────────────────────────────────────────────────────

function SessionDot({ active = false }: { active?: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeDasharray={active ? "0" : "2 2.5"}>
      <circle cx="12" cy="12" r="8" />
      {active && <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />}
    </svg>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface ChatSidebarProps {
  open?: boolean;
  onClose?: () => void;
  userName?: string | null;
  // Legacy compat props (used by animales, lotes, reportes pages)
  orgName?: string | null;
  userEmail?: string | null;
  onKBClick?: () => void;
  onOrgClick?: () => void;
  onNotificationsClick?: () => void;
  onHistoryClick?: () => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
  activeSession?: string;
  onNewSession?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ChatSidebar({
  open = false,
  onClose,
  userName,
  activeSession = "Initialize project setup",
  onNewSession,
}: ChatSidebarProps) {
  const [activeTab, setActiveTab] = React.useState<"chats" | "tasks">("chats");

  return (
    <>
      {/* Backdrop */}
      {open && <div className="sc-backdrop" onClick={onClose} />}

      {/* Sidebar panel */}
      <aside className={`sc-sidebar ${open ? "open" : ""}`} role="dialog" aria-label="Historial de conversaciones">

        {/* Tabs row */}
        <div className="flex items-center gap-[2px] px-[8px] pt-[10px] pb-[6px] border-b border-[#f0ede8]">
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex items-center gap-[5px] px-[10px] py-[5px] rounded-[6px] text-[12px] font-medium transition-colors ${
              activeTab === "chats" ? "bg-[#f0ede8] text-[#1a1a1a]" : "text-[#999] hover:text-[#666]"
            }`}
          >
            <IconChat size={14} /> Chats
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-[5px] px-[10px] py-[5px] rounded-[6px] text-[12px] font-medium transition-colors ${
              activeTab === "tasks" ? "bg-[#f0ede8] text-[#1a1a1a]" : "text-[#999] hover:text-[#666]"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 6h16M4 12h10M4 18h16" />
            </svg>
            Tareas
          </button>
          <button
            onClick={onClose}
            className="ml-auto text-[#bbb] hover:text-[#666] transition-colors p-[4px]"
            aria-label="Cerrar sidebar"
          >
            <IconX size={14} />
          </button>
        </div>

        {/* Top actions */}
        <div className="px-[8px] py-[8px] border-b border-[#f0ede8]">
          <button
            onClick={onNewSession}
            className="flex items-center gap-[8px] w-full px-[10px] py-[7px] rounded-[6px] text-[12.5px] text-[#555] hover:bg-[#f8f6f1] hover:text-[#1a1a1a] transition-colors"
          >
            <IconPlus size={14} /> Nueva sesión
          </button>
          <button className="flex items-center gap-[8px] w-full px-[10px] py-[7px] rounded-[6px] text-[12.5px] text-[#555] hover:bg-[#f8f6f1] hover:text-[#1a1a1a] transition-colors">
            <IconZap size={13} /> Routines
          </button>
        </div>

        {/* Session list */}
        <nav className="flex-1 overflow-y-auto no-scrollbar px-[6px] py-[8px]">
          {Object.entries(SESSIONS).map(([group, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={group} className="mb-[14px]">
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.5px] text-[#bbb] px-[8px] mb-[4px]"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {group === "pinned" ? "Pinned" : group.replace(/_/g, " ")}
                </div>
                {items.map((label) => {
                  const isActive = label === activeSession;
                  return (
                    <button
                      key={label}
                      className={`flex items-center gap-[8px] w-full px-[8px] py-[6px] rounded-[6px] text-left text-[12.5px] transition-colors ${
                        isActive
                          ? "bg-[#f0ede8] text-[#1a1a1a] font-medium"
                          : "text-[#666] hover:bg-[#fafaf7] hover:text-[#1a1a1a]"
                      }`}
                    >
                      <span className={isActive ? "text-[#1e3a2f]" : "text-[#ccc]"}>
                        <SessionDot active={isActive} />
                      </span>
                      <span className="flex-1 truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="flex items-center gap-[8px] px-[14px] py-[10px] border-t border-[#f0ede8]">
          <div className="w-[24px] h-[24px] rounded-full bg-[#1e3a2f] flex items-center justify-center text-[9px] font-bold text-[#7ecfa0] flex-shrink-0">
            {userName?.[0]?.toUpperCase() ?? "C"}
          </div>
          <span className="text-[12px] font-medium text-[#1a1a1a] flex-1 truncate">
            {userName ?? "César"}
          </span>
          <button
            title="Tema"
            className="text-[#bbb] hover:text-[#666] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
