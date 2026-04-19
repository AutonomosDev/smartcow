"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ArtifactData {
  id: string;
  title: string;
  content: string;
  kind?: string;
}

interface ArtifactPanelProps {
  artifact: ArtifactData | null;
  onHide: () => void;
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function IcoFolder() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"/></svg>;
}
function IcoCopy() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
}
function IcoX() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
}
function IcoSidebarRight() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/></svg>;
}
function IcoInfo() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/></svg>;
}

// ─── Artifact Panel ───────────────────────────────────────────────────────────

export function ArtifactPanel({ artifact, onHide }: ArtifactPanelProps) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const startSave = (key: string) => {
    setSaving(key);
    setTimeout(() => { setSaving(null); setSaveOpen(false); }, 1800);
  };

  const doCopy = (key: string) => {
    setCopied(key);
    setTimeout(() => { setCopied(null); setCopyOpen(false); }, 1200);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff", position: "relative" }}>

      {/* Top bar */}
      <div style={{
        height: 38, display: "flex", alignItems: "center",
        padding: "0 14px 0 22px", gap: 10, borderBottom: 0, flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, color: "var(--cw-ink2)", fontWeight: 400 }}>
          {artifact?.kind ?? "Informe"}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 2, alignItems: "center" }}>
          <ArtBtn title="Guardar" onClick={() => setSaveOpen(true)}>
            <IcoFolder /><span style={{ fontSize: 9, marginLeft: 1, color: "#aaa" }}>▾</span>
          </ArtBtn>
          <ArtBtn title="Copiar" onClick={() => setCopyOpen(true)}>
            <IcoCopy />
          </ArtBtn>
          <ArtBtn title="Cerrar" onClick={onHide}>
            <IcoX />
          </ArtBtn>
          <ArtBtn title="Layout">
            <IcoSidebarRight /><span style={{ fontSize: 9, marginLeft: 1, color: "#aaa" }}>▾</span>
          </ArtBtn>
        </div>
      </div>

      {/* Comment bar */}
      <div style={{
        display: "flex", justifyContent: "center", padding: "4px 0 14px",
        fontSize: 12.5, color: "#6a6a6a", gap: 6, alignItems: "center", flexShrink: 0,
      }}>
        <span style={{ color: "#9a9a9a" }}><IcoInfo /></span>
        Select any text to leave a comment for SmartCow
      </div>

      {/* Scroll area */}
      <div
        className="cw-scrollbar"
        style={{ flex: 1, overflowY: "auto", padding: "0 40px 40px" }}
      >
        {artifact ? (
          <ArtifactContent artifact={artifact} />
        ) : (
          <ArtifactEmpty />
        )}
      </div>

      {/* Save modal */}
      {saveOpen && (
        <Modal title="Guardar o compartir" sub={artifact?.title ?? "Informe"} onClose={() => setSaveOpen(false)}>
          <ModalOpt color="red" icon={<IcoPDF />} t1="Guardar como PDF" t2={saving === "pdf" ? "Generando PDF…" : "Se descarga local al equipo"} working={saving === "pdf"} onClick={() => startSave("pdf")} />
          <ModalOpt color="green" icon={<IcoWA />} t1="Enviar por WhatsApp a JP" t2={saving === "wa" ? "Enviando…" : "+56 9 5432 1876 · contacto frecuente"} working={saving === "wa"} onClick={() => startSave("wa")} />
          <ModalOpt color="blue" icon={<IcoDrive />} t1="Guardar en Google Drive" t2={saving === "drive" ? "Subiendo…" : "SmartCow / Informes / Los Aromos"} working={saving === "drive"} onClick={() => startSave("drive")} />
          <ModalOpt color="amber" icon={<IcoEmail />} t1="Enviar por email" t2={saving === "email" ? "Enviando…" : "jp@agropecuaria.cl"} working={saving === "email"} onClick={() => startSave("email")} />
          <ModalOpt icon={<IcoRoutine />} t1="Guardar como routine" t2={saving === "routine" ? "Creando routine…" : "Re-ejecutable con /routine pesajes"} working={saving === "routine"} onClick={() => startSave("routine")} />
          <ModalFoot saving={!!saving} label="listo para exportar" />
        </Modal>
      )}

      {/* Copy modal */}
      {copyOpen && (
        <Modal title="Copiar o exportar" sub={artifact?.title ?? "Informe"} onClose={() => setCopyOpen(false)}>
          <ModalOpt icon={<IcoMD />} t1="Copiar como Markdown" t2={copied === "md" ? "✓ Copiado al portapapeles" : "Formato crudo con headings y listas"} onClick={() => doCopy("md")} />
          <ModalOpt color="blue" icon={<IcoRich />} t1="Copiar como texto enriquecido" t2={copied === "rich" ? "✓ Copiado" : "Pegá directo en Docs, Notion, Gmail"} onClick={() => doCopy("rich")} />
          <ModalOpt color="amber" icon={<IcoLink />} t1="Copiar link compartible" t2={copied === "link" ? "✓ Copiado" : "Acceso solo para equipo SmartCow"} onClick={() => doCopy("link")} />
          <ModalOpt color="red" icon={<IcoXlsx />} t1="Exportar a Excel / CSV" t2={copied === "xlsx" ? "✓ Generando .xlsx…" : "Solo tablas y KPIs del informe"} onClick={() => doCopy("xlsx")} />
          <ModalFoot saving={false} label="markdown · listo para exportar" />
        </Modal>
      )}
    </div>
  );
}

