"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Markdown components — spec prose styles ──────────────────────────────────

// ─── Hint line detection ──────────────────────────────────────────────────────
// Detecta líneas tipo "💡 /novillos" o "💡 /feedlot" para renderizarlas
// con estilo discreto (opacity 0.6, text-sm, mono en el /comando).

function extractTextContent(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractTextContent).join("");
  if (React.isValidElement(node) && node.props) {
    const props = node.props as { children?: React.ReactNode };
    return extractTextContent(props.children);
  }
  return "";
}

function isHintLine(children: React.ReactNode): boolean {
  const text = extractTextContent(children).trim();
  // Coincide con "💡 /comando" — puede tener texto extra después del comando
  return /^💡\s+\/\S/.test(text);
}

// Renderiza la línea 💡 separando el texto antes del /comando y el /comando mismo.
// Ejemplo: "💡 /novillos" → <span>💡 </span><span class=mono>/novillos</span>
function HintLine({ children }: { children: React.ReactNode }) {
  const text = extractTextContent(children).trim();
  // Dividir en parte pre-comando y /comando
  const match = text.match(/^(💡\s+)(\/\S+)(.*)$/);
  if (!match) {
    // Fallback: render completo con estilo discreto
    return (
      <p style={{
        fontSize: 12, lineHeight: 1.4, margin: 0, opacity: 0.6,
        fontFamily: "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)",
        color: "var(--cw-ink2, var(--cw-ink1))",
      }}>
        {children}
      </p>
    );
  }
  const [, prefix, command, suffix] = match;
  return (
    <p style={{
      fontSize: 12, lineHeight: 1.4, margin: 0, opacity: 0.6,
      fontFamily: "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)",
      color: "var(--cw-ink2, var(--cw-ink1))",
    }}>
      <span>{prefix}</span>
      <span style={{ fontFamily: "var(--cw-mono)", fontSize: 11.5 }}>{command}</span>
      {suffix && <span>{suffix}</span>}
    </p>
  );
}

