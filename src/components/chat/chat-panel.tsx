/**
 * src/components/chat/chat-panel.tsx
 * Panel de chat principal — desktop.
 * Conecta con el endpoint SSE POST /api/chat (AUT-112).
 * Ticket: AUT-113
 *
 * Comportamiento:
 * - Streaming SSE: tokens en tiempo real
 * - Scroll automático al último mensaje
 * - Enter envía, Shift+Enter salto de línea
 * - Input deshabilitado mientras responde
 * - Agent Plan visible solo cuando Claude usa tools de escritura
 * - Responsive: funciona en móvil
 */

"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { PromptInputBox } from "@/src/components/ui/ai-prompt-box";
import { MessageRenderer, type ChatMessage, type ChartData } from "@/src/components/chat/message-renderer";
import { AgentPlan, type AgentTask, type AgentTaskStatus } from "@/src/components/ui/agent-plan";
import { ChatEmptyState } from "@/src/components/chat/chat-empty-state";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SSEEvent {
  type: "text_delta" | "thinking_delta" | "tool_use" | "tool_result" | "done" | "error";
  delta?: string;
  tool?: string;
  input?: unknown;
  result?: unknown;
  message?: string;
}

// Tools que modifican datos — mostrar Agent Plan para estas
const WRITE_TOOLS = new Set(["registrar_pesaje", "registrar_parto"]);

// ─── ChatPanel ────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  predioId: number;
  initialMessage?: string;
  nombrePredio?: string | null;
  className?: string;
}

