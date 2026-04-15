/**
 * Chat service — sends messages to the SmartCow AI backend.
 * Streams responses when possible; falls back to single response.
 * Offline: returns null and caller should enqueue to pending.
 */
import axios from 'axios';
import { ChatMessage } from '../types';

// Backend URL — override via env in a real build
const API_BASE = 'http://10.0.2.2:3000'; // Android emulator → localhost

export interface SendResult {
  content: string;
  agentActions?: Array<{ label: string; detail?: string }>;
}

export async function sendMessage(
  history: ChatMessage[],
  userText: string,
): Promise<SendResult | null> {
  try {
    const response = await axios.post(
      `${API_BASE}/api/chat`,
      {
        messages: history.map(m => ({ role: m.role, content: m.content })),
        userMessage: userText,
      },
      { timeout: 30_000 },
    );
    return response.data as SendResult;
  } catch {
    return null;
  }
}
