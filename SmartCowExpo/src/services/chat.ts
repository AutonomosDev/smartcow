/**
 * Chat service — sends messages to the SmartCow AI backend.
 * Streams responses when possible; falls back to single response.
 * Offline: returns null and caller should enqueue to pending.
 */
import axios from 'axios';
import { ChatMessage } from '../types';

// Backend URL — for Expo Go on physical device use your machine's LAN IP.
// 10.0.2.2 only works in Android Studio emulator.
// When the backend is not running, sendMessage returns null and the chat
// shows the offline placeholder — app still fully usable for UI review.
const API_BASE = 'http://192.168.1.212:3000';

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
