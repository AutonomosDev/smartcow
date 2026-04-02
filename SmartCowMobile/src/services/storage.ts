/**
 * Offline-first message storage using AsyncStorage.
 * Pending messages are stored here and synced when the network recovers.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../types';

const MESSAGES_KEY = '@smartcow:messages';
const PENDING_KEY = '@smartcow:pending';

export async function loadMessages(): Promise<ChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(MESSAGES_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export async function saveMessages(messages: ChatMessage[]): Promise<void> {
  try {
    await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  } catch {
    // silently fail — messages are still in memory
  }
}

export async function enqueuePending(message: ChatMessage): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    const queue: ChatMessage[] = raw ? JSON.parse(raw) : [];
    queue.push(message);
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(queue));
  } catch {
    // ignore
  }
}

export async function flushPending(): Promise<ChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    if (!raw) {
      return [];
    }
    const queue: ChatMessage[] = JSON.parse(raw);
    await AsyncStorage.removeItem(PENDING_KEY);
    return queue;
  } catch {
    return [];
  }
}
