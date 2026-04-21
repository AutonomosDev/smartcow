/**
 * src/lib/langfuse.ts — Cliente Langfuse para observabilidad LLM.
 * AUT-272: Langfuse self-hosted en VPS.
 *
 * Export graceful: si faltan env vars, langfuse = null (no crashea en dev sin config).
 * En prod, LANGFUSE_SECRET_KEY + LANGFUSE_PUBLIC_KEY + LANGFUSE_HOST son obligatorias.
 */

import { Langfuse } from "langfuse";

export const langfuse: Langfuse | null = process.env.LANGFUSE_SECRET_KEY
  ? new Langfuse({
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
      baseUrl: process.env.LANGFUSE_HOST ?? "http://langfuse:3000",
    })
  : null;
