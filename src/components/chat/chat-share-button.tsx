"use client";

import { Share2, FileDown } from "lucide-react";
import type { ChatMessage } from "@/src/components/chat/message-renderer";

interface ChatShareButtonProps {
  messages?: ChatMessage[];
  nombrePredio?: string | null;
}

export function ChatShareButton({ messages = [], nombrePredio }: ChatShareButtonProps) {
  const hasMessages = messages.length > 0;

  const handleExport = () => {
    if (!hasMessages) return;

    const fecha = new Date().toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const messagesHtml = messages
      .filter((m) => m.content.trim())
      .map((m) => {
        const isUser = m.role === "user";
        const label = isUser ? "Tú" : "smartCow";
        const bgColor = isUser ? "#f3f4f6" : "#ffffff";
        const borderColor = isUser ? "#e5e7eb" : "#d1fae5";
        const labelColor = isUser ? "#374151" : "#065f46";
        // Escape HTML and convert newlines to <br>
        const escaped = m.content
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\n/g, "<br>");
        return `
          <div style="margin-bottom:16px;padding:14px 16px;background:${bgColor};border:1px solid ${borderColor};border-radius:10px;">
            <div style="font-size:11px;font-weight:700;color:${labelColor};margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em;">${label}</div>
            <div style="font-size:14px;color:#1f2937;line-height:1.6;">${escaped}</div>
          </div>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conversación smartCow — ${fecha}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #ffffff;
      color: #1f2937;
      max-width: 760px;
      margin: 0 auto;
      padding: 32px 24px;
    }
    .sc-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #d1fae5;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .sc-logo {
      font-size: 20px;
      font-weight: 800;
      color: #064e3b;
      letter-spacing: -0.5px;
    }
    .sc-meta {
      font-size: 12px;
      color: #6b7280;
      text-align: right;
    }
    .sc-footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
      text-align: center;
    }
    @media print {
      body { padding: 16px; }
      @page { margin: 20mm; }
    }
  </style>
</head>
<body>
  <div class="sc-header">
    <div class="sc-logo">smartCow</div>
    <div class="sc-meta">
      ${nombrePredio ? `<div style="font-weight:600;color:#374151;">${nombrePredio}</div>` : ""}
      <div>${fecha}</div>
    </div>
  </div>
  <div class="sc-messages">
    ${messagesHtml}
  </div>
  <div class="sc-footer">Generado por smartCow — Asistente ganadero IA</div>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    // Revocar la URL después de que la ventana la haya cargado
    if (win) {
      win.onload = () => URL.revokeObjectURL(url);
    } else {
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={!hasMessages}
      title={hasMessages ? "Exportar conversación como PDF" : "Sin mensajes para exportar"}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {hasMessages ? <FileDown size={14} /> : <Share2 size={14} />}
      <span>Compartir</span>
    </button>
  );
}
