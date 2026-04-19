"use client";

import React, { useState } from "react";
import {
  IconFolder, IconCopy, IconX, IconSidebarRight, IconCheck,
} from "./chat-icons";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ArtifactData {
  kind: "Plan" | "Informe" | "Reporte" | string;
  title: string;
  content: string;
}

interface ChatArtifactProps {
  artifact: ArtifactData | null;
  isOpen: boolean;
  onClose: () => void;
}

// ── Save modal ─────────────────────────────────────────────────────────────────

type SaveKey = "pdf" | "wa" | "drive" | "email" | "routine";
type CopyKey = "md" | "rich" | "link" | "xlsx" | "notion";

function SaveModal({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState<SaveKey | null>(null);
  const start = (k: SaveKey) => {
    setSaving(k);
    setTimeout(() => { setSaving(null); onClose(); }, 1800);
  };

  const opts: { key: SaveKey; label: string; sub: (s: boolean) => string; color: string; icon: React.ReactNode }[] = [
    {
      key: "pdf", label: "Guardar como PDF",
      sub: (s) => s ? "Generando PDF…" : "Se descarga local al equipo",
      color: "#fce3dc",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c74634" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M10 13h4M10 17h4"/>
        </svg>
      ),
    },
    {
      key: "wa", label: "Enviar por WhatsApp a JP",
      sub: (s) => s ? "Enviando…" : "+56 9 5432 1876 · contacto frecuente",
      color: "#e6f3ec",
      icon: (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="#1e3a2f">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.4A10 10 0 1 0 12 2Zm5.3 14.4c-.2.6-1.3 1.2-1.8 1.3-.5.1-1.1.1-1.8-.1-1.5-.5-3.5-1.7-5.6-4.4-1.6-2.1-2-3.8-2.2-4.5-.2-.7.1-1.3.3-1.5.2-.3.5-.4.7-.4h.5c.1 0 .3 0 .5.4.2.4.6 1.5.7 1.6.1.2.1.3 0 .5l-.3.4-.4.4c-.1.1-.3.3-.1.5.1.3.7 1.1 1.5 1.9 1 .9 1.8 1.2 2.1 1.3.3.1.5.1.7-.1l.9-1c.2-.2.4-.2.6-.1.2.1 1.4.7 1.6.8.2.1.4.1.4.2.1.2.1.6-.1 1.2Z"/>
        </svg>
      ),
    },
    {
      key: "drive", label: "Guardar en Google Drive",
      sub: (s) => s ? "Subiendo…" : "SmartCow / Informes / Los Aromos",
      color: "#eaf0f7",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a5276" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2.5 8 13l3 5h10l-6.5-10.5zM11 18H3l5.5-9.5"/>
        </svg>
      ),
    },
    {
      key: "email", label: "Enviar por email",
      sub: (s) => s ? "Enviando…" : "jp@agropecuaria-gonzalez.cl",
      color: "#fdf0e6",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9b5e1a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/>
        </svg>
      ),
    },
    {
      key: "routine", label: "Guardar como routine",
      sub: (s) => s ? "Creando routine…" : "Re-ejecutable con /routine",
      color: "#e6f3ec",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a2f" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>
        </svg>
      ),
    },
  ];

  return (
    <div
      className="sc-modal-back"
      onClick={(e) => { if ((e.target as Element).classList.contains("sc-modal-back")) onClose(); }}
    >
      <div className="sc-modal">
        <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-[#f0ede8]">
          <span className="text-[13.5px] font-semibold text-[#1a1a1a]">Guardar o compartir</span>
          <button onClick={onClose} className="text-[#bbb] hover:text-[#666] transition-colors">
            <IconX size={15} />
          </button>
        </div>
        <div
          className="text-[11px] text-[#999] px-[18px] py-[8px] border-b border-[#f0ede8] truncate"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {title}
        </div>
        <div className="py-[6px]">
          {opts.map(({ key, label, sub, color, icon }) => (
            <button
              key={key}
              onClick={() => start(key)}
              className="flex items-center gap-[12px] w-full px-[18px] py-[11px] hover:bg-[#fafaf7] transition-colors text-left"
            >
              <div
                className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center flex-shrink-0"
                style={{ background: color }}
              >
                {saving === key
                  ? <div className="w-[14px] h-[14px] border-[1.5px] border-[#999] border-t-transparent rounded-full" style={{ animation: "spin 1s linear infinite" }} />
                  : icon
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[#1a1a1a]">{label}</div>
                <div className="text-[11px] text-[#999] mt-[1px]" style={{ fontFamily: "var(--font-mono)" }}>
                  {sub(saving === key)}
                </div>
              </div>
              <span className="text-[#ccc] text-[13px]">→</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-[8px] px-[18px] py-[10px] border-t border-[#f0ede8]">
          {saving
            ? <div className="w-[8px] h-[8px] border-[1.5px] border-[#999] border-t-transparent rounded-full" style={{ animation: "spin 1s linear infinite" }} />
            : <div className="w-[7px] h-[7px] rounded-full bg-[#7ecfa0]" />
          }
          <span className="text-[11px] text-[#999]" style={{ fontFamily: "var(--font-mono)" }}>
            {saving ? "procesando…" : "listo para exportar"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Copy modal ─────────────────────────────────────────────────────────────────

function CopyModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState<CopyKey | null>(null);
  const doCopy = (k: CopyKey) => {
    setCopied(k);
    setTimeout(() => { setCopied(null); onClose(); }, 1200);
  };

  const opts: { key: CopyKey; label: string; sub: (c: boolean) => string; color: string; icon: React.ReactNode }[] = [
    {
      key: "md", label: "Copiar como Markdown",
      sub: (c) => c ? "✓ Copiado al portapapeles" : "Formato crudo con headings y listas",
      color: "#fafaf7",
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 15V9l3 4 3-4v6M17 9v6M15 13l2 2 2-2"/></svg>,
    },
    {
      key: "rich", label: "Copiar como texto enriquecido",
      sub: (c) => c ? "✓ Copiado" : "Pegá directo en Docs, Notion, Gmail",
      color: "#eaf0f7",
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1a5276" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2M9 20h6M12 3v17"/></svg>,
    },
    {
      key: "link", label: "Copiar link compartible",
      sub: (c) => c ? "✓ smartcow.cl/p/…" : "Acceso solo para equipo SmartCow",
      color: "#fdf0e6",
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9b5e1a" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>,
    },
    {
      key: "xlsx", label: "Exportar a Excel / CSV",
      sub: (c) => c ? "✓ Generando .xlsx…" : "Solo tablas y KPIs",
      color: "#e6f3ec",
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1e3a2f" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16M15 4v16"/></svg>,
    },
    {
      key: "notion", label: "Enviar a Notion",
      sub: (c) => c ? "✓ Creando página…" : "Workspace SmartCow · /Informes",
      color: "#fafaf7",
      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h12l4 4v12H4zM4 4v16M16 4v4h4"/></svg>,
    },
  ];

  return (
    <div
      className="sc-modal-back"
      onClick={(e) => { if ((e.target as Element).classList.contains("sc-modal-back")) onClose(); }}
    >
      <div className="sc-modal">
        <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-[#f0ede8]">
          <span className="text-[13.5px] font-semibold text-[#1a1a1a]">Copiar o exportar</span>
          <button onClick={onClose} className="text-[#bbb] hover:text-[#666] transition-colors">
            <IconX size={15} />
          </button>
        </div>
        <div className="py-[6px]">
          {opts.map(({ key, label, sub, color, icon }) => (
            <button
              key={key}
              onClick={() => doCopy(key)}
              className="flex items-center gap-[12px] w-full px-[18px] py-[11px] hover:bg-[#fafaf7] transition-colors text-left"
            >
              <div
                className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center flex-shrink-0"
                style={{ background: color, border: "1px solid #f0ede8" }}
              >
                {copied === key ? <IconCheck size={14} /> : icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[#1a1a1a]">{label}</div>
                <div className="text-[11px] text-[#999] mt-[1px]" style={{ fontFamily: "var(--font-mono)" }}>
                  {sub(copied === key)}
                </div>
              </div>
              <span className="text-[#ccc] text-[13px]">→</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-[8px] px-[18px] py-[10px] border-t border-[#f0ede8]">
          <div className="w-[7px] h-[7px] rounded-full bg-[#7ecfa0]" />
          <span className="text-[11px] text-[#999]" style={{ fontFamily: "var(--font-mono)" }}>
            {copied ? `copiado (${copied})` : "markdown · listo para exportar"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Artifact panel ─────────────────────────────────────────────────────────────

export function ChatArtifact({ artifact, isOpen, onClose }: ChatArtifactProps) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);

  if (!isOpen || !artifact) return null;

  return (
    <>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-[16px] flex-shrink-0"
        style={{ height: 44, borderBottom: "1px solid #eaeaea" }}
      >
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.6px] text-[#999]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {artifact.kind}
        </span>
        <div className="flex items-center gap-[2px]">
          {[
            {
              icon: <><IconFolder size={14} /><span className="text-[10px] ml-[2px]">▾</span></>,
              title: "Guardar",
              onClick: () => setSaveOpen(true),
            },
            {
              icon: <IconCopy size={14} />,
              title: "Copiar",
              onClick: () => setCopyOpen(true),
            },
            {
              icon: <IconX size={15} />,
              title: "Cerrar",
              onClick: onClose,
            },
            {
              icon: <><IconSidebarRight size={15} /><span className="text-[10px] ml-[2px]">▾</span></>,
              title: "Layout",
              onClick: () => {},
            },
          ].map(({ icon, title, onClick }) => (
            <button
              key={title}
              title={title}
              onClick={onClick}
              className="flex items-center px-[7px] h-[28px] rounded-[5px] text-[#666] hover:bg-[#f0ede8] transition-colors"
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Comment hint */}
      <div
        className="flex items-center gap-[6px] px-[14px] py-[7px] border-b border-[#f0ede8] text-[11px] text-[#bbb] bg-[#fafafa] flex-shrink-0"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
        </svg>
        Select any text to leave a comment for Claude
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-[28px] py-[24px] max-w-full">
          <h1
            className="text-[20px] font-bold text-[#1a1a1a] leading-[1.3] mb-[6px]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {artifact.title}
          </h1>
          <div
            className="text-[11px] text-[#999] mb-[20px]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            SmartCow · {new Date().toLocaleDateString("es-CL")} · generado ahora
          </div>
          <div
            className="text-[13.5px] leading-[1.65] text-[#1a1a1a] whitespace-pre-wrap"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {artifact.content}
          </div>
        </div>
      </div>

      {/* Modals */}
      {saveOpen && (
        <SaveModal title={artifact.title} onClose={() => setSaveOpen(false)} />
      )}
      {copyOpen && (
        <CopyModal onClose={() => setCopyOpen(false)} />
      )}
    </>
  );
}
