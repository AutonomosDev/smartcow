/**
 * Manages chat messages with offline-first logic.
 * Loads persisted messages on mount; saves on every change.
 * Sends pending messages when coming back online (NetInfo).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ChatMessage } from '../types';
import { loadMessages, saveMessages, enqueuePending, flushPending } from '../services/storage';
import { sendMessage, SendResult } from '../services/chat';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function useMessages() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [agentActions, setAgentActions] = useState<SendResult['agentActions']>([]);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Load from storage on mount
  useEffect(() => {
    loadMessages().then(saved => {
      if (saved.length > 0) {
        setMessages(saved);
      }
    });
  }, []);

  // Persist on every change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages]);

  // Flush pending messages when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        const pending = await flushPending();
        for (const msg of pending) {
          await handleSend(msg.content, true);
        }
      }
      appState.current = next;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const handleSend = useCallback(
    async (text: string, isRetry = false) => {
      if (!text.trim()) {
        return;
      }
      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: text.trim(),
        timestamp: Date.now(),
      };

      setMessages(prev => {
        const updated = [...prev, userMsg];
        return updated;
      });
      setLoading(true);
      setAgentActions([]);

      const result = await sendMessage(messages.concat(userMsg), text.trim());

      if (!result) {
        // Offline — store as pending
        if (!isRetry) {
          await enqueuePending(userMsg);
        }
        const offlineMsg: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: '_(Sin conexión — mensaje guardado para enviar al reconectar)_',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, offlineMsg]);
      } else {
        const assistantMsg: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: result.content,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMsg]);
        if (result.agentActions && result.agentActions.length > 0) {
          setAgentActions(result.agentActions);
        }
      }

      setLoading(false);
    },
    [messages],
  );

  return { messages, loading, agentActions, handleSend, addMessage };
}
