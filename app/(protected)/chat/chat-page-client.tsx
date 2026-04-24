"use client";

import { FontProvider } from "@/src/providers/font-provider";
import { ChatPanel } from "@/src/components/chat/chat-panel";
import type { DashboardData } from "@/src/components/chat/artifacts/dashboard-artifact";

export function ChatPageClient({ initialMessage, session, initialDashboard }: {
  initialMessage?: string;
  session: any;
  initialDashboard?: DashboardData | null;
}) {
  return (
    <FontProvider>
      <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
        <ChatPanel
          initialMessage={initialMessage}
          userName={session.user.nombre}
          orgId={session.user.orgId}
          initialDashboard={initialDashboard ?? null}
        />
      </div>
    </FontProvider>
  );
}
