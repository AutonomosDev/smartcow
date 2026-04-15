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

const F = {
  regular: 'DMSans_400Regular',
  medium:  'DMSans_500Medium',
  bold:    'DMSans_600SemiBold',
};

// ── Tipos ───────────────────────────────────────────────────────────────────

type ArtifactRow = { label: string; value: string; color?: 'ok' | 'warn' | 'orange' };
type KpiItem     = { val: string; lbl: string; color?: 'ok' };
type AlertItem   = { level: 'Urgente' | 'Atención' | 'Info'; text: string };

type Artifact =
  | { type: 'table';   title: string; rows: ArtifactRow[] }
  | { type: 'kpi';     title: string; kpis: KpiItem[]; rows?: ArtifactRow[] }
  | { type: 'alerts';  title: string; items: AlertItem[] };

type Message = {
  id: string;
  from: 'user' | 'ai';
  text: string;
  time: string;
  artifact?: Artifact;
};

export type ChatConfig = {
  avatarLabel: string;
  name: string;
  subtitle: string;
  alertDot?: boolean;
  placeholder: string;
  dateSep: string;
  messages: Message[];
};

// ── Colores alert level ──────────────────────────────────────────────────────
const ALERT_STYLES: Record<string, { bg: string; color: string }> = {
  Urgente:  { bg: '#fde8e8', color: '#c0392b' },
  Atención: { bg: '#fdf0e6', color: '#9b5e1a' },
  Info:     { bg: '#e6f0f8', color: '#1a5276' },
};

// ── Sub-componentes ──────────────────────────────────────────────────────────

function ArtifactCard({ artifact }: { artifact: Artifact }) {
  if (artifact.type === 'table') {
    return (
      <View style={a.wrap}>
        <View style={a.hdr}><Text style={a.title}>{artifact.title}</Text></View>
        <View style={a.body}>
          {artifact.rows.map((r, i) => (
            <View key={i} style={[a.row, i < artifact.rows.length - 1 && { marginBottom: 4 }]}>
              <Text style={a.lbl}>{r.label}</Text>
              <Text style={[a.val, r.color === 'ok' && { color: '#1e3a2f' }, r.color === 'warn' && { color: '#e74c3c' }, r.color === 'orange' && { color: '#f39c12' }]}>
                {r.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (artifact.type === 'kpi') {
    return (
      <View style={a.wrap}>
        <View style={a.hdr}><Text style={a.title}>{artifact.title}</Text></View>
        <View style={a.body}>
          <View style={a.kpiRow}>
            {artifact.kpis.map((k, i) => (
              <View key={i} style={a.kpi}>
                <Text style={[a.kpiVal, k.color === 'ok' && { color: '#1e3a2f' }]}>{k.val}</Text>
                <Text style={a.kpiLbl}>{k.lbl}</Text>
              </View>
            ))}
          </View>
          {artifact.rows && artifact.rows.length > 0 && (
            <>
              <View style={a.divider} />
              {artifact.rows.map((r, i) => (
                <View key={i} style={[a.row, i < (artifact.rows?.length ?? 0) - 1 && { marginBottom: 4 }]}>
                  <Text style={a.lbl}>{r.label}</Text>
                  <Text style={[a.val, r.color === 'ok' && { color: '#1e3a2f' }]}>{r.value}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      </View>
    );
  }

  if (artifact.type === 'alerts') {
    return (
      <View style={a.wrap}>
        <View style={a.hdr}><Text style={a.title}>{artifact.title}</Text></View>
        <View style={a.body}>
          {artifact.items.map((item, i) => {
            const st = ALERT_STYLES[item.level];
            return (
              <View key={i}>
                {i > 0 && <View style={a.divider} />}
                <View style={[a.alertRow, i < artifact.items.length - 1 && { marginBottom: 6 }]}>
                  <View style={[a.alertBadge, { backgroundColor: st.bg }]}>
                    <Text style={[a.alertBadgeTxt, { color: st.color }]}>{item.level}</Text>
                  </View>
                  <Text style={a.alertTxt}>{item.text}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  return null;
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function ChatBaseScreen({ config }: { config: ChatConfig }) {
  const navigation = useNavigation<any>();
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView
          style={s.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >

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
                    {msg.artifact && <ArtifactCard artifact={msg.artifact} />}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* ── Input bar ── */}
          <View style={s.inputBar}>
            <TextInput
              style={s.input}
              placeholder={config.placeholder}
              placeholderTextColor="#aaa"
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity style={s.sendBtn}>
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
    paddingBottom: 20,
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

// ── Estilos artifacts ────────────────────────────────────────────────────────

const a = StyleSheet.create({
  wrap:       { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#e8e5df', overflow: 'hidden', marginTop: 5, maxWidth: '92%' },
  hdr:        { backgroundColor: '#1e3a2f', paddingVertical: 7, paddingHorizontal: 10 },
  title:      { fontFamily: F.bold, fontSize: 9, color: '#fff' },
  body:       { padding: 9 },
  row:        { flexDirection: 'row', justifyContent: 'space-between' },
  lbl:        { fontFamily: F.regular, fontSize: 9, color: '#888' },
  val:        { fontFamily: F.bold, fontSize: 9, color: '#1a1a1a' },
  divider:    { height: 0.5, backgroundColor: '#f0ede8', marginVertical: 5 },
  kpiRow:     { flexDirection: 'row', gap: 6, marginBottom: 6 },
  kpi:        { flex: 1, alignItems: 'center' },
  kpiVal:     { fontFamily: F.bold, fontSize: 14, color: '#1a1a1a' },
  kpiLbl:     { fontFamily: F.regular, fontSize: 8, color: '#bbb', marginTop: 1 },
  alertRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  alertBadge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 20 },
  alertBadgeTxt: { fontFamily: F.bold, fontSize: 8 },
  alertTxt:   { fontFamily: F.regular, fontSize: 9, color: '#888', flex: 1, lineHeight: 14 },
});
