/**
 * app/(protected)/chat/page.tsx
 *
 * AUT-288: el chat ya no está lockeado a un predio. Opera sobre todos los predios
 * del scope del usuario. Este server component solo carga la session.
 */

import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { ChatPageClient } from "./chat-page-client";

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

  const params = await searchParams;
  const initialMessage = params.q;

  return (
    <ChatPageClient
      initialMessage={initialMessage}
      session={session}
    />
  );
}
