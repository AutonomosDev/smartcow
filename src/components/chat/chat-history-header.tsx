"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ChatHistoryModal } from "@/src/components/modals/chat-history-modal";

export function ChatHistoryHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 hover:bg-gray-50 px-2 py-1 rounded-md transition-colors"
      >
        <span className="text-gray-900 text-sm font-medium text-opacity-50 italic">Nueva conversación...</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      <ChatHistoryModal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onSelect={() => setIsOpen(false)}
      />
    </>
  );
}
