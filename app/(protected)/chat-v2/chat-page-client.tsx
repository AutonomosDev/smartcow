"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatSidebar } from "@/src/components/chat/chat-sidebar";
import { ChatPanel } from "@/src/components/chat/chat-panel";
import { ChatArtifact, type ArtifactData } from "@/src/components/chat/chat-artifact";
import {
  IconHamburger, IconChevronLeft, IconChevronRight, IconSearch,
  IconFolder, IconSidebarRight,
} from "@/src/components/chat/chat-icons";

// ── Traffic lights ─────────────────────────────────────────────────────────────

function TrafficLights() {
  return (
    <div className="flex gap-[8px] items-center">
      <span className="w-[12px] h-[12px] rounded-full block bg-[#ff5f57] border-[0.5px] border-[#e0443e]" />
      <span className="w-[12px] h-[12px] rounded-full block bg-[#febc2e] border-[0.5px] border-[#dea123]" />
      <span className="w-[12px] h-[12px] rounded-full block bg-[#28c840] border-[0.5px] border-[#1aab29]" />
    </div>
  );
}

// ── Reopen chip ────────────────────────────────────────────────────────────────

function ReopenChip({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-[6px] px-[10px] py-[4px] rounded-[6px] text-[11.5px] font-medium transition-colors border border-transparent"
      style={{
        fontFamily: "var(--font-mono)",
        background: "var(--green-chip-bg)",
        color: "var(--green-chip-fg)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--green-chip-hover-bg)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(43,106,74,.2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--green-chip-bg)";
        (e.currentTarget as HTMLElement).style.borderColor = "transparent";
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/>
      </svg>
      Plan
    </button>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────

export function ChatPageClient({
  predioId,
  initialMessage,
  nombrePredio,
  session,
}: {
  predioId: number;
  initialMessage?: string;
  nombrePredio?: string | null;
  session: { user: { nombre: string; email: string } };
}) {
  const [sbOpen, setSbOpen] = useState(false);
  const [artVisible, setArtVisible] = useState(true);
  const [artifact, setArtifact] = useState<ArtifactData | null>({
    kind: "Plan",
    title: "Captura datos AgroApp — ruta Excel del UI + Puppeteer",
    content: "Documento de plan generado por SmartCow.\n\nEste panel mostrará el contenido del próximo informe o plan generado por el asistente.",
  });

  // Artifact panel width — draggable
  const [artWidth, setArtWidth] = useState(() => {
    try { return parseInt(localStorage.getItem("sc_art_w") ?? "0") || 560; } catch { return 560; }
  });
  const dragRef = useRef({ dragging: false, startX: 0, startW: 0 });
  const dividerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.dragging) return;
      const dx = dragRef.current.startX - e.clientX;
      const nw = Math.max(320, Math.min(window.innerWidth - 420, dragRef.current.startW + dx));
      setArtWidth(nw);
    };
    const onUp = () => {
      if (!dragRef.current.dragging) return;
      dragRef.current.dragging = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      dividerRef.current?.classList.remove("dragging");
      try { localStorage.setItem("sc_art_w", String(artWidth)); } catch {}
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [artWidth]);

  const onDragStart = (e: React.MouseEvent) => {
    dragRef.current = { dragging: true, startX: e.clientX, startW: artWidth };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    dividerRef.current?.classList.add("dragging");
  };

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "#fff" }}
    >
      {/* ── macOS titlebar ── */}
      <div
        className="flex items-center flex-shrink-0 select-none gap-[10px] px-[10px]"
        style={{ height: 38, borderBottom: "1px solid #ececec", background: "#fff" }}
      >
        {/* Left: traffic lights + nav */}
        <TrafficLights />
        <div className="flex items-center gap-[2px] ml-[4px]">
          <button
            onClick={() => setSbOpen((o) => !o)}
            title="Menú"
            className="w-[22px] h-[22px] flex items-center justify-center rounded-[4px] text-[#b0b0b0] hover:bg-black/5 hover:text-[#6a6a6a] transition-colors"
          >
            <IconHamburger size={15} />
          </button>
          <button className="w-[22px] h-[22px] flex items-center justify-center rounded-[4px] text-[#c8c8c8]">
            <IconChevronLeft size={16} />
          </button>
          <button className="w-[22px] h-[22px] flex items-center justify-center rounded-[4px] text-[#c8c8c8]">
            <IconChevronRight size={16} />
          </button>
        </div>

        {/* Center: project title */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-[7px] text-[12.5px] text-[#333] font-medium"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <span className="text-[#666] flex items-center">
            <IconFolder size={13} />
          </span>
          <span>smartcow_prod</span>
          <span className="text-[#999] mx-[2px]">/</span>
          <span>{nombrePredio ?? "Asistente ganadero"}</span>
          <span className="text-[#8a8a8a] ml-[2px]">▾</span>
        </div>

        {/* Right: reopen chip + search */}
        <div className="ml-auto flex items-center gap-[6px] pr-[10px]">
          {!artVisible && (
            <ReopenChip onClick={() => setArtVisible(true)} />
          )}
          <button
            title="Buscar"
            className="w-[24px] h-[24px] flex items-center justify-center rounded-[4px] text-[#666] hover:bg-black/5 transition-colors"
          >
            <IconSearch size={14} />
          </button>
        </div>
      </div>

      {/* ── Body split ── */}
      <div className="flex flex-1 min-h-0 bg-white relative">
        {/* Sidebar overlay */}
        <ChatSidebar
          open={sbOpen}
          onClose={() => setSbOpen(false)}
          userName={session.user.nombre}
          onNewSession={() => setSbOpen(false)}
        />

        {/* Chat pane */}
        <ChatPanel
          predioId={predioId}
          initialMessage={initialMessage}
          nombrePredio={nombrePredio}
          userName={session.user.nombre}
          artWidth={artWidth}
          artVisible={artVisible}
          onArtifactUpdate={setArtifact}
          onArtifactOpen={setArtVisible}
          className="flex-1 min-w-0"
        />

        {/* Drag divider */}
        {artVisible && (
          <div
            ref={dividerRef}
            className="sc-divider"
            onMouseDown={onDragStart}
            title="Arrastrar para redimensionar"
          />
        )}

        {/* Artifact pane */}
        {artVisible && (
          <div
            className="flex flex-col flex-shrink-0 overflow-hidden"
            style={{
              width: artWidth,
              marginTop: 6,
              borderRadius: "10px 10px 0 0",
              boxShadow: "-1px 0 0 rgba(0,0,0,.05), -6px -2px 18px rgba(0,0,0,.07)",
              background: "#fff",
            }}
          >
            <ChatArtifact
              artifact={artifact}
              isOpen={artVisible}
              onClose={() => setArtVisible(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
