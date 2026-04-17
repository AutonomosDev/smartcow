import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { GenerativeArtifact, ArtifactRenderer } from '../../components/generative/ArtifactRenderer';

const F = {
  regular: 'DMSans_400Regular',
  medium:  'DMSans_500Medium',
  bold:    'DMSans_600SemiBold',
};

// ── Tipos ───────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  from: 'user' | 'ai';
  text: string;
  time: string;
  artifacts?: GenerativeArtifact[];
};

export type ChatConfig = {
  avatarLabel: string;
  name: string;
  subtitle: string;
  alertDot?: boolean;
  placeholder: string;
  dateSep: string;
  messages: Message[];
  onSend?: (text: string) => void;
};

// ── Componente principal ─────────────────────────────────────────────────────

export default function ChatBaseScreen({ config }: { config: ChatConfig }) {
  useNavigation<any>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [config.messages]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    config.onSend?.(text);
  };

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>
        {/* ── Header ── */}
        <View style={s.hdr}>
          <View style={s.hdrRow}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{config.avatarLabel}</Text>
            </View>
            <View style={s.hdrText}>
              <Text style={s.hdrName}>{config.name}</Text>
              <Text style={s.hdrSub}>{config.subtitle}</Text>
            </View>
            <View style={[s.dot, config.alertDot && s.dotAlert]} />
          </View>
        </View>

        {/* ── Messages ── */}
        <ScrollView
          ref={scrollRef}
          style={s.msgsArea}
          contentContainerStyle={s.msgsScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.dateSep}>{config.dateSep}</Text>

          {config.messages.map((m) => (
            <View key={m.id}>
              <View style={[s.row, m.from === 'user' ? s.rowUser : s.rowAi]}>
                {m.from === 'ai' && (
                  <View style={s.miniAv}>
                    <Text style={s.miniAvTxt}>{config.avatarLabel}</Text>
                  </View>
                )}
                <View style={[s.bubble, m.from === 'user' ? s.bubbleUser : s.bubbleAi]}>
                  <Text style={[s.txt, m.from === 'user' ? s.txtUser : s.txtAi]}>{m.text}</Text>
                  <Text style={[s.time, m.from === 'user' ? s.timeUser : s.timeAi]}>{m.time}</Text>
                </View>
              </View>

              {m.artifacts?.map((art, idx) => (
                <View key={idx} style={s.artRow}>
                  <ArtifactRenderer artifact={art} />
                </View>
              ))}
            </View>
          ))}
        </ScrollView>

        {/* ── Input ── */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        >
          <View style={[s.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TextInput
              style={s.input}
              placeholder={config.placeholder}
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
              returnKeyType="default"
            />
            <TouchableOpacity style={s.sendBtn} onPress={handleSend} activeOpacity={0.8}>
              <View style={s.sendArrow} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f1' },
  safe:      { flex: 1 },

  // Header
  hdr: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ebe9e3',
    backgroundColor: '#f8f6f1',
  },
  hdrRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar:    { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1e3a2f', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontFamily: F.bold, fontSize: 11, color: '#7ecfa0' },
  hdrText:   { flex: 1 },
  hdrName:   { fontFamily: F.bold, fontSize: 13, color: '#1a1a1a' },
  hdrSub:    { fontFamily: F.medium, fontSize: 9, color: '#1e3a2f' },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1e3a2f' },
  dotAlert:  { backgroundColor: '#e74c3c', width: 8, height: 8, borderRadius: 4 },

  // Messages
  msgsArea:   { flex: 1 },
  msgsScroll: { padding: 12, paddingBottom: 24 },
  dateSep:    { fontFamily: F.regular, fontSize: 9, color: '#bbb', textAlign: 'center', marginVertical: 8 },
  row:        { flexDirection: 'row', marginBottom: 8 },
  rowUser:    { justifyContent: 'flex-end' },
  rowAi:      { justifyContent: 'flex-start', alignItems: 'flex-end', gap: 6 },
  miniAv:     { width: 22, height: 22, borderRadius: 11, backgroundColor: '#ebe9e3', justifyContent: 'center', alignItems: 'center' },
  miniAvTxt:  { fontFamily: F.bold, fontSize: 8, color: '#1e3a2f' },
  bubble:     { padding: 10, maxWidth: '80%' },
  bubbleUser: { backgroundColor: '#1e3a2f', borderRadius: 16, borderBottomRightRadius: 4 },
  bubbleAi:   { backgroundColor: '#ffffff', borderRadius: 16, borderBottomLeftRadius: 4, borderWidth: 0.5, borderColor: '#e8e5df' },
  txt:        { fontFamily: F.regular, fontSize: 11, lineHeight: 15 },
  txtUser:    { color: '#fff' },
  txtAi:      { color: '#1a1a1a' },
  time:       { fontSize: 8, marginTop: 4 },
  timeUser:   { color: 'rgba(255,255,255,0.4)', textAlign: 'right' },
  timeAi:     { color: '#bbb' },
  artRow:     { marginLeft: 28, marginBottom: 12 },

  // Input
  inputBar:      { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, paddingTop: 10, backgroundColor: '#f8f6f1', borderTopWidth: 0.5, borderTopColor: '#ebe9e3' },
  input:         { flex: 1, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, minHeight: 42, fontFamily: F.regular, fontSize: 13, color: '#1a1a1a', borderWidth: 0.5, borderColor: '#e0ddd8' },
  sendBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1e3a2f', justifyContent: 'center', alignItems: 'center', marginBottom: 1 },
  sendArrow:     { width: 0, height: 0, borderLeftWidth: 9, borderLeftColor: '#fff', borderTopWidth: 5, borderTopColor: 'transparent', borderBottomWidth: 5, borderBottomColor: 'transparent', marginLeft: 2 },
});
