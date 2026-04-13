/**
 * src/components/chat/chat-panel-v2.tsx
 * Nave de control del chat V2 (Pristine White).
 * Aislada para /chat-v2.
 */

"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { PromptInputBoxV2 } from "@/src/components/ui/ai-prompt-box-v2";
import { MessageRendererV2, type ChatMessageV2 } from "@/src/components/chat/message-renderer-v2";
import { AgentPlan, type AgentTask, type AgentTaskStatus } from "@/src/components/ui/agent-plan";
import { ChatEmptyState } from "@/src/components/chat/chat-empty-state";
import { ArtifactsSidebar, type ArtifactData } from "@/src/components/chat/artifacts-sidebar";

interface SSEEvent {
  type: "text_delta" | "thinking_delta" | "tool_use" | "tool_result" | "done" | "error";
  delta?: string;
  tool?: string;
  input?: unknown;
  result?: unknown;
  message?: string;
}

const WRITE_TOOLS = new Set(["registrar_pesaje", "registrar_parto"]);

interface ChatPanelV2Props {
  predioId: number;
  initialMessage?: string;
  nombrePredio?: string | null;
  userName?: string | null;
  className?: string;
}

export function ChatPanelV2({ predioId, initialMessage, nombrePredio, userName, className }: ChatPanelV2Props) {
  const [messages, setMessages] = useState<ChatMessageV2[]>([]);
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
  }, []);

  const handleToolUse = useCallback((tool: string, input: unknown) => {
    if (WRITE_TOOLS.has(tool)) {
      setShowAgentPlan(true);
      setAgentTasks((prev) => {
        const newTask: AgentTask = {
          id: tool,
          title: tool.replace("_", " "),
          description: JSON.stringify(input),
          status: "in-progress",
          subtasks: [],
        };
        return [...prev, newTask];
      });
    }
  }, []);

  const handleToolResult = useCallback((tool: string, result: unknown) => {
    setAgentTasks((prev) =>
      prev.map((t) => (t.id === tool ? { ...t, status: (result as any).ok ? "completed" : "failed" } : t))
    );
  }, []);

  const handleSend = useCallback(
    async (content: string, _files?: File[], webSearch?: boolean, reasoningMode?: boolean) => {
      if (!content.trim() || isLoading) return;

      const userMessage: ChatMessageV2 = { role: "user", content };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      const assistantMessage: ChatMessageV2 = { role: "assistant", content: "" };
      setMessages([...updatedMessages, assistantMessage]);

      setIsLoading(true);
      setThinkingText("");
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            predio_id: predioId,
            web_search: webSearch,
            reasoning_mode: reasoningMode,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.body) throw new Error("No response body");
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
            const event: SSEEvent = JSON.parse(line.slice(6));

            switch (event.type) {
              case "thinking_delta":
                setThinkingText((prev) => prev + (event.delta ?? ""));
                break;
              case "text_delta":
                setThinkingText("");
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  return last.role === "assistant" 
                    ? [...prev.slice(0, -1), { ...last, content: last.content + (event.delta ?? "") }]
                    : prev;
                });
                break;
              case "tool_use": handleToolUse(event.tool!, event.input); break;
              case "tool_result": handleToolResult(event.tool!, event.result); break;
              case "error": throw new Error(event.message);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
        setThinkingText("");
      }
    },
    [messages, isLoading, predioId, handleToolUse, handleToolResult]
  );

  return (
    <div className={`relative flex h-full bg-white overflow-hidden ${className ?? ""}`}>
      <div className="flex-1 flex flex-col items-center h-full min-w-0">
        
        {/* Scrollable area */}
        <div className="flex-1 w-full overflow-y-auto pt-6 pb-20 flex flex-col items-center h-full scroll-smooth no-scrollbar">
          {messages.length === 0 ? (
            <div className="w-full max-w-2xl px-4 flex-1 flex flex-col justify-center animate-in fade-in duration-700">
              <ChatEmptyState 
                nombrePredio={nombrePredio}
                onSuggestionClick={(text) => handleSend(text)} 
              />
            </div>
          ) : (
            <div className="w-full max-w-3xl px-6">
              {messages.map((msg, idx) => (
                <MessageRendererV2 key={idx} message={msg} />
              ))}
              
              {showAgentPlan && agentTasks.length > 0 && (
                <div className="mb-10 animate-in slide-in-from-left-4 duration-500">
                  <AgentPlan tasks={agentTasks} />
                </div>
              )}

              {isLoading && thinkingText && (
                <div className="flex items-center gap-3 py-4 text-gray-400 italic text-[14px]">
                  <div className="w-4 h-4 border-2 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                  Razonando...
                </div>
              )}
              
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Floating Input Box */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-white/0 pt-10 pb-6 flex justify-center z-20">
          <div className="w-full max-w-2xl px-6">
            <PromptInputBoxV2
              onSend={handleSend}
              isLoading={isLoading}
              placeholder="Mensaje a SmartCow..."
            />
            <p className="text-[10px] text-gray-300 mt-2.5 text-center font-medium tracking-tight">
              smartCow puede cometer errores. Verifica la información importante.
            </p>
          </div>
        </div>
      </div>

      <ArtifactsSidebar 
        artifact={activeArtifact}
        isOpen={isArtifactOpen}
        onClose={() => setIsArtifactOpen(false)}
      />
    </div>
  );
}
