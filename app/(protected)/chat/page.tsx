/**
 * app/(protected)/chat/page.tsx — Página de chat IA.
 * Server Component — verifica sesión y pasa predioId al client component.
 * Ticket: AUT-113
 */

import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { ChatPanel } from "@/src/components/chat/chat-panel";

export const metadata = {
  title: "Chat IA — SmartCow",
};

export default async function ChatPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const predioId = session.user.predios[0] ?? 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#111111]">
      <header className="flex items-center px-6 py-3 border-b border-[#222] bg-[#111111] flex-shrink-0">
        <h1 className="text-sm font-medium text-gray-300">
          SmartCow IA
          {predioId > 0 && (
            <span className="ml-2 text-xs text-gray-500">Predio #{predioId}</span>
          )}
        </h1>
      </header>
      <div className="flex-1 min-h-0">
        <ChatPanel predioId={predioId} />
      </div>
    </div>
  );
}
