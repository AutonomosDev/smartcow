import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Send } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ArtifactRenderer, GenerativeArtifact } from '../../components/generative/ArtifactRenderer';
import { mapToolResultToArtifact } from '../../components/generative/artifact-mapper';
import { openChatSSE, ChatSSEHandle } from '../../lib/sseClient';
import { useAuth } from '../../context/AuthContext';

export type BrainType = 'smartcow' | 'vet' | 'agro' | 'own';
export type ChatContext = 'management' | 'intelligence';

const BRAIN_CONFIG: Record<BrainType, { avatarLabel: string; name: string; subtitle: string; systemPrompt?: string }> = {
  smartcow: {
    avatarLabel: 'SC',
    name: 'SmartCow AI',
    subtitle: 'Fundo San Pedro · en línea',
  },
  vet: {
    avatarLabel: 'VB',
    name: 'VetBrain',
    subtitle: 'Asistente veterinario · en línea',
    systemPrompt:
      'Actúa como veterinario ganadero. Responde con foco clínico, diagnósticos y tratamientos basados en los datos del predio.',
  },
  agro: {
    avatarLabel: 'AB',
    name: 'AgroBrain',
    subtitle: 'Nutrición y recetas TMR · en línea',
    systemPrompt:
      'Actúa como agrónomo/nutricionista. Responde con foco en forraje, dieta, TMR e índices productivos.',
  },
  own: {
    avatarLabel: 'SC',
    name: 'SmartCow AI',
    subtitle: 'Fundo San Pedro · resumen ejecutivo',
    systemPrompt:
      'Actúa como asistente del dueño. Prioriza resumen ejecutivo, KPIs clave y alertas operativas.',
  },
};

const F = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_600SemiBold' };

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  time: string;
  artifacts?: GenerativeArtifact[];
  isTyping?: boolean;
}

export interface ChatScreenProps {
  brain?: BrainType;
  context?: ChatContext;
}