const markdownComponents: Components = {
  p({ children }) {
    if (isHintLine(children)) {
      return <HintLine>{children}</HintLine>;
    }
    return (
      <p style={{
        fontSize: 14, lineHeight: 1.55, color: "var(--cw-ink1)",
        margin: 0, fontFamily: "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)",
      }}>
        {children}
      </p>
    );
  },

  strong({ children }) {
    return <strong style={{ fontWeight: 600, color: "var(--cw-ink1)" }}>{children}</strong>;
  },

  ul({ children }) {
    return (
      <ul style={{
        fontSize: 14, lineHeight: 1.6, color: "var(--cw-ink1)",
        margin: 0, paddingLeft: 22,
      }}>
        {children}
      </ul>
    );
  },

  ol({ children }) {
    return (
      <ol style={{
        fontSize: 14, lineHeight: 1.6, color: "var(--cw-ink1)",
        margin: 0, paddingLeft: 22,
      }}>
        {children}
      </ol>
    );
  },

  li({ children }) {
    return <li style={{ marginBottom: 4 }}>{children}</li>;
  },

  h1({ children }) {
    return (
      <h1 style={{
        fontSize: 20, fontWeight: 700, letterSpacing: "-.3px",
        margin: "0 0 16px", color: "var(--cw-ink1)", lineHeight: 1.3,
      }}>
        {children}
      </h1>
    );
  },

  h2({ children }) {
    return (
      <h2 style={{
        fontSize: 16, fontWeight: 700, margin: "18px 0 8px",
        color: "var(--cw-ink1)", letterSpacing: "-.2px",
      }}>
        {children}
      </h2>
    );
  },

  h3({ children }) {
    return (
      <h3 style={{
        fontSize: 14, fontWeight: 600, margin: "14px 0 6px",
        color: "var(--cw-ink1)",
      }}>
        {children}
      </h3>
    );
  },

  // Data table → chat-note styled block
  table({ children }) {
    return (
      <div style={{
        background: "var(--cw-note)",
        border: ".5px solid var(--cw-note-bd)",
        borderRadius: 8,
        padding: "12px 14px",
        margin: "4px 0",
        fontFamily: "var(--cw-mono)",
        fontSize: 11.5,
        lineHeight: 1.6,
        color: "var(--cw-ink1)",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>{children}</table>
      </div>
    );
  },

  thead({ children }) {
    return <thead>{children}</thead>;
  },

  tbody({ children }) {
    return <tbody>{children}</tbody>;
  },

  th({ children }) {
    return (
      <th style={{
        textAlign: "left",
        padding: "0 18px 7px 0",
        color: "var(--cw-ink3)",
        fontWeight: 500,
        fontSize: 10,
        letterSpacing: ".3px",
        textTransform: "uppercase",
        borderBottom: ".5px dashed var(--cw-note-bd)",
      }}>
        {children}
      </th>
    );
  },

  td({ children }) {
    return (
      <td style={{
        textAlign: "left",
        padding: "5px 18px 5px 0",
        color: "var(--cw-ink1)",
        borderBottom: ".5px dashed var(--cw-note-bd)",
        fontSize: 11.5,
      }}>
        {children}
      </td>
    );
  },

  tr({ children }) {
    return <tr>{children}</tr>;
  },

  code({ className, children }) {
    const isBlock = !!className;
    if (isBlock) {
      return (
        <pre style={{
          background: "var(--cw-cream)",
          borderRadius: 6,
          padding: "10px 14px",
          overflowX: "auto",
          margin: "8px 0",
          fontFamily: "var(--cw-mono)",
          fontSize: 12.5,
          color: "var(--cw-ink1)",
        }}>
          <code>{children}</code>
        </pre>
      );
    }
    return (
      <code style={{
        fontFamily: "var(--cw-mono)",
        fontSize: ".88em",
        background: "var(--cw-cream)",
        color: "var(--cw-ink1)",
        padding: "1px 6px",
        borderRadius: 4,
        whiteSpace: "nowrap",
      }}>
        {children}
      </code>
    );
  },

  blockquote({ children }) {
    return (
      <blockquote style={{
        borderLeft: "2px solid var(--cw-leaf)",
        paddingLeft: 14,
        color: "var(--cw-ink2)",
        margin: "10px 0",
        fontStyle: "italic",
      }}>
        {children}
      </blockquote>
    );
  },

  hr() {
    return <hr style={{ border: 0, borderTop: "1px solid var(--cw-note-bd)", margin: "16px 0" }} />;
  },
};

// ─── Artifact stripping ───────────────────────────────────────────────────────
// El LLM emite bloques ```artifact\n{JSON}\n``` que el backend parsea y envía
// como evento SSE artifact_block al panel derecho. Esos bloques NO deben aparecer
// en el cuerpo del mensaje. Los removemos aquí.
//
// Durante streaming, si el bloque está abierto pero no cerrado, cortamos el
// texto en el marcador de apertura — evita que el JSON parcial se vea.

function stripArtifactBlocks(content: string): string {
  // Paso 1: remover bloques ```artifact ... ``` completos
  let cleaned = content.replace(/```artifact\s*\n[\s\S]*?\n```\s*/g, "");
  // Paso 2: si hay un ```artifact abierto sin cerrar, cortar desde ahí
  const openIdx = cleaned.indexOf("```artifact");
  if (openIdx !== -1) cleaned = cleaned.slice(0, openIdx);
  return cleaned.trimEnd();
}

// ─── MessageRenderer ──────────────────────────────────────────────────────────

interface MessageRendererProps {
  message: ChatMessage;
}

export function MessageRenderer({ message }: MessageRendererProps) {
  if (message.role === "user") {
    return (
      <div style={{ display: "flex", marginBottom: 2 }}>
        <div style={{
          background: "var(--cw-blue)",
          color: "var(--cw-blue-fg)",
          padding: "8px 12px",
          borderRadius: 8,
          fontFamily: "var(--cw-mono)",
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: ".2px",
          lineHeight: 1.4,
          border: "1px solid transparent",
          cursor: "default",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message — flat prose, no bubble/avatar
  const visibleContent = stripArtifactBlocks(message.content);
  if (!visibleContent) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {visibleContent}
      </ReactMarkdown>
    </div>
  );
}
