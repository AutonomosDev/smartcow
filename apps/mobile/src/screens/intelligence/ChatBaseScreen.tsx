import React, { useState, useRef } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const F = {
  regular: 'DMSans_400Regular',
  medium:  'DMSans_500Medium',
  bold:    'DMSans_600SemiBold',
};

// ── Tipos ───────────────────────────────────────────────────────────────────

import { GenerativeArtifact, ArtifactRenderer } from '../../components/generative/ArtifactRenderer';

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
  const navigation = useNavigation<any>();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

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

        {/* ── Mensajes ── */}
        <ScrollView
          ref={scrollRef}
          style={s.msgs}
          contentContainerStyle={s.msgsContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          <Text style={s.dateSep}>{config.dateSep}</Text>

          {config.messages.map((msg) => {
            if (msg.from === 'user') {
              return (
                <View key={msg.id} style={s.userRow}>
                  <View style={s.userBubble}>
                    <Text style={s.userTxt}>{msg.text}</Text>
                    <Text style={s.userTime}>{msg.time}</Text>
                  </View>
                </View>
              );
            }
            return (
              <View key={msg.id} style={s.aiRow}>
                <View style={s.aiAvatar}>
                  <Text style={s.aiAvatarTxt}>{config.avatarLabel}</Text>
                </View>
                <View style={s.aiContent}>
                  <View style={s.aiBubble}>
                    <Text style={s.aiTxt}>{msg.text}</Text>
                    <Text style={s.aiTime}>{msg.time}</Text>
                  </View>
                  {msg.artifacts && msg.artifacts.map((art, idx) => (
                    <ArtifactRenderer key={idx} artifact={art} />
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* ── Input bar — KAV solo aquí para Android ── */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[s.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TextInput
              style={s.input}
              placeholder={config.placeholder}
              placeholderTextColor="#aaa"
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity
              style={s.sendBtn}
              onPress={() => {
                if (input.trim() && config.onSend) {
                  config.onSend(input.trim());
                  setInput('');
                }
              }}
            >
              <View style={s.sendArrow} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </View>
  );
}

// ── Estilos principales ──────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f1' },
  safe:      { flex: 1 },
  kav:       { flex: 1 },

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

  msgs:        { flex: 1 },
  msgsContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  dateSep:     { fontFamily: F.regular, fontSize: 9, color: '#bbb', textAlign: 'center', marginVertical: 2 },

  userRow:    { flexDirection: 'row', justifyContent: 'flex-end' },
  userBubble: { backgroundColor: '#1e3a2f', borderRadius: 16, borderBottomRightRadius: 4, paddingVertical: 8, paddingHorizontal: 12, maxWidth: '75%' },
  userTxt:    { fontFamily: F.regular, fontSize: 11, color: '#fff', lineHeight: 15 },
  userTime:   { fontFamily: F.regular, fontSize: 8, color: 'rgba(255,255,255,0.4)', marginTop: 3, textAlign: 'right' },

  aiRow:      { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  aiAvatar:   { width: 22, height: 22, borderRadius: 11, backgroundColor: '#ebe9e3', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  aiAvatarTxt:{ fontFamily: F.bold, fontSize: 8, color: '#1e3a2f' },
  aiContent:  { flex: 1 },
  aiBubble:   { backgroundColor: '#fff', borderRadius: 16, borderBottomLeftRadius: 4, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 0.5, borderColor: '#e8e5df', alignSelf: 'flex-start', maxWidth: '90%' },
  aiTxt:      { fontFamily: F.regular, fontSize: 11, color: '#1a1a1a', lineHeight: 15 },
  aiTime:     { fontFamily: F.regular, fontSize: 8, color: '#bbb', marginTop: 3 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    backgroundColor: '#f8f6f1',
    borderTopWidth: 0.5,
    borderTopColor: '#ebe9e3',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontFamily: F.regular,
    fontSize: 12,
    color: '#1a1a1a',
    borderWidth: 0.5,
    borderColor: '#e0ddd8',
    minHeight: 42,
    maxHeight: 100,
  },
  sendBtn:   { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1e3a2f', justifyContent: 'center', alignItems: 'center', marginBottom: 1 },
  sendArrow: { width: 0, height: 0, borderLeftWidth: 9, borderLeftColor: '#fff', borderTopWidth: 5, borderTopColor: 'transparent', borderBottomWidth: 5, borderBottomColor: 'transparent', marginLeft: 2 },
});