export function ChatPanel({ predioId, initialMessage, nombrePredio, className }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingText, setThinkingText] = useState("");
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
  const [showAgentPlan, setShowAgentPlan] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasSentInitial = useRef(false);

  // Scroll al último mensaje
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Enviar initialMessage al montar (una sola vez)
  useEffect(() => {
    if (initialMessage && !hasSentInitial.current) {
      hasSentInitial.current = true;
      handleSend(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manejar tool_use para Agent Plan
  const handleToolUse = useCallback(
    (tool: string, input: unknown) => {
      const isWriteTool = WRITE_TOOLS.has(tool);

      if (isWriteTool) {
        setShowAgentPlan(true);
        setAgentTasks((prev) => {
          const exists = prev.find((t) => t.id === tool);
          if (exists) {
            return prev.map((t) =>
              t.id === tool ? { ...t, status: "in-progress" as AgentTaskStatus } : t
            );
          }
          const newTask: AgentTask = {
            id: tool,
            title: formatToolName(tool),
            description: formatToolInput(input),
            status: "in-progress",
            subtasks: [],
          };
          return [...prev, newTask];
        });
      }
    },
    []
  );

  const handleToolResult = useCallback((tool: string, result: unknown) => {
    setAgentTasks((prev) =>
      prev.map((t) => {
        if (t.id === tool) {
          const success = isSuccessResult(result);
          return { ...t, status: success ? "completed" : "failed" };
        }
        return t;
      })
    );
  }, []);

  // Enviar mensaje
  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Reset agent plan y thinking
      setAgentTasks([]);
      setShowAgentPlan(false);
      setThinkingText("");

      const userMessage: ChatMessage = { role: "user", content };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Placeholder de asistente para streaming
      const assistantMessage: ChatMessage = { role: "assistant", content: "" };
      setMessages([...updatedMessages, assistantMessage]);

      setIsLoading(true);
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            predio_id: predioId,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: "Error desconocido" }));
          throw new Error(error.error ?? `HTTP ${response.status}`);
        }

        if (!response.body) {
          throw new Error("Sin body en la respuesta");
        }

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
                if (event.delta) {
                  setThinkingText((prev) => prev + event.delta);
                }
                break;

              case "text_delta":
                if (event.delta) {
                  setThinkingText(""); // limpiar thinking cuando empieza la respuesta
                  setMessages((prev) => {
                    const last = prev[prev.length - 1];
                    if (last?.role === "assistant") {
                      return [
                        ...prev.slice(0, -1),
                        { ...last, content: last.content + event.delta },
                      ];
                    }
                    return prev;
                  });
                }
                break;

              case "tool_use":
                if (event.tool) {
                  handleToolUse(event.tool, event.input);
                }
                break;

              case "tool_result":
                if (event.tool) {
                  handleToolResult(event.tool, event.result);
                }
                break;

              case "done":
                break;

              case "error":
                throw new Error(event.message ?? "Error en streaming");
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // Usuario canceló — mantener lo que se escribió
        } else {
          const errorMsg = err instanceof Error ? err.message : "Error desconocido";
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.content === "") {
              return [
                ...prev.slice(0, -1),
                {
                  ...last,
                  content: `Error: ${errorMsg}`,
                },
              ];
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
    [messages, isLoading, predioId, handleToolUse, handleToolResult]
  );

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return (
    <div className={`flex flex-col h-full min-h-0 bg-transparent ${className ?? ""}`}>
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 py-6 space-y-4">
          {messages.length === 0 && (
            <ChatEmptyState 
              nombrePredio={nombrePredio}
              onSuggestionClick={(text) => handleSend(text)} 
            />
          )}
  
          {messages.map((msg, idx) => (
            <MessageRenderer key={idx} message={msg} />
          ))}
  
          {/* Agent Plan — solo durante tool use de escritura */}
          {showAgentPlan && agentTasks.length > 0 && (
            <div className="px-2 pb-2">
              <AgentPlan tasks={agentTasks} />
            </div>
          )}
  
          {/* Thought — agente pensando en tiempo real */}
          {thinkingText && (
            <div className="flex gap-3 items-start mb-4 px-2">
              <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center flex-shrink-0 bg-white shadow-sm mt-0.5">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-dark animate-pulse" />
              </div>
              <details className="flex-1" open>
                <summary className="text-sm font-semibold text-brand-dark hover:text-brand-dark/80 cursor-pointer select-none list-none flex items-center gap-2">
                  <div className="flex gap-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-brand-dark animate-bounce" style={{ animationDelay: '0ms' }} />
                     <span className="w-1.5 h-1.5 rounded-full bg-brand-dark animate-bounce" style={{ animationDelay: '150ms' }} />
                     <span className="w-1.5 h-1.5 rounded-full bg-brand-dark animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>SmartCow está analizando...</span>
                </summary>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed bg-white/60 p-3 rounded-lg border border-gray-100 max-h-32 overflow-y-auto max-w-2xl shadow-sm">
                  {thinkingText}
                </p>
              </details>
            </div>
          )}
  
          {/* Indicador de carga cuando no hay thinking text */}
          {isLoading && !thinkingText && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content === "" && (
            <div className="flex gap-3 items-center mb-4 px-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center flex-shrink-0 bg-white shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-dark animate-pulse" />
              </div>
              <div className="flex bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100 gap-1.5 items-center">
                <span className="w-2 h-2 rounded-full bg-brand-light animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-brand-light animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-brand-light animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs text-gray-500 font-medium ml-2">Procesando consulta...</span>
              </div>
            </div>
          )}
  
          <div ref={messagesEndRef} />
        </div>
  
        {/* Input */}
        <div className="px-4 pb-8 pt-4 flex flex-col items-center">
          <div className="w-full max-w-3xl bg-white rounded-[28px] shadow-float border border-gray-100/50 overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-brand-light/20">
            <PromptInputBox
              onSend={handleSend}
              isLoading={isLoading}
              placeholder="Pregunta sobre tus animales..."
              className="!shadow-none !border-0 bg-transparent"
            />
          </div>
          
          <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
            AI can make mistakes. Please double-check responses.
          </p>
  
          {isLoading && (
            <div className="flex justify-center mt-2">
              <button
                onClick={handleStop}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Detener respuesta
              </button>
            </div>
          )}
        </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatToolName(tool: string): string {
  const names: Record<string, string> = {
    registrar_pesaje: "Registrando pesaje",
    registrar_parto: "Registrando parto",
    query_animales: "Consultando animales",
    query_pesajes: "Consultando pesajes",
    query_partos: "Consultando partos",
    query_indices_reproductivos: "Consultando índices reproductivos",
  };
  return names[tool] ?? tool;
}

function formatToolInput(input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const obj = input as Record<string, unknown>;
  return Object.entries(obj)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(", ");
}

function isSuccessResult(result: unknown): boolean {
  if (!result || typeof result !== "object") return false;
  const obj = result as Record<string, unknown>;
  return obj.ok === true || obj.success === true;
}

// ─── Tipo re-exportado para el chart ─────────────────────────────────────────
export type { ChartData };
