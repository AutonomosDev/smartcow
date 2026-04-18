/**
 * apps/mobile/src/lib/sseClient.ts
 *
 * Cliente SSE robusto para el chat ganadero.
 * - Usa react-native-sse (EventSource nativo para React Native)
 * - Timeout 30s sin datos
 * - Retry exponencial: 3 intentos, delays 1s → 2s → 4s (solo errores de red)
 * - Validación content-type en primer mensaje
 * - Al 401 → refreshIdToken → reintenta 1 vez → si falla refresh, sign-out
 */

import EventSource from 'react-native-sse';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

// ─── Tipos de eventos del backend ────────────────────────────────────────────

export interface TextDeltaEvent {
  type: 'text_delta';
  delta: string;
}

export interface ToolUseEvent {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultEvent {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
}

export interface DoneEvent {
  type: 'done';
}

export type ChatSSEEvent = TextDeltaEvent | ToolUseEvent | ToolResultEvent | DoneEvent;

// ─── Opciones de openChatSSE ──────────────────────────────────────────────────

export interface OpenChatSSEOptions {
  /** URL base del backend. Por defecto usa API_BASE_URL de config.ts */
  baseUrl?: string;
  /** Path del endpoint. Ejemplo: '/api/chat' */
  path: string;
  /** Body JSON que se envía al endpoint */
  body: Record<string, unknown>;
  onTextDelta: (delta: string) => void;
  onToolUse: (event: ToolUseEvent) => void;
  onToolResult: (event: ToolResultEvent) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

export interface ChatSSEHandle {
  close: () => void;
}

const TOKEN_KEY = '@smartcow:idToken';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

/** Intenta refrescar el token con el endpoint /api/mobile/auth/refresh */
async function doRefresh(baseUrl: string): Promise<string | null> {
  const currentToken = await getToken();
  if (!currentToken) return null;

  try {
    const res = await fetch(`${baseUrl}/api/mobile/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: currentToken }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { token?: string };
    if (!data.token) return null;

    await saveToken(data.token);
    return data.token;
  } catch {
    return null;
  }
}

async function doSignOut(): Promise<void> {
  await AsyncStorage.multiRemove(['@smartcow:idToken', '@smartcow:user']);
}

// ─── Implementación principal ─────────────────────────────────────────────────

/**
 * Abre un stream SSE al endpoint de chat.
 *
 * Retorna un handle con `{ close }` para cancelar la conexión.
 */
export function openChatSSE(options: OpenChatSSEOptions): ChatSSEHandle {
  const {
    baseUrl = API_BASE_URL,
    path,
    body,
    onTextDelta,
    onToolUse,
    onToolResult,
    onDone,
    onError,
  } = options;

  let closed = false;
  let es: EventSource | null = null;
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [1000, 2000, 4000];
  const DATA_TIMEOUT_MS = 30_000;

  function clearDataTimeout() {
    if (timeoutHandle !== null) {
      clearTimeout(timeoutHandle);
      timeoutHandle = null;
    }
  }

  function resetDataTimeout() {
    clearDataTimeout();
    if (closed) return;
    timeoutHandle = setTimeout(() => {
      if (closed) return;
      closeConnection();
      onError(new Error('Timeout: sin datos del servidor por 30 segundos'));
    }, DATA_TIMEOUT_MS);
  }

  function closeConnection() {
    clearDataTimeout();
    if (es) {
      es.close();
      es = null;
    }
  }

  async function connect(isRefreshRetry = false): Promise<void> {
    if (closed) return;

    const token = await getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${baseUrl}${path}`;
    let contentTypeValidated = false;

    es = new EventSource(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      timeout: DATA_TIMEOUT_MS,
    });

    resetDataTimeout();

    es.addEventListener('open', () => {
      attempt = 0; // reset retry counter on successful open
      resetDataTimeout();
    });

    es.addEventListener('message', async (event) => {
      if (closed) return;
      resetDataTimeout();

      const raw = event.data;
      if (!raw) return;

      // Validar content-type en el primer chunk de datos.
      // react-native-sse ya filtra solo text/event-stream, pero si el servidor
      // devuelve HTML de error, el primer mensaje será texto plano, no JSON.
      if (!contentTypeValidated) {
        contentTypeValidated = true;
        const trimmed = raw.trimStart();
        if (trimmed.startsWith('<!') || trimmed.startsWith('<html') || trimmed.startsWith('<HTML')) {
          closeConnection();
          closed = true;
          onError(new Error('El servidor devolvió HTML en lugar de text/event-stream'));
          return;
        }
      }

      // Parseo robusto: ignorar chunks incompletos o no-JSON
      let parsed: ChatSSEEvent;
      try {
        parsed = JSON.parse(raw) as ChatSSEEvent;
      } catch {
        // Chunk cortado o línea vacía — ignorar silenciosamente
        return;
      }

      switch (parsed.type) {
        case 'text_delta':
          onTextDelta(parsed.delta);
          break;
        case 'tool_use':
          onToolUse(parsed);
          break;
        case 'tool_result':
          onToolResult(parsed);
          break;
        case 'done':
          clearDataTimeout();
          closeConnection();
          closed = true;
          onDone();
          break;
      }
    });

    es.addEventListener('error', async (event) => {
      if (closed) return;
      clearDataTimeout();

      // El tipo del evento puede ser ErrorEvent, TimeoutEvent o ExceptionEvent
      const errEvent = event as { xhrStatus?: number; type: string };

      // 401 → intentar refresh
      if (errEvent.xhrStatus === 401) {
        closeConnection();

        if (isRefreshRetry) {
          // Ya intentamos refresh antes → sign-out
          closed = true;
          await doSignOut();
          onError(new Error('Sesión expirada — inicia sesión nuevamente'));
          return;
        }

        const newToken = await doRefresh(baseUrl);
        if (!newToken) {
          closed = true;
          await doSignOut();
          onError(new Error('Sesión expirada — inicia sesión nuevamente'));
          return;
        }

        // Reintento único tras refresh exitoso
        void connect(true);
        return;
      }

      // Errores de red → retry exponencial
      const isNetworkError =
        errEvent.xhrStatus === 0 ||
        errEvent.xhrStatus === undefined ||
        (typeof errEvent.xhrStatus === 'number' && errEvent.xhrStatus >= 500);

      if (isNetworkError && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt] ?? 4000;
        attempt += 1;
        closeConnection();
        setTimeout(() => {
          if (!closed) void connect(false);
        }, delay);
        return;
      }

      // Error definitivo
      closeConnection();
      closed = true;
      const statusText =
        errEvent.xhrStatus ? ` (HTTP ${errEvent.xhrStatus})` : '';
      onError(new Error(`Error de conexión SSE${statusText}`));
    });

    es.addEventListener('close', () => {
      clearDataTimeout();
    });
  }

  void connect(false);

  return {
    close: () => {
      closed = true;
      closeConnection();
    },
  };
}
