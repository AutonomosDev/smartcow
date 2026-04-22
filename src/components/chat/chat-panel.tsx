"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { MessageRenderer, type ChatMessage } from "@/src/components/chat/message-renderer";
import { ChatEmptyState } from "@/src/components/chat/chat-empty-state";
import { ArtifactPanel, type ArtifactData } from "@/src/components/chat/artifacts-sidebar";
import { ChatSidebar } from "@/src/components/chat/chat-sidebar";
import { NuevaTareaModal } from "@/src/components/chat/nueva-tarea-modal";
import { MasDropdown } from "@/src/components/chat/mas-dropdown";
import { PromptInputBox } from "@/src/components/ui/ai-prompt-box";

// ─── SSE types ────────────────────────────────────────────────────────────────

interface ArtifactRow { label: string; value: string; color?: "ok" }
interface ArtifactKpi  { val: string; lbl: string; color?: string }
interface ArtifactItem { text: string }

interface SSEArtifact {
  type: "table" | "kpi" | "alerts" | "chart" | "dashboard";
  title?: string;
  rows?: ArtifactRow[];
  kpis?: ArtifactKpi[];
  items?: ArtifactItem[];
}

interface SSEEvent {
  type: "text_delta" | "thinking_delta" | "tool_use" | "tool_result" | "done" | "error" | "artifact_block";
  delta?: string;
  tool?: string;
  input?: unknown;
  result?: unknown;
  message?: string;
  artifact?: SSEArtifact;
}

const WRITE_TOOLS = new Set(["registrar_pesaje", "registrar_parto"]);

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  predioId: number;
  initialMessage?: string;
  nombrePredio?: string | null;
  userName?: string | null;
  className?: string;
}

// ─── ChatPanel ────────────────────────────────────────────────────────────────