export default function ChatScreen({ brain = 'smartcow', context: _context = 'management' }: ChatScreenProps) {
  const navigation = useNavigation<any>();
  const { predioId } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sseHandleRef = useRef<ChatSSEHandle | null>(null);

  const brainCfg = BRAIN_CONFIG[brain];

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { sseHandleRef.current?.close(); };
  }, []);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    const userMsgId = Date.now().toString();
    const aiMsgId = (Date.now() + 1).toString();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setInputText('');
    setIsLoading(true);

    const userMsg: Message = { id: userMsgId, role: 'user', text, time: now };
    const aiMsg: Message = { id: aiMsgId, role: 'ai', text: '', time: now, isTyping: true };

    setMessages(prev => [...prev, userMsg, aiMsg]);

    // Build messages array for the API
    const apiMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...messages,
      userMsg,
    ].map(m => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.text,
    }));

    // Prepend system prompt as a user/assistant pair workaround, or pass via body.
    // The backend accepts a `system` field separately. We send it as `system_prompt`.
    let finalContent = '';
    const artifacts: GenerativeArtifact[] = [];

    sseHandleRef.current = openChatSSE({
      path: '/api/chat',
      body: {
        messages: apiMessages,
        predio_id: predioId,
        reasoning_mode: false,
        ...(brainCfg.systemPrompt ? { system_prompt: brainCfg.systemPrompt } : {}),
      },
      onTextDelta: (delta) => {
        finalContent += delta;
        setMessages(prev => {
          const copy = [...prev];
          const idx = copy.findIndex(m => m.id === aiMsgId);
          if (idx !== -1) copy[idx] = { ...copy[idx], text: finalContent, isTyping: true };
          return copy;
        });
      },
      onToolUse: () => {
        // tool_use acknowledged — waiting for tool_result
      },
      onToolResult: (event) => {
        // event has tool_use_id and content — try to map to artifact
        const artifact = mapToolResultToArtifact({ tool: event.tool_use_id, result: event.content });
        if (artifact) {
          artifacts.push(artifact);
          setMessages(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(m => m.id === aiMsgId);
            if (idx !== -1) copy[idx] = { ...copy[idx], artifacts: [...artifacts] };
            return copy;
          });
        }
      },
      onDone: () => {
        setIsLoading(false);
        setMessages(prev => {
          const copy = [...prev];
          const idx = copy.findIndex(m => m.id === aiMsgId);
          if (idx !== -1) copy[idx] = { ...copy[idx], isTyping: false };
          return copy;
        });
      },
      onError: (_err) => {
        setIsLoading(false);
        setMessages(prev => {
          const copy = [...prev];
          const idx = copy.findIndex(m => m.id === aiMsgId);
          if (idx !== -1) copy[idx] = { ...copy[idx], text: 'Error al consultar SmartCow.', isTyping: false };
          return copy;
        });
      },
    });
  };

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>
        {/* Header */}
        <View style={s.hdr}>
          <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
            <ChevronLeft size={20} color="#1e3a2f" />
          </TouchableOpacity>
          <View style={s.hdrContent}>
            <View style={s.avatar}><Text style={s.avatarTxt}>{brainCfg.avatarLabel}</Text></View>
            <View>
              <Text style={s.hdrName}>{brainCfg.name}</Text>
              <Text style={s.hdrSub}>{brainCfg.subtitle}</Text>
            </View>
          </View>
          <View style={s.onlineDot} />
        </View>

        {/* Chat Area */}
        <ScrollView
          ref={scrollRef}
          style={s.msgsArea}
          contentContainerStyle={s.msgsScroll}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={s.emptyState}>
              <View style={s.emptyAvatar}><Text style={s.emptyAvatarTxt}>{brainCfg.avatarLabel}</Text></View>
              <Text style={s.emptyTitle}>¿En qué te ayudo?</Text>
              <Text style={s.emptySub}>{brainCfg.subtitle} · Pregúntame sobre tus lotes, animales o finanzas</Text>
            </View>
          )}

          {messages.map((m) => (
            <View key={m.id}>
              <View style={[s.row, m.role === 'user' ? s.rowUser : s.rowAi]}>
                {m.role === 'ai' && (
                  <View style={s.miniAv}><Text style={s.miniAvTxt}>{brainCfg.avatarLabel}</Text></View>
                )}
                <View style={[s.bubble, m.role === 'user' ? s.bubbleUser : s.bubbleAi]}>
                  {m.isTyping && !m.text ? (
                    <View style={s.typingRow}>
                      {[0, 1, 2].map(i => (
                        <View key={i} style={[s.dot, { opacity: 0.4 + i * 0.2 }]} />
                      ))}
                    </View>
                  ) : (
                    <Text style={[s.txt, m.role === 'user' ? s.txtUser : s.txtAi]}>{m.text}</Text>
                  )}
                  <Text style={[s.time, m.role === 'user' ? s.timeUser : s.timeAi]}>{m.time}</Text>
                </View>
              </View>

              {m.artifacts && m.artifacts.length > 0 && (
                <View style={s.artRow}>
                  {m.artifacts.map((art, idx) => (
                    <ArtifactRenderer key={idx} artifact={art} />
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Input Bar */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.inputBar}>
            <TextInput
              style={s.input}
              placeholder={isLoading ? `${brainCfg.name} está respondiendo...` : `Escribe a ${brainCfg.name}...`}
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[s.sendBtn, (!inputText.trim() || isLoading) && s.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
            >
              <Send size={18} color="#fff" fill="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f1' },
  safe: { flex: 1 },

  hdr: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 10, borderBottomWidth: 0.5, borderColor: '#ebe9e3',
    shadowColor: '#1a1a1a', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, backgroundColor: '#f8f6f1',
  },
  back: { marginRight: 12 },
  hdrContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#1e3a2f',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
    borderWidth: 1.5, borderColor: 'rgba(126,207,160,0.4)',
  },
  avatarTxt: { fontFamily: F.bold, fontSize: 11, color: '#7ecfa0' },
  hdrName: { fontFamily: F.bold, fontSize: 13, color: '#1a1a1a' },
  hdrSub: { fontFamily: F.medium, fontSize: 9, color: '#1e3a2f' },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1e3a2f' },

  msgsArea: { flex: 1 },
  msgsScroll: { padding: 12, paddingBottom: 24 },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyAvatar: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: '#1e3a2f',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyAvatarTxt: { fontFamily: F.bold, fontSize: 16, color: '#7ecfa0' },
  emptyTitle: { fontFamily: F.bold, fontSize: 18, color: '#1a1a1a', marginBottom: 8 },
  emptySub: { fontFamily: F.regular, fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 18 },

  row: { flexDirection: 'row', marginBottom: 8 },
  rowUser: { justifyContent: 'flex-end' },
  rowAi: { justifyContent: 'flex-start', alignItems: 'flex-end', gap: 6 },
  miniAv: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#ebe9e3',
    justifyContent: 'center', alignItems: 'center',
  },
  miniAvTxt: { fontFamily: F.bold, fontSize: 9, color: '#1e3a2f' },
  bubble: { padding: 10, maxWidth: '80%' },
  bubbleUser: { backgroundColor: '#1e3a2f', borderRadius: 16, borderBottomRightRadius: 4 },
  bubbleAi: { backgroundColor: '#fff', borderRadius: 16, borderBottomLeftRadius: 4, borderWidth: 0.5, borderColor: '#e8e5df' },
  txt: { fontFamily: F.regular, fontSize: 12, lineHeight: 16 },
  txtUser: { color: '#fff' },
  txtAi: { color: '#1a1a1a' },
  time: { fontSize: 8, marginTop: 4 },
  timeUser: { color: 'rgba(255,255,255,0.4)', textAlign: 'right' },
  timeAi: { color: '#bbb' },

  typingRow: { flexDirection: 'row', gap: 4, alignItems: 'center', paddingVertical: 4, paddingHorizontal: 2 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#1e3a2f' },

  artRow: { marginLeft: 28, marginBottom: 12 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, paddingBottom: 28, backgroundColor: '#f8f6f1',
    borderTopWidth: 0.5, borderColor: '#ebe9e3',
  },
  input: {
    flex: 1, backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, minHeight: 42,
    fontFamily: F.regular, fontSize: 13, color: '#1a1a1a',
    borderWidth: 0.5, borderColor: '#e0ddd8',
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#1e3a2f',
    justifyContent: 'center', alignItems: 'center', marginBottom: 1,
  },
  sendBtnDisabled: { opacity: 0.4 },
});
