/**
 * app/(protected)/chat/page.tsx
 */

import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getNombrePredio } from "@/src/lib/queries/predio";
import { ChatPageClient } from "../chat-v2/chat-page-client";

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
    <ChatPageClient
      predioId={predioId}
      initialMessage={initialMessage}
      nombrePredio={nombrePredio}
      session={session}
    />
  );
}
