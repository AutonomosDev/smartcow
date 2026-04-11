/**
 * app/(protected)/chat/page.tsx — Página de chat IA.
 * Desktop: sidebar (21st.dev style) + área de chat principal.
 * Mobile: full-height, fondo blanco, header con back button.
 * Referencias: chat_web/web_ai_chat.png + web_ai_chat_sidebar.png
 *              mobile/mobile_ai_chat.png
 * Ticket: AUT-113
 */

import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getNombrePredio } from "@/src/lib/queries/predio";
import { ChatPanel } from "@/src/components/chat/chat-panel";
import { ChatSidebar } from "@/src/components/chat/chat-sidebar";
import { FontProvider } from "@/src/providers/font-provider";
import { ChatShareButton } from "@/src/components/chat/chat-share-button";
import { ChatHistoryHeader } from "@/src/components/chat/chat-history-header";
import { ChevronLeft, ChevronDown, SquarePen, X } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Chat IA — smartCow",
};

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const predioId = session.user.predios[0] ?? 0;
  const params = await searchParams;
  const initialMessage = params.q;
  const nombrePredio = await getNombrePredio(predioId);

  return (
    <FontProvider>
      {/* ── DESKTOP: sidebar izq + chat área ── */}
      <div className="hidden md:flex h-screen overflow-hidden bg-white">
        <ChatSidebar
          orgName={nombrePredio}
          userName={session.user.nombre}
          userEmail={session.user.email}
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
              <Link href="/chat" className="p-1.5 rounded-md hover:bg-gray-50/50 transition-colors text-gray-400 hover:text-gray-600">
                <SquarePen size={16} />
              </Link>
              <ChatShareButton />
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
              userName={session.user.nombre}
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
            userName={session.user.nombre}
            className="bg-transparent"
          />
        </div>
      </div>
    </FontProvider>
  );
}
