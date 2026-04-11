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
import { ChevronLeft, ChevronDown, SquarePen, Share2, MoreHorizontal, X, Lock } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Chat IA — SmartCow",
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
    <>
      {/* ── DESKTOP: sidebar izq + chat área ── */}
      <div className="hidden md:flex h-screen overflow-hidden bg-white">
        <ChatSidebar
          orgName={nombrePredio}
          userName={session.user.nombre}
          userEmail={session.user.email}
        />
        {/* Área principal de chat */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {/* Header del chat — igual al mockup web_ai_chat.png */}
          <header className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0 bg-white">
            {/* Izquierda: título + dropdown + badge privado */}
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 hover:bg-gray-50 px-2 py-1 rounded-md transition-colors">
                <span className="text-gray-900 text-sm font-medium text-opacity-50 italic">Nueva conversación...</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 bg-white">
                <Lock size={11} className="text-gray-400" />
                <span className="text-gray-500 text-xs">
                  {session.user.nombre?.split(" ")[0] ?? "Privado"}
                </span>
              </div>
            </div>
            {/* Derecha: acciones */}
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-md hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-600">
                <SquarePen size={16} />
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <Share2 size={14} />
                <span>Compartir</span>
              </button>
              <button className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-600">
                <MoreHorizontal size={16} />
              </button>
              <Link href="/dashboard" className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-600">
                <X size={16} />
              </Link>
            </div>
          </header>
          <div className="flex-1 min-h-0">
            <ChatPanel
              predioId={predioId}
              initialMessage={initialMessage}
              nombrePredio={nombrePredio}
            />
          </div>
        </div>
      </div>

      {/* ── MOBILE: full-height, fondo blanco ── */}
      <div className="flex md:hidden flex-col h-screen bg-[#efedec] overflow-hidden">
        {/* Header mobile — sin texto, solo sidebar icon + avatar */}
        <header className="flex items-center justify-between px-4 py-3 flex-shrink-0">
          <button className="p-1 -ml-1 text-gray-400">
            <ChevronLeft size={22} />
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-600 text-xs font-semibold uppercase">
              {session.user.nombre?.[0] ?? "U"}
            </span>
          </div>
        </header>
        <div className="flex-1 min-h-0">
          <ChatPanel
            predioId={predioId}
            initialMessage={initialMessage}
            nombrePredio={nombrePredio}
            className="bg-transparent"
          />
        </div>
      </div>
    </>
  );
}
