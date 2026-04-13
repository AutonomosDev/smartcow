/**
 * src/components/chat/chat-area-client.tsx
 * Client wrapper que conecta ChatPanel con ChatShareButton,
 * permitiendo que el botón Compartir acceda a los mensajes actuales.
 * Ticket: AUT-179
 */

"use client";

import { useState, useCallback } from "react";
import { ChatPanel } from "@/src/components/chat/chat-panel";
import { ChatShareButton } from "@/src/components/chat/chat-share-button";
import { ChevronDown, SquarePen, X } from "lucide-react";
import Link from "next/link";
import type { ChatMessage } from "@/src/components/chat/message-renderer";

interface ChatAreaClientProps {
  predioId: number;
  initialMessage?: string;
  nombrePredio: string | null;
  userName: string | null;
}

export function ChatAreaClient({
  predioId,
  initialMessage,
  nombrePredio,
  userName,
}: ChatAreaClientProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const handleMessagesChange = useCallback((messages: ChatMessage[]) => {
    setChatMessages(messages);
  }, []);

  return (
    <>
      {/* Header del chat */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100/50 flex-shrink-0 bg-white sticky top-0 z-10">
        {/* Centro: título */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors text-[#06200F] cursor-pointer hover:bg-gray-50 font-inherit">
          <span className="text-[15px] font-bold tracking-tight">
            smartCow
          </span>
          <ChevronDown size={14} className="text-gray-400" />
        </div>

        {/* Derecha: acciones */}
        <div className="flex items-center gap-1 ml-auto">
          <Link
            href="/chat"
            className="p-1.5 rounded-md hover:bg-gray-50/50 transition-colors text-gray-400 hover:text-gray-600"
          >
            <SquarePen size={16} />
          </Link>
          <ChatShareButton messages={chatMessages} nombrePredio={nombrePredio} />
          <Link
            href="/dashboard"
            className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-50/50 transition-colors text-gray-400 hover:text-gray-600"
          >
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
          onMessagesChange={handleMessagesChange}
        />
      </div>
    </>
  );
}
