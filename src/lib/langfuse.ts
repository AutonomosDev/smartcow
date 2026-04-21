/**
 * src/lib/langfuse.ts — Cliente Langfuse self-hosted para observability del chat ganadero.
 * Ticket: AUT-272
 *
 * Langfuse corre en el VPS Hostinger (docker compose) y expone trazas en
 * https://langfuse.smartcow.cl. Instrumentamos `app/api/chat/route.ts` con un
 * trace "chat.turn" por turno, con spans por cada fase (pickModel, cache,
 * anthropic, tool calls, SSE).
 *
 * chat_usage (AUT-263) sigue siendo la fuente para billing/budget. Langfuse
 * llena el hueco de debugging ("el chat respondió mal ayer") con la cadena
 * de llamadas dentro de un turno.
 *
 * Degradación graceful: si LANGFUSE_SECRET_KEY no está en env, exportamos
 * un stub no-op que no traza. Warning único por proceso.
 */

import { Langfuse } from "langfuse";

type LangfuseTraceLike = ReturnType<Langfuse["trace"]>;
type LangfuseSpanLike = ReturnType<LangfuseTraceLike["span"]>;

export interface Trace {
  id: string;
  span(params: { name: string; input?: unknown; metadata?: Record<string, unknown> }): Span;
  update(params: { output?: unknown; metadata?: Record<string, unknown>; tags?: string[] }): void;
  end(params?: { output?: unknown; metadata?: Record<string, unknown> }): void;
}

export interface Span {
  id: string;
  end(params?: {
    output?: unknown;
    metadata?: Record<string, unknown>;
    level?: "DEFAULT" | "DEBUG" | "WARNING" | "ERROR";
    statusMessage?: string;
  }): void;
}

let client: Langfuse | null = null;
let warnedMissingConfig = false;

function getClient(): Langfuse | null {
  if (client) return client;

  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const baseUrl = process.env.LANGFUSE_HOST;

  if (!secretKey || !publicKey || !baseUrl) {
    if (!warnedMissingConfig) {
      console.warn(
        "[langfuse] disabled — LANGFUSE_SECRET_KEY/PUBLIC_KEY/HOST no configurados. Tracing se omitirá."
      );
      warnedMissingConfig = true;
    }
    return null;
  }

  try {
    client = new Langfuse({ secretKey, publicKey, baseUrl });
    return client;
  } catch (err) {
    if (!warnedMissingConfig) {
      console.warn("[langfuse] init failed:", err instanceof Error ? err.message : err);
      warnedMissingConfig = true;
    }
    return null;
  }
}

function wrapSpan(raw: LangfuseSpanLike | null): Span {
  if (!raw) {
    return {
      id: "noop",
      end: () => {},
    };
  }
  return {
    id: raw.id,
    end(params) {
      try {
        raw.end({
          output: params?.output,
          metadata: params?.metadata,
          level: params?.level,
          statusMessage: params?.statusMessage,
        });
      } catch {
        // no-op — tracing no debe romper el chat
      }
    },
  };
}

function wrapTrace(raw: LangfuseTraceLike | null): Trace {
  if (!raw) {
    return {
      id: "noop",
      span: () => wrapSpan(null),
      update: () => {},
      end: () => {},
    };
  }
  return {
    id: raw.id,
    span({ name, input, metadata }) {
      try {
        const s = raw.span({ name, input, metadata });
        return wrapSpan(s);
      } catch {
        return wrapSpan(null);
      }
    },
    update({ output, metadata, tags }) {
      try {
        raw.update({ output, metadata, tags });
      } catch {
        // no-op
      }
    },
    end(params) {
      try {
        raw.update({ output: params?.output, metadata: params?.metadata });
      } catch {
        // no-op
      }
    },
  };
}

/**
 * Crea una traza para un turno de chat. Si Langfuse no está configurado,
 * retorna un stub no-op.
 */
export function startTrace(params: {
  name: string;
  userId?: string | number;
  sessionId?: string;
  input?: unknown;
  metadata?: Record<string, unknown>;
  tags?: string[];
}): Trace {
  const lf = getClient();
  if (!lf) return wrapTrace(null);

  try {
    const t = lf.trace({
      name: params.name,
      userId: params.userId != null ? String(params.userId) : undefined,
      sessionId: params.sessionId,
      input: params.input,
      metadata: params.metadata,
      tags: params.tags,
    });
    return wrapTrace(t);
  } catch {
    return wrapTrace(null);
  }
}

/**
 * Flush pendiente al bus de Langfuse. Llamar al final del request para que
 * las trazas no se queden en buffer si el proceso se recicla.
 */
export async function flushTraces(): Promise<void> {
  const lf = client;
  if (!lf) return;
  try {
    await lf.flushAsync();
  } catch {
    // no-op — tracing no debe romper el chat
  }
}