export function ChatPanel({ predioId, initialMessage, nombrePredio, userName }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);
  const [turnArtifacts, setTurnArtifacts] = useState<ArtifactData[]>([]);
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);
  const [sbOpen, setSbOpen] = useState(true);
  const [tareaModalOpen, setTareaModalOpen] = useState(false);
  const [currentSessionTitle, setCurrentSessionTitle] = useState<string>("Nueva conversación");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [artWidth, setArtWidth] = useState(() => {
    try { return parseInt(localStorage.getItem("cw_art_w") ?? "") || 560; } catch { return 560; }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasSentInitial = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const isLoadingRef = useRef(false);
  const handleSendRef = useRef<((content: string, files?: File[], webSearch?: boolean) => void) | null>(null);

  const dragRef = useRef({ dragging: false, startX: 0, startW: 0 });

  messagesRef.current = messages;
  isLoadingRef.current = isLoading;

  // ── Drag resize ──────────────────────────────────────────────────────────────

  const onDragStart = useCallback((e: React.MouseEvent) => {
    dragRef.current = { dragging: true, startX: e.clientX, startW: artWidth };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [artWidth]);

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
      try { localStorage.setItem("cw_art_w", String(artWidth)); } catch {}
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [artWidth]);

  // ── Scroll to bottom ─────────────────────────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ── handleSend ───────────────────────────────────────────────────────────────

  const parseFile = useCallback(async (file: File): Promise<{ columnas: string[]; filas: Record<string, unknown>[] } | null> => {
    try {
      if (file.name.endsWith(".csv") || file.type === "text/csv") {
        const Papa = (await import("papaparse")).default;
        return new Promise((resolve) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
              const filas = result.data as Record<string, unknown>[];
              const columnas = result.meta.fields ?? [];
              resolve({ columnas, filas });
            },
            error: () => resolve(null),
          });
        });
      }
      if (file.name.match(/\.xlsx?$/i)) {
        const ExcelJS = (await import("exceljs")).default;
        const wb = new ExcelJS.Workbook();
        const buf = await file.arrayBuffer();
        await wb.xlsx.load(buf);
        const ws = wb.worksheets[0];
        if (!ws) return null;
        const headerRow = ws.getRow(1).values as (string | undefined)[];
        const columnas = (headerRow.slice(1) as string[]).filter(Boolean);
        const filas: Record<string, unknown>[] = [];
        ws.eachRow((row, rowNum) => {
          if (rowNum === 1) return;
          const obj: Record<string, unknown> = {};
          (row.values as unknown[]).slice(1).forEach((cell, i) => {
            if (columnas[i]) obj[columnas[i]] = cell;
          });
          filas.push(obj);
        });
        return { columnas, filas };
      }
    } catch {
      // parsing failed
    }
    return null;
  }, []);

  const handleSend = useCallback(async (content: string, files?: File[], webSearch?: boolean) => {
    if ((!content.trim() && (!files || files.length === 0)) || isLoadingRef.current) return;

    // Derive session title from first user message
    if (messagesRef.current.length === 0) {
      const titleText = content.trim();
      setCurrentSessionTitle(titleText.length > 42 ? titleText.slice(0, 42) + "…" : titleText);
    }

    // Upload files if present
    const attachmentIds: number[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const parsed = await parseFile(file);
        if (!parsed) continue;
        try {
          const res = await fetch("/api/chat/upload-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              mimeType: file.type || "text/csv",
              columnas: parsed.columnas,
              filas: parsed.filas,
              predio_id: predioId,
            }),
          });
          if (res.ok) {
            const data = await res.json() as { id: number };
            attachmentIds.push(data.id);
          }
        } catch {
          // upload failed — continue without attachment
        }
      }
    }

    const userMessage: ChatMessage = { role: "user", content: content.trim() || `[Archivo adjunto: ${files?.map(f => f.name).join(", ")}]` };
    const updatedMessages = [...messagesRef.current, userMessage];
    setMessages(updatedMessages);
    setTurnArtifacts([]);

    const assistantMessage: ChatMessage = { role: "assistant", content: "" };
    setMessages([...updatedMessages, assistantMessage]);

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const requestBody: Record<string, unknown> = {
        messages: updatedMessages,
        predio_id: predioId,
      };
      if (attachmentIds.length > 0) requestBody.attachment_ids = attachmentIds;
      if (webSearch) requestBody.webSearch = webSearch;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event: SSEEvent = JSON.parse(line.slice(6));

          switch (event.type) {
            case "text_delta":
              accumulatedContent += event.delta ?? "";
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                return last?.role === "assistant"
                  ? [...prev.slice(0, -1), { ...last, content: last.content + (event.delta ?? "") }]
                  : prev;
              });
              break;
            case "tool_use":
              if (WRITE_TOOLS.has(event.tool!)) {
                // write tools don't generate artifact
              }
              break;
            case "artifact_block":
              if (event.artifact && typeof event.artifact === "object") {
                const art: ArtifactData = {
                  id: `art_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                  title: event.artifact.title ?? "Informe",
                  content: JSON.stringify(event.artifact),
                  kind: event.artifact.type,
                };
                setActiveArtifact(art);
                setTurnArtifacts((prev) => [...prev, art]);
                setIsArtifactOpen(true);
              }
              break;
            case "error":
              throw new Error(event.message);
          }
        }
      }

      // Artifact is set directly via artifact_block SSE event — no fallback heuristic
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [predioId, parseFile]);

  handleSendRef.current = handleSend;

  // AUT-268 — Atajo SQL directo sin LLM. Renderiza respuesta + artifact.
  const handleQuickCommand = useCallback(async (command: string, label: string) => {
    if (isLoadingRef.current) return;
    setCurrentSessionTitle(label);

    const userMessage: ChatMessage = { role: "user", content: `/${command}` };
    const assistantMessage: ChatMessage = { role: "assistant", content: "" };
    setMessages([...messagesRef.current, userMessage, assistantMessage]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat/quick-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, predioId }),
      });
      if (!res.ok) throw new Error(`quick-query ${res.status}`);
      const result = await res.json() as {
        label: string;
        data: unknown;
        artifact: { type: "table" | "kpi" | "alerts"; title?: string } | null;
        latencyMs: number;
      };

      const text = `Respuesta directa — ${result.label} (${result.latencyMs}ms, sin LLM)`;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role !== "assistant") return prev;
        return [...prev.slice(0, -1), { ...last, content: text }];
      });

      if (result.artifact) {
        setActiveArtifact({
          id: `art_${Date.now()}`,
          title: result.artifact.title ?? result.label,
          content: JSON.stringify(result.artifact),
          kind: result.artifact.type,
        });
        setIsArtifactOpen(true);
      }
    } catch (err) {
      console.error("[quick-query]", err);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role !== "assistant") return prev;
        return [...prev.slice(0, -1), { ...last, content: "Error ejecutando comando rápido." }];
      });
    } finally {
      setIsLoading(false);
    }
  }, [predioId]);

  useEffect(() => {
    if (initialMessage && !hasSentInitial.current) {
      hasSentInitial.current = true;
      handleSendRef.current?.(initialMessage);
    }
  }, [initialMessage]);

  const handleStop = useCallback(() => { abortControllerRef.current?.abort(); }, []);


  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      background: "#fff", overflow: "hidden",
      position: "relative",
      fontFamily: "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)",
    }}>

      <NuevaTareaModal open={tareaModalOpen} onClose={() => setTareaModalOpen(false)} />

      {/* ── Titlebar ── */}
      <div style={{
        height: 48, background: "#ffffff",
        display: "flex", alignItems: "center", padding: "0 12px",
        flexShrink: 0, position: "relative", userSelect: "none", gap: 10,
      }}>
        {/* Nav + hamburger — no traffic lights */}
        <div style={{ display: "flex", gap: 2 }}>
          <TlBtn title="Menú" onClick={() => setSbOpen((o) => !o)}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </TlBtn>
          <TlBtn>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
          </TlBtn>
          <TlBtn>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
          </TlBtn>
        </div>

        {/* Center title */}
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          transform: "translate(-50%,-50%)",
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 15, color: "#333", fontWeight: 500,
          whiteSpace: "nowrap", maxWidth: "50%", overflow: "hidden",
        }}>
          <span style={{ color: "#666", display: "flex", flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"/></svg>
          </span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", flexShrink: 0 }}>{activeFolder ?? "smartcow"}</span>
          <span style={{ color: "#bbb", flexShrink: 0 }}>/</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", color: "#555" }}>{currentSessionTitle}</span>
          <span style={{ color: "#8a8a8a", flexShrink: 0 }}>▾</span>
        </div>

        {/* Right side */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center", paddingRight: 10 }}>
          <TlBtn
            title="Nuevo chat"
            onClick={() => {
              setMessages([]);
              setCurrentSessionTitle("Nueva conversación");
              setActiveFolder(null);
              setActiveArtifact(null);
              setIsArtifactOpen(false);
              setSearchOpen(false);
              setSearchQuery("");
              hasSentInitial.current = false;
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
            </svg>
          </TlBtn>
          <TlBtn
            title={isArtifactOpen ? "Cerrar informe" : "Abrir informe"}
            onClick={() => setIsArtifactOpen((o) => !o)}
            active={isArtifactOpen}
          >
            <svg
              width="19" height="19" viewBox="0 0 24 24"
              fill="none" stroke="currentColor"
              strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </TlBtn>
          <TlBtn
            title={searchOpen ? "Cerrar búsqueda" : "Buscar en la conversación"}
            onClick={() => { setSearchOpen((o) => !o); if (searchOpen) setSearchQuery(""); }}
            active={searchOpen}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          </TlBtn>
        </div>
      </div>

      {/* ── Sidebar overlay ── */}
      <ChatSidebar
        open={sbOpen}
        onClose={() => setSbOpen(false)}
        userName={userName}
        nombrePredio={nombrePredio}
      />

      {/* ── Body split ── */}
      <div style={{ flex: 1, display: "flex", minHeight: 0, background: "#fff" }}>

        {/* Left pane — chat (siempre blanco, el crema del padre solo rodea el artifact derecho) */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          minWidth: 0, background: "#fff",
        }}>

          {/* Search bar (toggle) */}
          {searchOpen && (
            <div style={{
              borderBottom: "1px solid #ececec", background: "#fafafa",
              padding: "8px 28px", display: "flex", alignItems: "center", gap: 8,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en la conversación..."
                style={{
                  flex: 1, border: "none", outline: "none", background: "transparent",
                  fontSize: 13.5, color: "#333",
                  fontFamily: "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)",
                }}
              />
              {searchQuery && (
                <span style={{ fontSize: 11.5, color: "#888" }}>
                  {messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())).length} coincidencias
                </span>
              )}
              <span
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                style={{ cursor: "pointer", color: "#888", fontSize: 18, lineHeight: 1, padding: "0 4px" }}
              >×</span>
            </div>
          )}

          {/* Messages scroll */}
          <div
            className="cw-scrollbar"
            style={{ flex: 1, overflowY: "auto", padding: "18px 28px 14px" }}
          >
            <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
              {messages.length === 0 ? (
                <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", minHeight: 320 }}>
                  <ChatEmptyState
                    nombrePredio={nombrePredio}
                    userName={userName}
                    onSuggestionClick={(text, folderLabel) => {
                      if (folderLabel) setActiveFolder(folderLabel);
                      handleSend(text);
                    }}
                    onQuickCommand={(command, label) => {
                      setActiveFolder(label);
                      handleQuickCommand(command, label);
                    }}
                  />
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const hidden = searchOpen && searchQuery.trim() !== "" &&
                    !msg.content.toLowerCase().includes(searchQuery.toLowerCase());
                  return (
                    <div key={idx} style={{ opacity: hidden ? 0.2 : 1, transition: "opacity .15s" }}>
                      <MessageRenderer message={msg} />
                    </div>
                  );
                })
              )}

              {isLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#444", fontSize: 13 }}>
                  {[0, 200, 400].map((delay) => (
                    <div
                      key={delay}
                      style={{
                        display: "inline-block", width: 16, height: 3, borderRadius: 2,
                        background: "linear-gradient(90deg,#ddd,#999,#ddd)",
                        backgroundSize: "200% 100%",
                        animation: `cw-shimmer 1.3s infinite linear ${delay}ms`,
                      }}
                    />
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} style={{ height: 4 }} />
            </div>
          </div>

          {/* Composer */}
          <div style={{ padding: "10px 28px 14px", flexShrink: 0, background: "#fff" }}>
            <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 4 }}>

              {/* Context chips row */}
              <div style={{
                background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10,
                padding: "8px 10px", display: "flex", alignItems: "center",
                gap: 6, boxShadow: "0 1px 2px rgba(0,0,0,.02)",
              }}>
                {/* Rayo — Nueva tarea */}
                <div
                  onClick={() => setTareaModalOpen(true)}
                  title="Nueva tarea"
                  style={{
                    width: 22, height: 22, borderRadius: 6, background: "#f5f5f5",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#666", flexShrink: 0, cursor: "pointer",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/></svg>
                </div>
                <MasDropdown onSuggestionClick={(text) => { handleSend(text); }} />
              </div>

              {/* Text input — PromptInputBox (paperclip + web search + mic) */}
              <PromptInputBox
                isLoading={isLoading}
                onSend={(msg, files, webSearch) => handleSend(msg, files, webSearch)}
                onStop={handleStop}
                placeholder="Pregunta sobre tu lote..."
              />

              {/* Footer row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 6px 0", fontSize: 12.5, color: "#777" }}>
                {isLoading && (
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%",
                    border: "1.5px solid #dde3f5", borderTopColor: "#4b7bec",
                    animation: "cw-spin 1s linear infinite",
                  }} />
                )}
                <span style={{
                  marginLeft: "auto",
                  color: "#b98c2e", fontWeight: 500, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  smartCow AI
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* Drag divider (handle invisible, sigue funcional) */}
        {isArtifactOpen && (
          <div
            onMouseDown={onDragStart}
            title="Arrastrar para redimensionar"
            style={{
              width: 10, flexShrink: 0, cursor: "col-resize",
              background: "transparent", zIndex: 2,
            }}
          />
        )}

        {/* Right pane — artifact (efecto cuaderno: tarjeta con margin + radius + box-shadow envolvente) */}
        {isArtifactOpen && (
          <div style={{
            width: artWidth, background: "#fff", display: "flex",
            flexDirection: "column", flexShrink: 0,
            margin: "10px 10px 10px 0",
            borderRadius: 14,
            boxShadow: "0 0 0 .5px rgba(0,0,0,.05), 0 2px 8px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.08)",
            overflow: "hidden", position: "relative",
          }}>
            <ArtifactPanel
              artifact={activeArtifact}
              artifacts={turnArtifacts}
              onHide={() => setIsArtifactOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Titlebar button ─────────────────────────────────────────────────────────

function TlBtn({ children, title, onClick, active }: { children: React.ReactNode; title?: string; onClick?: () => void; active?: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 26, height: 26,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: active ? "#333" : hover ? "#555" : "#b0b0b0",
        background: active ? "#f0f0f0" : hover ? "#f7f7f7" : "transparent",
        cursor: "pointer", borderRadius: 6,
        transition: "background .12s, color .12s",
      }}
    >
      {children}
    </div>
  );
}
