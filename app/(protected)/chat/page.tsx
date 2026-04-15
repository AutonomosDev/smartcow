/**
 * app/(protected)/chat/page.tsx — Página de chat IA.
 * Server Component wrapper: auth + data fetching.
 * Interactividad delegada a ChatPageClient.
 * Referencias: chat_web/web_ai_chat.png + web_ai_chat_sidebar.png
 *              mobile/mobile_ai_chat.png
 * Tickets: AUT-113, AUT-177, AUT-144
 */

import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getNombrePredio } from "@/src/lib/queries/predio";
import { getConversacionById } from "@/src/lib/queries/conversaciones";
import { ChatPageClientV3 } from "@/src/components/chat/chat-page-client-v3";
import type { ChatMessage } from "@/src/components/chat/message-renderer";

export const metadata = {
  title: "Chat IA — smartCow",
};

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; conversation_id?: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const predioId = session.user.predios[0] ?? 0;
  const params = await searchParams;
  const initialMessage = params.q;
  const nombrePredio = await getNombrePredio(predioId);

  // Cargar conversación histórica si se navega con ?conversation_id=N
  let initialConversationId: number | undefined;
  let initialMessages: ChatMessage[] | undefined;

  if (params.conversation_id) {
    const convId = parseInt(params.conversation_id, 10);
    if (!isNaN(convId)) {
      const userId = parseInt(session.user.id, 10);
      const conv = await getConversacionById(convId, userId);
      if (conv) {
        initialConversationId = conv.id;
        initialMessages = conv.mensajes as ChatMessage[];
      }
    }
  }

  return (
    <ChatPageClientV3
      predioId={predioId}
      initialMessage={initialMessage}
      initialConversationId={initialConversationId}
      initialMessages={initialMessages}
      nombrePredio={nombrePredio}
      userName={session.user.nombre}
      userEmail={session.user.email}
    />
  );
}
