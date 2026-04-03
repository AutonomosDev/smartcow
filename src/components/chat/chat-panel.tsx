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

// ─── Types ────────────────────────────────────────────────────────────────────

interface SSEEvent {
  type: "text_delta" | "tool_use" | "tool_result" | "done" | "error";
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
  fundoId: number;
}

export function ChatPanel({ fundoId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
  const [showAgentPlan, setShowAgentPlan] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Scroll al último mensaje
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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

      // Reset agent plan
      setAgentTasks([]);
      setShowAgentPlan(false);

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
            fundo_id: fundoId,
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
              case "text_delta":
                if (event.delta) {
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
        abortControllerRef.current = null;
      }
    },
    [messages, isLoading, fundoId, handleToolUse, handleToolResult]
  );

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#111111]">
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-gray-400">SmartCow IA</p>
              <p className="text-gray-500">
                Consulta sobre tus animales, pesajes, partos o índices reproductivos.
              </p>
            </div>
          </div>
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

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-[#222]">
        <PromptInputBox
          onSend={handleSend}
          isLoading={isLoading}
          placeholder="Pregunta sobre tus animales..."
        />
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
  return obj.success === true || (obj.error === undefined && obj.id !== undefined);
}

// ─── Tipo re-exportado para el chart ─────────────────────────────────────────
export type { ChartData };
