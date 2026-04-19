"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { MessageRenderer, type ChatMessage } from "@/src/components/chat/message-renderer";
import { ChatEmptyState } from "@/src/components/chat/chat-empty-state";
import { ArtifactPanel, type ArtifactData } from "@/src/components/chat/artifacts-sidebar";
import { ChatSidebar } from "@/src/components/chat/chat-sidebar";

// ─── SSE types ────────────────────────────────────────────────────────────────

interface SSEEvent {
  type: "text_delta" | "thinking_delta" | "tool_use" | "tool_result" | "done" | "error";
  delta?: string;
  tool?: string;
  input?: unknown;
  result?: unknown;
  message?: string;
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

// ─── Context chips ────────────────────────────────────────────────────────────

const CONTEXT_CHIPS = ["/feedlot", "/FT", "/vaquillas", "/partos", "/tratamientos", "/ventas"];

// ─── ChatPanel ────────────────────────────────────────────────────────────────

export function ChatPanel({ predioId, initialMessage, nombrePredio, userName }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);
  const [sbOpen, setSbOpen] = useState(true);
  const [artWidth, setArtWidth] = useState(() => {
    try { return parseInt(localStorage.getItem("cw_art_w") ?? "") || 560; } catch { return 560; }
  });
  const [inputVal, setInputVal] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasSentInitial = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const isLoadingRef = useRef(false);
  const handleSendRef = useRef<((content: string) => void) | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSend = useCallback(async (content: string) => {
    if (!content.trim() || isLoadingRef.current) return;

    const userMessage: ChatMessage = { role: "user", content };
    const updatedMessages = [...messagesRef.current, userMessage];
    setMessages(updatedMessages);

    const assistantMessage: ChatMessage = { role: "assistant", content: "" };
    setMessages([...updatedMessages, assistantMessage]);

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, predio_id: predioId }),
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
            case "error":
              throw new Error(event.message);
          }
        }
      }

      // If the response is long enough and looks like a report, pin to artifact
      if (accumulatedContent.length > 400) {
        const title = accumulatedContent.split("\n")[0].replace(/^#+\s*/, "").trim() || "Informe";
        setActiveArtifact({ id: Date.now().toString(), title, content: accumulatedContent });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [predioId]);

  handleSendRef.current = handleSend;

  useEffect(() => {
    if (initialMessage && !hasSentInitial.current) {
      hasSentInitial.current = true;
      handleSendRef.current?.(initialMessage);
    }
  }, [initialMessage]);

  const handleStop = useCallback(() => { abortControllerRef.current?.abort(); }, []);

  // ── Textarea auto-resize ─────────────────────────────────────────────────────

  const onInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputVal(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (inputVal.trim()) {
        handleSend(inputVal);
        setInputVal("");
        if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
      }
    }
  };

  const submitInput = () => {
    if (inputVal.trim()) {
      handleSend(inputVal);
      setInputVal("");
      if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      background: "#fff", overflow: "hidden",
      position: "relative",
      fontFamily: "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)",
    }}>

      {/* ── macOS Titlebar ── */}
      <div style={{
        height: 38, background: "#ffffff", borderBottom: "1px solid #ececec",
        display: "flex", alignItems: "center", padding: "0 10px",
        flexShrink: 0, position: "relative", userSelect: "none", gap: 10,
      }}>
        {/* Traffic lights */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57", border: ".5px solid #e0443e", display: "block" }} />
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e", border: ".5px solid #dea123", display: "block" }} />
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840", border: ".5px solid #1aab29", display: "block" }} />
        </div>

        {/* Nav + hamburger */}
        <div style={{ display: "flex", gap: 2, marginLeft: 4 }}>
          <TlBtn title="Menú" onClick={() => setSbOpen((o) => !o)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </TlBtn>
          <TlBtn>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
          </TlBtn>
          <TlBtn>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
          </TlBtn>
        </div>

        {/* Center title */}
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          transform: "translate(-50%,-50%)",
          display: "flex", alignItems: "center", gap: 7,
          fontSize: 12.5, color: "#333", fontWeight: 500,
        }}>
          <span style={{ color: "#666", display: "flex" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"/></svg>
          </span>
          <span>{nombrePredio ?? "smartcow"}</span>
          <span style={{ color: "#999", margin: "0 2px" }}>/</span>
          <span>Nueva conversación</span>
          <span style={{ color: "#8a8a8a", marginLeft: 2 }}>▾</span>
        </div>

        {/* Right side */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center", paddingRight: 10 }}>
          {!isArtifactOpen && activeArtifact && (
            <div
              onClick={() => setIsArtifactOpen(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 10px", borderRadius: 6,
                background: "var(--cw-blue)", color: "var(--cw-blue-fg)",
                fontFamily: "var(--cw-mono)", fontSize: 11.5, fontWeight: 500,
                cursor: "pointer", border: "1px solid transparent",
              }}
              title="Reabrir Informe"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/></svg>
              <span>Informe</span>
            </div>
          )}
          <TlBtn title="Buscar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
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

        {/* Left pane — chat */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "#fff" }}>

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
                    onSuggestionClick={(text) => handleSend(text)}
                  />
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <MessageRenderer key={idx} message={msg} />
                ))
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
                gap: 6, flexWrap: "wrap", boxShadow: "0 1px 2px rgba(0,0,0,.02)",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, background: "#f5f5f5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#666", flexShrink: 0,
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/></svg>
                </div>
                {CONTEXT_CHIPS.map((chip) => (
                  <span key={chip} style={{
                    fontFamily: "var(--cw-mono)", fontSize: 12,
                    background: "var(--cw-blue)", color: "var(--cw-blue-fg)",
                    padding: "4px 10px", borderRadius: 8,
                    cursor: "pointer", fontWeight: 500,
                    border: "1px solid transparent",
                  }}>
                    {chip}
                  </span>
                ))}
                <span style={{ fontSize: 12, color: "var(--cw-ink3)", fontFamily: "var(--cw-mono)", padding: "4px 8px", cursor: "pointer" }}>
                  más ▾
                </span>
              </div>

              {/* Text input row */}
              <div style={{
                background: "#fff", border: "1px solid #e0e0e0", borderRadius: 10,
                padding: "10px 14px", display: "flex", alignItems: "flex-end",
                gap: 10, boxShadow: "0 1px 2px rgba(0,0,0,.02)",
              }}>
                <textarea
                  ref={textareaRef}
                  value={inputVal}
                  onChange={onInputChange}
                  onKeyDown={onKeyDown}
                  disabled={isLoading}
                  placeholder="Type / for commands"
                  rows={1}
                  style={{
                    flex: 1, border: "none", outline: "none", resize: "none",
                    fontFamily: "var(--cw-mono)", fontSize: 13.5,
                    color: "var(--cw-ink1)", background: "transparent",
                    lineHeight: 1.5, minHeight: 22, maxHeight: 200,
                    overflow: "hidden",
                  }}
                />
                {isLoading ? (
                  <div
                    onClick={handleStop}
                    title="Detener"
                    style={{
                      width: 14, height: 14, borderRadius: 3,
                      border: "1.5px solid #c8c8c8", cursor: "pointer", flexShrink: 0,
                    }}
                  />
                ) : (
                  <button
                    onClick={submitInput}
                    disabled={!inputVal.trim()}
                    style={{
                      width: 26, height: 26, borderRadius: 6,
                      background: inputVal.trim() ? "var(--cw-green)" : "#f0f0f0",
                      border: "none", cursor: inputVal.trim() ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, transition: "background .15s",
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={inputVal.trim() ? "#fff" : "#aaa"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Footer row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 6px 0", fontSize: 12.5, color: "#777" }}>
                <span style={{ color: "#b98c2e", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  SmartCow AI
                </span>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, color: "#777" }}>
                  <span style={{ fontFamily: "var(--cw-mono)", fontSize: 11.5 }}>gemma-4-31b</span>
                  <span style={{ color: "#aaa" }}>·</span>
                  <span style={{ fontFamily: "var(--cw-mono)", fontSize: 11.5 }}>OpenRouter</span>
                  {isLoading && (
                    <div style={{
                      width: 12, height: 12, borderRadius: "50%",
                      border: "1.5px solid #dde3f5", borderTopColor: "#4b7bec",
                      animation: "cw-spin 1s linear infinite",
                    }} />
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Drag divider */}
        {isArtifactOpen && (
          <div
            onMouseDown={onDragStart}
            title="Arrastrar para redimensionar"
            style={{
              width: 10, flexShrink: 0, cursor: "col-resize",
              position: "relative", background: "transparent", zIndex: 2,
            }}
          >
            <div style={{
              position: "absolute", left: "50%", top: 0, bottom: 0,
              width: 1, background: "#ececec", transform: "translateX(-.5px)",
            }} />
          </div>
        )}

        {/* Right pane — artifact */}
        {isArtifactOpen && (
          <div style={{
            width: artWidth, background: "#fff", display: "flex",
            flexDirection: "column", flexShrink: 0,
            borderTopLeftRadius: 10, borderTopRightRadius: 10,
            marginTop: 6,
            boxShadow: "-1px 0 0 rgba(0,0,0,.05), -6px -2px 18px rgba(0,0,0,.07)",
            overflow: "hidden", position: "relative",
          }}>
            <ArtifactPanel
              artifact={activeArtifact}
              onHide={() => setIsArtifactOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Titlebar button ─────────────────────────────────────────────────────────

function TlBtn({ children, title, onClick }: { children: React.ReactNode; title?: string; onClick?: () => void }) {
  return (
    <div
      title={title}
      onClick={onClick}
      style={{
        width: 22, height: 22,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#b0b0b0", cursor: "pointer", borderRadius: 4,
      }}
    >
      {children}
    </div>
  );
}
