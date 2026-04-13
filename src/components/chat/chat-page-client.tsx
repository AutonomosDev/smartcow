/**
 * src/components/chat/chat-page-client.tsx
 * Client wrapper para chat/page.tsx — maneja el botón Nueva Conversación
 * sin recargar la página.
 * Ticket: AUT-177
 */

"use client";

import { useState, useCallback } from "react";
import { ChatPanel } from "@/src/components/chat/chat-panel";
import { ChatSidebar } from "@/src/components/chat/chat-sidebar";
import { ChatShareButton } from "@/src/components/chat/chat-share-button";
import { ChatHistoryHeader } from "@/src/components/chat/chat-history-header";
import { FontProvider } from "@/src/providers/font-provider";
import { ChevronLeft, ChevronDown, SquarePen, X } from "lucide-react";
import Link from "next/link";
import type { ChatMessage } from "@/src/components/chat/message-renderer";

interface ChatPageClientProps {
  predioId: number;
  initialMessage?: string;
  nombrePredio: string | null;
  userName: string | null;
  userEmail: string | null;
}

export function ChatPageClient({
  predioId,
  initialMessage,
  nombrePredio,
  userName,
  userEmail,
}: ChatPageClientProps) {
  const [resetKey, setResetKey] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const handleNewConversation = useCallback(() => {
    setResetKey((k) => k + 1);
    setChatMessages([]);
  }, []);

  return (
    <FontProvider>
      {/* ── DESKTOP: sidebar izq + chat área ── */}
      <div className="hidden md:flex h-screen overflow-hidden bg-white">
        <ChatSidebar
          orgName={nombrePredio}
          userName={userName}
          userEmail={userEmail}
        />
        {/* Área principal de chat */}
        <div className="flex-1 flex flex-col min-h-0 bg-transparent">
          {/* Header del chat */}
          <header className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100/50 flex-shrink-0 bg-white sticky top-0 z-10">
            {/* Izquierda: dropdown conversaciones */}
            <div className="flex items-center gap-2">
              <ChatHistoryHeader />
            </div>

            {/* Centro: título */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors text-[#06200F] cursor-pointer hover:bg-gray-50 font-inherit">
              <span className="text-[15px] font-bold tracking-tight">
                smartCow
              </span>
              <ChevronDown size={14} className="text-gray-400" />
            </div>

            {/* Derecha: acciones */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleNewConversation}
                className="p-1.5 rounded-md hover:bg-gray-50/50 transition-colors text-gray-400 hover:text-gray-600"
                aria-label="Nueva conversación"
              >
                <SquarePen size={16} />
              </button>
              <ChatShareButton messages={chatMessages} nombrePredio={nombrePredio} />
              <Link href="/dashboard" className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-50/50 transition-colors text-gray-400 hover:text-gray-600">
                <X size={16} />
              </Link>
            </div>
          </header>
          <div className="flex-1 min-h-0">
            <ChatPanel
              predioId={predioId}
              initialMessage={initialMessage}
              nombrePredio={nombrePredio}
              userName={userName}
              resetKey={resetKey}
              onMessagesChange={setChatMessages}
            />
          </div>
        </div>
      </div>

      {/* ── MOBILE: full-height, fondo blanco ── */}
      <div className="flex md:hidden flex-col h-screen bg-white overflow-hidden font-inherit">
        {/* Header mobile */}
        <header className="flex items-center justify-between px-4 py-3 flex-shrink-0">
          <Link href="/dashboard" className="p-1 -ml-1 text-gray-400">
            <ChevronLeft size={22} />
          </Link>
          <div className="w-8 h-8 flex items-center justify-center mix-blend-multiply">
            <img src="/cow_robot.png" alt="smartCow" className="w-full h-full object-contain" />
          </div>
        </header>
        <div className="flex-1 min-h-0">
          <ChatPanel
            predioId={predioId}
            initialMessage={initialMessage}
            nombrePredio={nombrePredio}
            userName={userName}
            className="bg-transparent"
            resetKey={resetKey}
          />
        </div>
      </div>
    </FontProvider>
  );
}
