/**
 * src/components/chat/chat-panel.tsx
 * Panel de chat Principal — V2 Sandbox aplicado a producción
 */

"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { PromptInputBox } from "@/src/components/ui/ai-prompt-box";
import { MessageRenderer, type ChatMessage } from "@/src/components/chat/message-renderer";
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

const WRITE_TOOLS = new Set(["registrar_pesaje", "registrar_parto"]);

// ─── ChatPanel ──────────────────────────────────────────────────────────────

interface ChatPanelProps {
  predioId: number;
  initialMessage?: string;
  nombrePredio?: string | null;
  userName?: string | null;
  className?: string;
}

export function ChatPanel({ predioId, initialMessage, nombrePredio, userName, className }: ChatPanelProps) {
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

  const handleSend = useCallback(
    async (content: string, _files?: File[], webSearch?: boolean, reasoningMode?: boolean) => {
      if (!content.trim() || isLoading) return;

      setAgentTasks([]);
      setShowAgentPlan(false);
      setThinkingText("");

      const userMessage: ChatMessage = { role: "user", content };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

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
                if (event.delta) setThinkingText((prev) => prev + event.delta);
                break;
              case "text_delta":
                if (event.delta) {
                  setThinkingText("");
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
                if (event.tool) handleToolUse(event.tool, event.input);
                break;
              case "tool_result":
                if (event.tool) handleToolResult(event.tool, event.result);
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
          // Cancelado
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
      className={`relative flex h-full min-h-0 bg-[#FAFAFA] overflow-hidden font-inter ${className ?? ""}`}
      suppressHydrationWarning
    >
      <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-500 items-center">
        


        {/* Mensajes - Centered */}
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden pt-4 pb-8 flex flex-col items-center">
            
            {messages.length === 0 ? (
              <div className="w-full max-w-3xl px-4 flex-1 flex flex-col justify-center">
                <ChatEmptyState 
                  nombrePredio={nombrePredio}
                  onSuggestionClick={(text) => handleSend(text)} 
                />
              </div>
            ) : (
              <div className="w-full max-w-3xl px-4 space-y-6">
                {messages.map((msg, idx) => (
                  <MessageRenderer key={idx} message={msg} />
                ))}
        
                {showAgentPlan && agentTasks.length > 0 && (
                  <div className="px-2 pb-6">
                    <AgentPlan tasks={agentTasks} />
                  </div>
                )}
        
                {isLoading && (
                  <div className="flex flex-col gap-3 py-4 animate-in fade-in duration-500">
                    <div className="flex items-center gap-3">
                       <div className="w-5 h-5 flex items-center justify-center">
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-500/20 border-t-gray-500 animate-spin" />
                       </div>
                       <span className="text-[14px] text-gray-400 font-medium italic">
                          {thinkingText ? "Analizando datos..." : "Generando respuesta..."}
                       </span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
            
        </div>
  
        {/* Input - Centered container */}
        <div className="w-full max-w-3xl px-4 pb-6 flex flex-col">
            <div className="w-full relative">
              <PromptInputBox
                onSend={handleSend}
                isLoading={isLoading}
                placeholder="Message SmartCow"
              />
            </div>
            
            <div className="w-full flex items-center justify-center mt-2 group relative">
              <p className="text-center text-xs text-gray-400/80 font-medium">
                AI can make mistakes. Check important info.
              </p>
              {isLoading && (
                <button
                  onClick={handleStop}
                  className="sm:absolute sm:right-0 ml-4 sm:ml-0 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Stop generating
                </button>
              )}
            </div>
        </div>
      </div>

      {/* Panel de Artifacts */}
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
  };
  return names[tool] ?? tool;
}

function formatToolInput(input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const obj = input as Record<string, unknown>;
  return Object.entries(obj).slice(0, 3).map(([k, v]) => `${k}: ${String(v)}`).join(", ");
}

function isSuccessResult(result: unknown): boolean {
  if (!result || typeof result !== "object") return false;
  return (result as any).ok === true || (result as any).success === true;
}
