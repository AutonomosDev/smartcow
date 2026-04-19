"use client";

import { FontProvider } from "@/src/providers/font-provider";
import { ChatPanel } from "@/src/components/chat/chat-panel";

export function ChatPageClient({ predioId, initialMessage, nombrePredio, session }: {
  predioId: number;
  initialMessage?: string;
  nombrePredio?: string | null;
  session: any;
}) {
  return (
    <FontProvider>
      <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
        <ChatPanel
          predioId={predioId}
          initialMessage={initialMessage}
          nombrePredio={nombrePredio}
          userName={session.user.nombre}
        />
      </div>
    </FontProvider>
  );
}
