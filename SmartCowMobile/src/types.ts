// Core domain types for SmartCow Mobile

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  pending?: boolean; // true = stored offline, not yet sent
}

export interface AgentAction {
  id: string;
  label: string;
  status: 'running' | 'done' | 'error';
  detail?: string;
}

export type RootStackParamList = {
  Home: undefined;
  Chat: { initialMessage?: string };
  Voice: undefined;
};
