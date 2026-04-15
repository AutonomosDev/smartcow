"use client";

/**
 * src/components/chat/chat-page-client-v3.tsx
 * Chat UI V2 — sidebar historial + estilo SmartCow DS.
 *
 * Layout:
 * - Sidebar 220px: historial de conversaciones (Hoy/Ayer/Esta semana)
 * - Chat main: fondo #f8f6f1, max-w 680px centrado
 * - Header: vacío | smartCow + chevron | share + search + X round
 * - Empty state: icono SC + título personalizado + sugerencias 2x2
 * - Burbujas: usuario #1e3a2f, AI #fff con border
 * - Input: bg-white border #dddad5 radius 14px
 *
 * NO toca: APIs, Firebase auth, SSE streaming (reutiliza lógica de chat-panel.tsx),
 *          MessageRenderer, ArtifactsSidebar
 * Ticket: AUT-209
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatSidebarV3 } from "@/src/components/chat/chat-sidebar-v3";
import { MessageRenderer, type ChatMessage } from "@/src/components/chat/message-renderer";
import { mapToolResultToArtifact } from "@/src/components/generative/artifact-mapper";
import { FontProvider } from "@/src/providers/font-provider";
import { ChevronDown, Share2, Search, X } from "lucide-react";

// ─── SSE event type ──────────────────────────────────────────────────────────

interface SSEEvent {
  type: "text_delta" | "thinking_delta" | "tool_use" | "tool_result" | "done" | "error";
  delta?: string;
  tool?: string;
  input?: unknown;
  result?: unknown;
  message?: string;
}

// ─── Sugerencias empty state ─────────────────────────────────────────────────

const SUGGESTIONS = [
  { title: "¿Cómo van los lotes esta semana?", desc: "Resumen GDP y alertas" },
  { title: "¿Cuánto gano si vendo hoy?", desc: "Proyección financiera en vivo" },
  { title: "¿Qué animales necesitan atención?", desc: "Alertas sanitarias y GDP bajo" },
  { title: "¿Cuánto me cuesta el predio hoy?", desc: "Costos y proyección mensual" },
];

// ─── Empty state V3 ──────────────────────────────────────────────────────────

function EmptyStateV3({
  userName,
  orgName,
  onSend,
}: {
  userName?: string | null;
  orgName?: string | null;
  onSend: (text: string) => void;
}) {
  const firstName = userName?.split(" ")[0] ?? "JP";
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        width: "100%",
        maxWidth: 680,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          background: "#1e3a2f",
          borderRadius: 13,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="8" stroke="#7ecfa0" strokeWidth="1.8" />
          <path d="M8 11h6M11 8v6" stroke="#7ecfa0" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#1a1a1a",
          textAlign: "center",
          marginBottom: 4,
          letterSpacing: "-0.4px",
        }}
      >
        ¿En qué te ayudo, {firstName}?
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#999",
          textAlign: "center",
          marginBottom: 22,
        }}
      >
        {orgName ?? "SmartCow"} · Pregunta sobre tus lotes, animales o finanzas
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
          width: "100%",
        }}
      >
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            onClick={() => onSend(s.title)}
            style={{
              background: "#fff",
              border: "0.5px solid #e0ddd8",
              borderRadius: 10,
              padding: "10px 13px",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e3a2f";
              (e.currentTarget as HTMLButtonElement).style.background = "#f8f6f1";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#e0ddd8";
              (e.currentTarget as HTMLButtonElement).style.background = "#fff";
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>
              {s.title}
            </div>
            <div style={{ fontSize: 11, color: "#aaa" }}>{s.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Thinking dots ───────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "4px 0", alignItems: "center" }}>
      {[0, 200, 400].map((delay) => (
        <div
          key={delay}
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#1e3a2f",
            opacity: 0.2,
            animation: `sc-blink 1.4s ${delay}ms infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes sc-blink {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

// ─── Input bar V3 ────────────────────────────────────────────────────────────

interface InputBarProps {
  isLoading: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

function InputBarV3({ isLoading, onSend, onStop }: InputBarProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!text.trim() || isLoading) return;
    onSend(text.trim());
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  return (
    <div
      style={{
        padding: "8px 20px 14px",
        background: "#f8f6f1",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 680 }}>
        <div
          style={{
            background: "#fff",
            border: "0.5px solid #dddad5",
            borderRadius: 14,
            padding: "11px 14px",
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta a SmartCow..."
            rows={1}
            style={{
              flex: 1,
              fontSize: 13,
              color: text ? "#1a1a1a" : "#aaa",
              fontFamily: "inherit",
              lineHeight: 1.4,
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              minHeight: 20,
              maxHeight: 160,
              overflowY: "auto",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
            {/* Buscar */}
            <button style={inBtnStyle} title="Buscar en predio">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="#ccc" strokeWidth="1.4" />
                <path d="M10 10l2 2" stroke="#ccc" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            {/* Adjuntar */}
            <button style={inBtnStyle} title="Adjuntar archivo">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v9M4 7l3 3 3-3M2 12h10" stroke="#ccc" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {/* Enviar / Stop */}
            {isLoading ? (
              <button
                onClick={onStop}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "#1e3a2f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  cursor: "pointer",
                }}
                title="Detener"
              >
                <div style={{ width: 8, height: 8, background: "#fff", borderRadius: 2 }} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!text.trim()}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: text.trim() ? "#1e3a2f" : "#e8e5df",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  cursor: text.trim() ? "pointer" : "default",
                  transition: "background 0.15s",
                }}
                title="Enviar"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: 10,
            color: "#ccc",
            marginTop: 6,
          }}
        >
          SmartCow puede cometer errores. Verifica información importante.
        </div>
      </div>
    </div>
  );
}

const inBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 7,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  cursor: "pointer",
};

// ─── HdrBtn ──────────────────────────────────────────────────────────────────

function HdrBtn({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <button
      title={title}
      style={{
        width: 26,
        height: 26,
        borderRadius: 7,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "none",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#f0ede8";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}

// ─── AI avatar ───────────────────────────────────────────────────────────────

function AiAvatar() {
  return (
    <div
      style={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: "#1e3a2f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: 1,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5" stroke="#7ecfa0" strokeWidth="1.5" />
        <path d="M5 7h4M7 5v4" stroke="#7ecfa0" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ChatPageClientV3Props {
  predioId: number;
  initialMessage?: string;
  initialConversationId?: number;
  initialMessages?: ChatMessage[];
  nombrePredio: string | null;
  userName: string | null;
  userEmail: string | null;
}

// ─── ChatPageClientV3 ────────────────────────────────────────────────────────

export function ChatPageClientV3({
  predioId,
  initialMessage,
  initialConversationId,
  initialMessages,
  nombrePredio,
  userName,
  userEmail,
}: ChatPageClientV3Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [conversationId, setConversationId] = useState<number | null>(initialConversationId ?? null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Para re-fetch del sidebar
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasSentInitial = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (initialMessage && !hasSentInitial.current) {
      hasSentInitial.current = true;
      handleSend(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNewConversation = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    hasSentInitial.current = false;
    setMessages([]);
    setConversationId(null);
    setThinkingText("");
    setIsLoading(false);
    router.push("/chat");
  }, [router]);

  const handleSelectConversation = useCallback(
    (id: number) => {
      router.push(`/chat?conversation_id=${id}`);
    },
    [router]
  );

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setThinkingText("");
      const userMessage: ChatMessage = { role: "user", content };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      const assistantMessage: ChatMessage = { role: "assistant", content: "" };
      setMessages([...updatedMessages, assistantMessage]);

      setIsLoading(true);
      abortControllerRef.current = new AbortController();

      // Crear conversación si es el primer turno (fire-and-forget, degrada elegante)
      let convId: number | null = conversationId;
      if (convId === null) {
        try {
          const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              predio_id: predioId,
              titulo: content.slice(0, 60),
            }),
          });
          if (res.ok) {
            const data = await res.json();
            convId = data.id as number;
            setConversationId(convId);
            // Forzar re-fetch del sidebar para mostrar la conversación nueva
            setRefreshTrigger((prev) => prev + 1);
          }
        } catch {
          // Sin persistencia — el chat sigue funcionando
        }
      }

      // Variable local para acumular el contenido del asistente durante el stream
      let finalAssistantContent = "";

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
            predio_id: predioId,
            web_search: false,
            reasoning_mode: false,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: "Error desconocido" }));
          throw new Error(error.error ?? `HTTP ${response.status}`);
        }

        if (!response.body) throw new Error("Sin body en la respuesta");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            let event: SSEEvent;
            try {
              event = JSON.parse(raw);
            } catch {
              continue;
            }

            switch (event.type) {
              case "thinking_delta":
                if (event.delta) setThinkingText((prev) => prev + event.delta);
                break;
              case "text_delta":
                if (event.delta) {
                  finalAssistantContent += event.delta;
                  setThinkingText("");
                  setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (last?.role === "assistant") {
                      return [...prev.slice(0, -1), { ...last, content: last.content + event.delta }];
                    }
                    return prev;
                  });
                }
                break;
              case "tool_result":
                if (event.tool && event.result) {
                  const artifact = mapToolResultToArtifact({ tool: event.tool, result: event.result });
                  if (artifact) {
                    setMessages((prev) => {
                      const last = prev[prev.length - 1];
                      if (last?.role === "assistant") {
                        const currentArtifacts = last.artifacts || [];
                        return [
                          ...prev.slice(0, -1),
                          { ...last, artifacts: [...currentArtifacts, artifact] }
                        ];
                      }
                      return prev;
                    });
                  }
                }
                break;
              case "done":
                // Persistir mensajes al finalizar el turno (fire-and-forget)
                if (convId !== null) {
                  const snapshot: ChatMessage[] = [
                    ...updatedMessages,
                    { role: "assistant", content: finalAssistantContent },
                  ];
                  fetch(`/api/conversations/${convId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mensajes: snapshot }),
                  }).catch(() => {});
                }
                break;
              case "error":
                throw new Error(event.message ?? "Error en streaming");
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          const errorMsg = err instanceof Error ? err.message : "Error desconocido";
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.content === "") {
              return [...prev.slice(0, -1), { ...last, content: `Error: ${errorMsg}` }];
            }
            return prev;
          });
        }
      } finally {
        setIsLoading(false);
        setThinkingText("");
        abortControllerRef.current = null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, isLoading, predioId, conversationId]
  );

  return (
    <FontProvider>
      {/* ── DESKTOP ─────────────────────────────────────────────────── */}
      <div
        className="hidden md:flex"
        style={{ height: "100vh", overflow: "hidden", background: "#f8f6f1" }}
      >
        {/* Sidebar V3 */}
        <ChatSidebarV3
          orgName={nombrePredio}
          userName={userName}
          userEmail={userEmail}
          predioId={predioId}
          activeConversationId={conversationId}
          refreshTrigger={refreshTrigger}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
        />

        {/* Chat área */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            background: "#f8f6f1",
            position: "relative",
          }}
        >
          {/* Header */}
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 14px",
              borderBottom: "0.5px solid #ebe9e3",
              background: "#fff",
              flexShrink: 0,
              position: "relative",
              zIndex: 2,
            }}
          >
            <div style={{ width: 80 }} />

            {/* Centro: smartCow + chevron */}
            <button
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                borderRadius: 7,
                cursor: "pointer",
                background: "transparent",
                border: "none",
                fontFamily: "inherit",
              }}
            >
              <span
                style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.3px" }}
              >
                smartCow
              </span>
              <ChevronDown size={10} color="#bbb" />
            </button>

            {/* Derecha */}
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <HdrBtn title="Compartir">
                <Share2 size={13} color="#aaa" />
              </HdrBtn>
              <HdrBtn title="Buscar">
                <Search size={13} color="#aaa" />
              </HdrBtn>
              <Link
                href="/dashboard"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "#f0ede8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  color: "#666",
                }}
                title="Cerrar"
              >
                <X size={11} />
              </Link>
            </div>
          </header>

          {/* Mensajes */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "20px 0 8px",
            }}
          >
            {messages.length === 0 ? (
              <EmptyStateV3
                userName={userName}
                orgName={nombrePredio}
                onSend={handleSend}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  maxWidth: 680,
                  padding: "0 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {messages.map((msg, idx) => {
                  if (msg.role === "user") {
                    return (
                      <div key={idx} style={{ display: "flex", justifyContent: "flex-end" }}>
                        <div
                          style={{
                            background: "#1e3a2f",
                            color: "#fff",
                            borderRadius: "16px 16px 3px 16px",
                            padding: "10px 14px",
                            maxWidth: "70%",
                            fontSize: 13,
                            lineHeight: 1.5,
                            fontFamily: "inherit",
                          }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={idx}
                      style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
                    >
                      <AiAvatar />
                      <div
                        style={{
                          maxWidth: "85%",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        {msg.content ? (
                          <div
                            style={{
                              background: "#fff",
                              border: "0.5px solid #e8e5df",
                              borderRadius: "3px 16px 16px 16px",
                              padding: "10px 14px",
                              fontSize: 13,
                              color: "#1a1a1a",
                              lineHeight: 1.6,
                              fontFamily: "inherit",
                            }}
                          >
                            <MessageRenderer message={msg} />
                          </div>
                        ) : isLoading && idx === messages.length - 1 ? (
                          <div
                            style={{
                              background: "#fff",
                              border: "0.5px solid #e8e5df",
                              borderRadius: "3px 16px 16px 16px",
                              padding: "10px 14px",
                            }}
                          >
                            <ThinkingDots />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input bar */}
          <InputBarV3 isLoading={isLoading} onSend={handleSend} onStop={handleStop} />
        </div>
      </div>

      {/* ── MOBILE ──────────────────────────────────────────────────── */}
      <div
        className="flex md:hidden flex-col overflow-hidden"
        style={{ height: "100vh", background: "#f8f6f1" }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            flexShrink: 0,
            borderBottom: "0.5px solid #ebe9e3",
            background: "#fff",
          }}
        >
          <div style={{ width: 26 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>smartCow</span>
          <Link href="/dashboard" style={{ color: "#aaa", display: "flex" }}>
            <X size={16} />
          </Link>
        </header>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "16px 0 8px",
          }}
        >
          {messages.length === 0 ? (
            <EmptyStateV3 userName={userName} orgName={nombrePredio} onSend={handleSend} />
          ) : (
            <div
              style={{
                width: "100%",
                maxWidth: 680,
                padding: "0 16px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {messages.map((msg, idx) => {
                if (msg.role === "user") {
                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div
                        style={{
                          background: "#1e3a2f",
                          color: "#fff",
                          borderRadius: "16px 16px 3px 16px",
                          padding: "10px 14px",
                          maxWidth: "80%",
                          fontSize: 13,
                          lineHeight: 1.5,
                          fontFamily: "inherit",
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={idx} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <AiAvatar />
                    <div
                      style={{
                        flex: 1,
                        background: "#fff",
                        border: "0.5px solid #e8e5df",
                        borderRadius: "3px 14px 14px 14px",
                        padding: "10px 12px",
                        fontSize: 13,
                        color: "#1a1a1a",
                        lineHeight: 1.6,
                      }}
                    >
                      {msg.content ? (
                        <MessageRenderer message={msg} />
                      ) : isLoading && idx === messages.length - 1 ? (
                        <ThinkingDots />
                      ) : null}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <InputBarV3 isLoading={isLoading} onSend={handleSend} onStop={handleStop} />
      </div>
    </FontProvider>
  );
}