// ─── Artifact content renderer ────────────────────────────────────────────────

const artMarkdown: Components = {
  h1: ({ children }) => (
    <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-.3px", margin: "0 0 28px", color: "#1a1a1a", lineHeight: 1.3 }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ fontSize: 18, fontWeight: 700, margin: "26px 0 10px", color: "#1a1a1a", letterSpacing: "-.2px" }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ fontSize: 15, fontWeight: 600, margin: "18px 0 8px", color: "#1a1a1a" }}>{children}</h3>
  ),
  p: ({ children }) => (
    <p style={{ fontSize: 14, lineHeight: 1.6, color: "#1a1a1a", margin: "0 0 12px" }}>{children}</p>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight: 600, color: "#1a1a1a" }}>{children}</strong>
  ),
  ul: ({ children }) => (
    <ul style={{ fontSize: 14, lineHeight: 1.65, color: "#1a1a1a", margin: "0 0 14px", paddingLeft: 22 }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ fontSize: 14, lineHeight: 1.65, color: "#1a1a1a", margin: "0 0 14px", paddingLeft: 22 }}>{children}</ol>
  ),
  li: ({ children }) => <li style={{ marginBottom: 6 }}>{children}</li>,
  table: ({ children }) => (
    <div style={{
      background: "var(--cw-note)", border: ".5px solid var(--cw-note-bd)",
      borderRadius: 8, padding: "14px 16px", margin: "14px 0",
    }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--cw-mono)", fontSize: 11.5 }}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th style={{
      textAlign: "left", padding: "0 12px 8px 0",
      color: "var(--cw-ink3)", fontWeight: 500, fontSize: 10,
      letterSpacing: ".3px", textTransform: "uppercase",
      borderBottom: ".5px dashed var(--cw-note-bd)",
    }}>{children}</th>
  ),
  td: ({ children }) => (
    <td style={{
      textAlign: "left", padding: "6px 12px 6px 0",
      color: "var(--cw-ink1)", fontSize: 11.5,
      borderBottom: ".5px dashed var(--cw-note-bd)",
    }}>{children}</td>
  ),
  code: ({ className, children }) => {
    if (className) {
      return (
        <pre style={{ background: "var(--cw-cream)", borderRadius: 6, padding: "10px 14px", overflowX: "auto", margin: "8px 0", fontFamily: "var(--cw-mono)", fontSize: 12.5, color: "var(--cw-ink1)" }}>
          <code>{children}</code>
        </pre>
      );
    }
    return <code style={{ fontFamily: "var(--cw-mono)", fontSize: ".88em", background: "var(--cw-cream)", color: "var(--cw-ink1)", padding: "1px 6px", borderRadius: 4 }}>{children}</code>;
  },
  hr: () => <hr style={{ border: 0, borderTop: "1px solid var(--cw-note-bd)", margin: "20px 0" }} />,
  blockquote: ({ children }) => (
    <blockquote style={{ borderLeft: "2px solid var(--cw-leaf)", paddingLeft: 14, color: "var(--cw-ink2)", margin: "10px 0", fontStyle: "italic" }}>{children}</blockquote>
  ),
};

function ArtifactContent({ artifact }: { artifact: ArtifactData }) {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={artMarkdown}>
        {artifact.content}
      </ReactMarkdown>
    </div>
  );
}

