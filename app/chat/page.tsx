/**
 * app/chat/page.tsx — Página de chat IA.
 * Server Component — verifica sesión y pasa fundoId al client component.
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

  // Usar el primer fundo del usuario como default.
  // Si el usuario tiene múltiples fundos, en el futuro
  // se puede agregar un selector de fundo en la UI.
  const fundoId = session.user.fundos[0] ?? 0;

  return (
    <div className="h-screen flex flex-col bg-[#111111]">
      <header className="flex items-center px-6 py-3 border-b border-[#222] bg-[#111111]">
        <h1 className="text-sm font-medium text-gray-300">
          SmartCow IA
          {fundoId > 0 && (
            <span className="ml-2 text-xs text-gray-500">Fundo #{fundoId}</span>
          )}
        </h1>
      </header>
      <main className="flex-1 min-h-0">
        <ChatPanel fundoId={fundoId} />
      </main>
    </div>
  );
}
