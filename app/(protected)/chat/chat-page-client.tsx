"use client";

import { FontProvider } from "@/src/providers/font-provider";
import { ChatPanel } from "@/src/components/chat/chat-panel";

export function ChatPageClient({ initialMessage, session }: {
  initialMessage?: string;
  session: any;
}) {
  return (
    <FontProvider>
      <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
        <ChatPanel
          initialMessage={initialMessage}
          userName={session.user.nombre}
          orgId={session.user.orgId}
        />
      </div>
    </FontProvider>
  );
}
