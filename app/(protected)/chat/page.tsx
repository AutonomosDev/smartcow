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
import { getNombrePredio, getPrediosConAnimales } from "@/src/lib/queries/predio";
import { getConversacionById } from "@/src/lib/queries/conversaciones";
import { ChatPageClientV3 } from "@/src/components/chat/chat-page-client-v3";
import type { ChatMessage } from "@/src/components/chat/message-renderer";

export const metadata = {
  title: "Chat IA — smartCow",
};

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; conversation_id?: string; predio_id?: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const predioIds = session.user.predios;
  const prediosConAnimales = await getPrediosConAnimales(predioIds);

  // Predio desde URL param, fallback al que tiene más animales, fallback al primero
  const defaultPredioId = prediosConAnimales[0]?.id ?? predioIds[0] ?? 0;
  const predioId = params.predio_id ? Number(params.predio_id) : defaultPredioId;

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
      predios={prediosConAnimales.map((p) => ({ id: p.id, nombre: p.nombre }))}
      initialMessage={initialMessage}
      initialConversationId={initialConversationId}
      initialMessages={initialMessages}
      nombrePredio={nombrePredio}
      userName={session.user.nombre}
      userEmail={session.user.email}
    />
  );
}
