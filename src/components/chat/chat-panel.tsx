"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { MessageRenderer, TypingIndicator, type ChatMessage } from "./message-renderer";
import { ChatArtifact, type ArtifactData } from "./chat-artifact";
import {
  IconPaperclip, IconMic, IconSend, IconZap, IconPlus, IconSquare,
} from "./chat-icons";

// ── SSE event types ────────────────────────────────────────────────────────────

interface SSEEvent {
  type: "text_delta" | "thinking_delta" | "tool_use" | "tool_result" | "done" | "error";
  delta?: string;
  tool?: string;
  input?: unknown;
  result?: unknown;
  message?: string;
}

// ── Slash chips ────────────────────────────────────────────────────────────────

const SLASH_CHIPS = [
  "/feedlot", "/FT", "/vaquillas", "/partos", "/tratamientos", "/ventas",
  "/resumen", "/plan", "/alerta",
];

// ── Empty state ────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "¿Cómo van los lotes esta semana?",
  "¿Cuánto gano si vendo hoy?",
  "¿Qué animales necesitan atención?",
  "/plan vacunación mayo",
];

function EmptyState({
  nombrePredio,
  userName,
  onSuggestion,
}: {
  nombrePredio?: string | null;
  userName?: string | null;
  onSuggestion: (t: string) => void;
}) {
  const firstName = userName?.split(" ")[0];
  return (
    <div className="flex-1 flex flex-col items-center justify-center pb-[120px] px-[48px]">
      <div className="w-[38px] h-[38px] bg-[#1e3a2f] rounded-[10px] flex items-center justify-center mb-[14px]">
        <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5" stroke="#7ecfa0" strokeWidth="1.5"/>
          <path d="M5 7h4M7 5v4" stroke="#7ecfa0" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <h3 className="text-[16px] font-semibold text-[#1a1a1a] mb-[4px] tracking-tight">
        {firstName ? `Buenos días, ${firstName}` : "SmartCow"}
      </h3>
      <p className="text-[12.5px] text-[#999] mb-[20px]" style={{ fontFamily: "var(--font-mono)" }}>
        {nombrePredio ?? "smartcow_prod"} · asistente ganadero
      </p>
      <div className="flex flex-wrap gap-[6px] justify-center max-w-[420px]">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="sc-chip text-left"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Composer ───────────────────────────────────────────────────────────────────

interface ComposerProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isLoading: boolean;
  nombrePredio?: string | null;
}

function Composer({ onSend, onStop, isLoading, nombrePredio }: ComposerProps) {
  const [value, setValue] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    if (!value.trim()) return;
    onSend(value.trim());
    setValue("");
    if (taRef.current) taRef.current.style.height = "auto";
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      className="flex-shrink-0 px-[48px] pb-[18px] pt-[10px]"
      style={{ background: "linear-gradient(to top, #fff 80%, transparent)" }}
    >
      {/* Git/context strip */}
      <div
        className="flex items-center gap-[8px] mb-[6px] px-[2px] overflow-x-auto no-scrollbar"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <div className="flex items-center gap-[5px] text-[#bbb] flex-shrink-0">
          <IconZap size={11} />
        </div>
        {SLASH_CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => setValue((prev) => prev + c + " ")}
            className="flex-shrink-0 text-[11px] font-medium text-[#2b6a4a] bg-[#f3f5f0] hover:bg-[#e8ede2] px-[9px] py-[3px] rounded-[5px] transition-colors border border-transparent hover:border-[rgba(43,106,74,.15)]"
          >
            {c}
          </button>
        ))}
        <span className="text-[11px] text-[#bbb] flex-shrink-0 cursor-pointer hover:text-[#666]">más ▾</span>
      </div>

      {/* Input box */}
      <div className="border border-[#e0ddd8] rounded-[8px] bg-white overflow-hidden">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 180) + "px";
          }}
          onKeyDown={onKeyDown}
          placeholder="Type / for commands"
          rows={1}
          className="w-full px-[14px] pt-[11px] pb-[6px] text-[13px] resize-none outline-none bg-transparent"
          style={{ fontFamily: "var(--font-mono)", minHeight: 38 }}
        />

        {/* Bottom row */}
        <div className="flex items-center gap-[6px] px-[10px] pb-[8px]">
          {/* Bypass chip */}
          <span
            className="text-[10.5px] font-medium px-[7px] py-[2px] rounded-[4px] bg-[#fdf0e6] text-[#9b5e1a] cursor-default flex-shrink-0"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Bypass permissions
          </span>

          {/* Action icons */}
          <button className="text-[#ccc] hover:text-[#666] transition-colors" title="Adjuntar">
            <IconPlus size={13} />
          </button>
          <button className="text-[#ccc] hover:text-[#666] transition-colors" title="Archivo">
            <IconPaperclip size={13} />
          </button>
          <button className="text-[#ccc] hover:text-[#666] transition-colors" title="Audio">
            <IconZap size={13} />
          </button>

          {/* Model + send */}
          <div className="ml-auto flex items-center gap-[8px]">
            <span className="text-[11px] text-[#999]" style={{ fontFamily: "var(--font-mono)" }}>
              Sonnet 4.6
              <span className="text-[#ccc] mx-[4px]">·</span>
              Medium
            </span>
            {isLoading ? (
              <button
                onClick={onStop}
                title="Detener"
                className="flex items-center justify-center w-[28px] h-[28px] rounded-[6px] bg-[#f3f5f0] text-[#2b6a4a] hover:bg-[#e8ede2] transition-colors"
              >
                <IconSquare size={11} />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!value.trim()}
                title="Enviar"
                className="flex items-center justify-center w-[28px] h-[28px] rounded-[6px] bg-[#1e3a2f] text-white hover:bg-[#162d23] transition-colors disabled:opacity-40"
              >
                <IconSend size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ChatPanel ─────────────────────────────────────────────────────────────

export interface ChatPanelProps {
  predioId: number;
  initialMessage?: string;
  nombrePredio?: string | null;
  userName?: string | null;
  className?: string;
  // Artifact panel state lifted up to page-level split layout
  artWidth: number;
  artVisible: boolean;
  onArtifactUpdate: (a: ArtifactData | null) => void;
  onArtifactOpen: (v: boolean) => void;
}

export function ChatPanel({
  predioId,
  initialMessage,
  nombrePredio,
  userName,
  className,
  artWidth: _artWidth,
  artVisible: _artVisible,
  onArtifactUpdate,
  onArtifactOpen,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const hasSentInitial = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const isLoadingRef = useRef(false);
  const handleSendRef = useRef<((content: string) => void) | null>(null);

  messagesRef.current = messages;
  isLoadingRef.current = isLoading;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (initialMessage && !hasSentInitial.current) {
      hasSentInitial.current = true;
      handleSendRef.current?.(initialMessage);
    }
  }, [initialMessage]);

  const handleSend = useCallback(async (content: string) => {
    if (!content.trim() || isLoadingRef.current) return;

    const userMsg: ChatMessage = { role: "user", content };
    const updatedMsgs = [...messagesRef.current, userMsg];
    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    setMessages([...updatedMsgs, assistantMsg]);
    setIsLoading(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMsgs, predio_id: predioId }),
        signal: abortRef.current.signal,
      });
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const evt: SSEEvent = JSON.parse(line.slice(6));
          if (evt.type === "text_delta") {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              return last?.role === "assistant"
                ? [...prev.slice(0, -1), { ...last, content: last.content + (evt.delta ?? "") }]
                : prev;
            });
          }
        }
      }
    } catch {
      // aborted or error — keep whatever streamed
    } finally {
      setIsLoading(false);
    }
  }, [predioId]);

  handleSendRef.current = handleSend;

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return (
    <div className={`flex flex-col h-full bg-white overflow-hidden ${className ?? ""}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-[720px] mx-auto px-[48px] pt-[28px] pb-[24px]">
          {messages.length === 0 ? (
            <EmptyState
              nombrePredio={nombrePredio}
              userName={userName}
              onSuggestion={handleSend}
            />
          ) : (
            <>
              {messages.map((msg, i) => (
                <MessageRenderer key={i} message={msg} />
              ))}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Composer pinned at bottom */}
      <Composer
        onSend={handleSend}
        onStop={handleStop}
        isLoading={isLoading}
        nombrePredio={nombrePredio}
      />
    </div>
  );
}