function ArtifactEmpty() {
  return (
    <div style={{ maxWidth: 640, margin: "60px auto 0", textAlign: "center", color: "var(--cw-ink3)" }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--cw-note)", border: ".5px solid var(--cw-note-bd)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M10 13h4M10 17h4"/></svg>
      </div>
      <p style={{ fontSize: 13, margin: 0 }}>Pide un informe o reporte para verlo aquí</p>
    </div>
  );
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function ArtBtn({ children, title, onClick }: { children: React.ReactNode; title?: string; onClick?: () => void }) {
  return (
    <div
      title={title}
      onClick={onClick}
      style={{
        width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
        color: "#666", cursor: "pointer", borderRadius: 5,
      }}
    >
      {children}
    </div>
  );
}

function Modal({ title, sub, onClose, children }: { title: string; sub: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={(e) => { if ((e.target as HTMLElement).dataset.back) onClose(); }}
      data-back="1"
      style={{
        position: "absolute", inset: 0, background: "rgba(20,20,20,.38)",
        zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(2px)",
        animation: "cw-modal-fade .14s ease-out",
      }}
    >
      <div style={{
        width: 440, maxWidth: "90%", background: "#fff",
        borderRadius: 12,
        boxShadow: "0 20px 60px rgba(0,0,0,.22), 0 2px 6px rgba(0,0,0,.1)",
        overflow: "hidden",
        animation: "cw-modal-pop .18s cubic-bezier(.2,.7,.2,1.1)",
      }}>
        <div style={{ padding: "16px 20px 6px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", flex: 1 }}>{title}</span>
          <div onClick={onClose} style={{ width: 26, height: 26, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", cursor: "pointer" }}>
            <IcoX />
          </div>
        </div>
        <div style={{ padding: "0 20px 12px", fontSize: 12.5, color: "#777" }}>{sub}</div>
        <div style={{ padding: "6px 10px 10px" }}>{children}</div>
      </div>
    </div>
  );
}

const colorMap: Record<string, { bg: string; fg: string }> = {
  red:   { bg: "#fbefef", fg: "#c23030" },
  green: { bg: "#e6f3ec", fg: "#1e3a2f" },
  blue:  { bg: "var(--cw-blue)", fg: "var(--cw-blue-fg)" },
  amber: { bg: "var(--cw-warn)", fg: "var(--cw-warn-fg)" },
};

function ModalOpt({ color, icon, t1, t2, working, onClick }: {
  color?: string; icon: React.ReactNode; t1: string; t2: string; working?: boolean; onClick?: () => void;
}) {
  const c = color ? colorMap[color] : { bg: "var(--cw-blue)", fg: "var(--cw-blue-fg)" };
  return (
    <div
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, cursor: "pointer" }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 8, background: c.bg, color: c.fg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
        {working ? (
          <div style={{ position: "absolute", inset: 0, borderRadius: 8, border: "2px solid var(--cw-green)", borderTopColor: "transparent", animation: "cw-spin 1s linear infinite" }} />
        ) : icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, color: "#1a1a1a", fontWeight: 500 }}>{t1}</div>
        <div style={{ fontSize: 11.5, color: "#888", marginTop: 1 }}>{t2}</div>
      </div>
      <span style={{ color: "#ccc" }}>→</span>
    </div>
  );
}

function ModalFoot({ saving, label }: { saving: boolean; label: string }) {
  return (
    <div style={{ borderTop: "1px solid #eee", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, color: "#999", fontFamily: "var(--cw-mono)" }}>
      {saving ? (
        <div style={{ width: 11, height: 11, borderRadius: "50%", border: "1.5px solid #dde3f5", borderTopColor: "#4b7bec", animation: "cw-spin 1s linear infinite" }} />
      ) : (
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#7bc59c" }} />
      )}
      <span>{saving ? "procesando…" : label}</span>
    </div>
  );
}

// ─── Modal icons (inline SVG) ─────────────────────────────────────────────────
function IcoPDF() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M10 13h4M10 17h4"/></svg>; }
function IcoWA() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l4.9-1.4A10 10 0 1 0 12 2Zm5.3 14.4c-.2.6-1.3 1.2-1.8 1.3-.5.1-1.1.1-1.8-.1-1.5-.5-3.5-1.7-5.6-4.4-1.6-2.1-2-3.8-2.2-4.5-.2-.7.1-1.3.3-1.5.2-.3.5-.4.7-.4h.5c.1 0 .3 0 .5.4.2.4.6 1.5.7 1.6.1.2.1.3 0 .5l-.3.4-.4.4c-.1.1-.3.3-.1.5.1.3.7 1.1 1.5 1.9 1 .9 1.8 1.2 2.1 1.3.3.1.5.1.7-.1l.9-1c.2-.2.4-.2.6-.1.2.1 1.4.7 1.6.8.2.1.4.1.4.2.1.2.1.6-.1 1.2Z"/></svg>; }
function IcoDrive() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2.5 8 13l3 5h10l-6.5-10.5zM11 18H3l5.5-9.5"/></svg>; }
function IcoEmail() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/></svg>; }
function IcoRoutine() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/></svg>; }
function IcoMD() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 15V9l3 4 3-4v6M17 9v6M15 13l2 2 2-2"/></svg>; }
function IcoRich() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2M9 20h6M12 3v17"/></svg>; }
function IcoLink() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>; }
function IcoXlsx() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16M15 4v16"/></svg>; }
