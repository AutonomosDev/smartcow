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

const markdownComponents: Components = {
  p({ children }) {
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {message.content}
      </ReactMarkdown>
    </div>
  );
}
