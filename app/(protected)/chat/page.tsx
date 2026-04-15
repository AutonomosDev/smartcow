/**
 * app/(protected)/chat/page.tsx — Página de chat IA.
 * Server Component wrapper: auth + data fetching.
 * Interactividad delegada a ChatPageClient.
 * Referencias: chat_web/web_ai_chat.png + web_ai_chat_sidebar.png
 *              mobile/mobile_ai_chat.png
 * Tickets: AUT-113, AUT-177
 */

import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getNombrePredio } from "@/src/lib/queries/predio";
import { ChatPageClientV3 } from "@/src/components/chat/chat-page-client-v3";

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
    <ChatPageClientV3
      predioId={predioId}
      initialMessage={initialMessage}
      nombrePredio={nombrePredio}
      userName={session.user.nombre}
      userEmail={session.user.email}
    />
  );
}
