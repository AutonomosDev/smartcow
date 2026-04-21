/**
 * src/lib/langfuse.ts — Cliente Langfuse self-hosted para observability del chat ganadero.
 * Ticket: AUT-272
 *
 * Langfuse corre en el VPS Hostinger (docker compose) y expone trazas en
 * https://langfuse.smartcow.cl. Instrumenta `app/api/chat/route.ts` con un
 * trace "chat.turn" por turno, con spans por cada fase (pickModel, cache,
 * anthropic, tool calls, SSE).
 *
 * chat_usage (AUT-263) sigue siendo la fuente para billing/budget. Langfuse
 * llena el hueco de debugging ("el chat respondió mal ayer") con la cadena
 * de llamadas dentro de un turno.
 *
 * Degradación graceful: si LANGFUSE_SECRET_KEY no está en env, exportamos
 * null y los call-sites usan optional chaining (`langfuse?.trace(...)`).
 */

import { Langfuse } from "langfuse";

export const langfuse: Langfuse | null = process.env.LANGFUSE_SECRET_KEY
  ? new Langfuse({
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
      baseUrl: process.env.LANGFUSE_HOST ?? "http://langfuse:3000",
    })
  : null;
