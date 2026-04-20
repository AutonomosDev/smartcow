/**
 * app/(protected)/chat/page.tsx
 */

import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { getNombrePredio, getPrimerPredioDeOrg } from "@/src/lib/queries/predio";
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

  const prediosUsuario = session.user.predios;
  const predioId =
    prediosUsuario.length > 0
      ? prediosUsuario[0]
      : await getPrimerPredioDeOrg(session.user.orgId);

  if (!predioId) redirect("/dashboard");

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
