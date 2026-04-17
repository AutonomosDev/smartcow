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
import { API_BASE_URL } from '../../lib/config';
import { getStoredToken } from '../../lib/auth';
import { useAuth } from '../../context/AuthContext';

const F = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_600SemiBold' };

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  time: string;
  artifacts?: GenerativeArtifact[];
  isTyping?: boolean;
}

export default function SmartCowChatScreen() {
  const navigation = useNavigation<any>();
  const { predioId } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleSend = async () => {
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

    try {
      const token = await getStoredToken();
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/api/chat`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      let processedIndex = 0;
      let finalContent = '';
      let artifacts: GenerativeArtifact[] = [];

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3 || xhr.readyState === 4) {
          const responseText = xhr.responseText;
          if (!responseText) return;

          const newChunk = responseText.substring(processedIndex);
          const lines = newChunk.split('\n');

          const lastNewline = responseText.lastIndexOf('\n');
          if (lastNewline > processedIndex) processedIndex = lastNewline + 1;

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            try {
              const event = JSON.parse(jsonStr);
              if (event.type === 'text_delta') {
                finalContent += event.delta;
              } else if (event.type === 'tool_result' && event.tool && event.result) {
                const artifact = mapToolResultToArtifact({ tool: event.tool, result: event.result });
                if (artifact) artifacts.push(artifact);
              }
            } catch (e) {}
          }

          setMessages(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(m => m.id === aiMsgId);
            if (idx !== -1) {
              copy[idx] = {
                ...copy[idx],
                text: finalContent || '',
                artifacts: [...artifacts],
                isTyping: xhr.readyState !== 4,
              };
            }
            return copy;
          });

          if (xhr.readyState === 4 && xhr.status !== 200) {
            setMessages(prev => {
              const copy = [...prev];
              const idx = copy.findIndex(m => m.id === aiMsgId);
              if (idx !== -1) copy[idx] = { ...copy[idx], text: 'Error al consultar SmartCow.', isTyping: false };
              return copy;
            });
          }
        }
      };

      xhr.onerror = () => {
        setIsLoading(false);
        setMessages(prev => {
          const copy = [...prev];
          const idx = copy.findIndex(m => m.id === aiMsgId);
          if (idx !== -1) copy[idx] = { ...copy[idx], text: 'Error de red al consultar SmartCow.', isTyping: false };
          return copy;
        });
      };

      xhr.onload = () => setIsLoading(false);

      xhr.send(JSON.stringify({
        messages: [...messages, userMsg].map(m => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.text,
        })),
        predio_id: predioId,
        reasoning_mode: false,
      }));

    } catch (err) {
      setIsLoading(false);
    }
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
            <View style={s.avatar}><Text style={s.avatarTxt}>SC</Text></View>
            <View>
              <Text style={s.hdrName}>SmartCow AI</Text>
              <Text style={s.hdrSub}>Fundo San Pedro · en línea</Text>
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
              <View style={s.emptyAvatar}><Text style={s.emptyAvatarTxt}>SC</Text></View>
              <Text style={s.emptyTitle}>¿En qué te ayudo?</Text>
              <Text style={s.emptySub}>Fundo San Pedro · Pregúntame sobre tus lotes, animales o finanzas</Text>
              <View style={s.chipsGrid}>
                {[
                  '¿Cómo van los lotes?',
                  '¿Cuánto gano si vendo hoy?',
                  '¿Animales que necesitan atención?',
                  'Costos del predio este mes',
                ].map((chip, i) => (
                  <TouchableOpacity key={i} style={s.chip} onPress={() => {
                    setInputText(chip);
                    setTimeout(() => handleSend(), 50);
                  }}>
                    <Text style={s.chipTxt}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {messages.map((m) => (
            <View key={m.id}>
              <View style={[s.row, m.role === 'user' ? s.rowUser : s.rowAi]}>
                {m.role === 'ai' && (
                  <View style={s.miniAv}><Text style={s.miniAvTxt}>SC</Text></View>
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
              placeholder={isLoading ? 'SmartCow está respondiendo...' : 'Escribe a SmartCow...'}
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

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyAvatar: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: '#1e3a2f',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyAvatarTxt: { fontFamily: F.bold, fontSize: 16, color: '#7ecfa0' },
  emptyTitle: { fontFamily: F.bold, fontSize: 18, color: '#1a1a1a', marginBottom: 8 },
  emptySub: { fontFamily: F.regular, fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  chip: {
    backgroundColor: '#fff', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 0.5, borderColor: '#e0ddd8',
  },
  chipTxt: { fontFamily: F.medium, fontSize: 12, color: '#1e3a2f' },

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

  // Typing dots
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
