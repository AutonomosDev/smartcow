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
import { ArtifactsSidebar, type ArtifactData } from "@/src/components/chat/artifacts-sidebar";

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
  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);

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
    async (content: string, _files?: File[], webSearch?: boolean, reasoningMode?: boolean) => {
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
            web_search: webSearch ?? false,
            reasoning_mode: reasoningMode ?? false,
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

  // Abrir artifact de prueba (Para el lead/user 1 2 3)
  useEffect(() => {
     if (messages.length > 0) {
       const last = messages[messages.length - 1];
       if (last.content.toLowerCase().includes("mostrar vaca") || last.content.toLowerCase().includes("vaca #34")) {
         setActiveArtifact({
            id: "vaca-34",
            type: "animal_card",
            title: "Ficha Animal #34",
            content: { rp: "2034", nombre: "Vaca Angus #34", categoria: "Vaca de Cría", peso: 450, nacimiento: "12/05/2022" }
         });
         setIsArtifactOpen(true);
       } else if (last.content.toLowerCase().includes("reporte") || last.content.toLowerCase().includes("eficiencia")) {
         setActiveArtifact({
            id: "repo-1",
            type: "report",
            title: "Reporte Mensual",
            content: { period: "Marzo 2026" }
         });
         setIsArtifactOpen(true);
       }
     }
  }, [messages]);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return (
    <div 
      className={`flex h-full min-h-0 bg-transparent overflow-hidden font-inter ${className ?? ""}`}
      suppressHydrationWarning
    >
      {/* Columna Chat Principal */}
      <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-500">
        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-12 py-8 space-y-6">
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
              <div className="px-2 pb-6">
                <AgentPlan tasks={agentTasks} />
              </div>
            )}
    
            {/* Status indicators (Thought, Action, Generating) */}
            {isLoading && (
              <div className="flex flex-col gap-3 py-4 animate-in fade-in duration-500">
                {/* Thought */}
                <div className="flex items-center gap-2 group cursor-pointer w-fit">
                   <div className="w-5 h-5 flex items-center justify-center text-gray-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lightbulb"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                   </div>
                   <span className="text-[14px] text-gray-500 font-medium">Thought</span>
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mt-0.5"><path d="m9 18 6-6-6-6"/></svg>
                </div>

                {/* Viewed (Action Pill) */}
                <div className="flex items-center gap-2">
                   <div className="w-5 h-5 flex items-center justify-center text-gray-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>
                   </div>
                   <span className="text-[14px] text-gray-500 font-medium mr-1">Viewed</span>
                   <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3E8FF]/40 border border-[#F3E8FF] text-[#7E22CE] text-[13px] font-semibold shadow-sm">
                      <div className="w-4 h-4 rounded bg-[#7E22CE] flex items-center justify-center">
                         <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                      </div>
                      Onboarding Demo
                   </div>
                </div>

                {/* Generating... */}
                <div className="flex items-center gap-3">
                   <div className="w-5 h-5 flex items-center justify-center">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                   </div>
                   <span className="text-[14px] text-gray-400 font-medium italic">
                      {thinkingText ? "Analizando datos..." : "Generando respuesta..."}
                   </span>
                </div>
              </div>
            )}
    
            <div ref={messagesEndRef} />
          </div>
    
          {/* Input */}
          <div className="px-4 pb-8 pt-4 flex flex-col items-center">
            <div className="w-full max-w-3xl bg-white rounded-[32px] shadow-sm border border-gray-100/50 overflow-hidden transition-all duration-300 focus-within:ring-4 focus-within:ring-blue-500/5">
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

      {/* Panel de Artifacts (Generative UI) */}
      <ArtifactsSidebar 
        artifact={activeArtifact}
        isOpen={isArtifactOpen}
        onClose={() => setIsArtifactOpen(false)}
      />
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
