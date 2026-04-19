import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, SafeAreaView, Animated, PanResponder,
  Dimensions, Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Search, Menu, Paperclip, Mic, ArrowRight, ChevronLeft,
  Database, Copy, RefreshCcw, Bookmark, Share2, MoreHorizontal,
  MessageCircle, Save,
} from 'lucide-react-native';
import { GenerativeArtifact, ArtifactRenderer } from '../../components/generative/ArtifactRenderer';

const { width: SW } = Dimensions.get('window');

const F = {
  regular: 'DMSans_400Regular',
  medium:  'DMSans_500Medium',
  bold:    'DMSans_600SemiBold',
};

const GREEN = '#1e3a2f';
const CREAM = '#f8f6f1';

// ── Types ────────────────────────────────────────────────────────────────────

export type Message = {
  id: string;
  from: 'user' | 'ai';
  text: string;
  time: string;
  artifacts?: GenerativeArtifact[];
  isTyping?: boolean;
};

export type ChatConfig = {
  avatarLabel?: string;
  avatarSource?: ReturnType<typeof require>;
  name: string;
  subtitle: string;
  placeholder: string;
  dateSep: string;
  slashChips?: string[];
  messages: Message[];
  onSend?: (text: string) => void;
};

const DEFAULT_CHIPS = ['/feedlot', '/FT', '/vaquillas', '/partos', '/tratamientos', '/ventas'];

// ── Inline markdown parser ────────────────────────────────────────────────────

function InlineText({ text, style }: { text: string; style?: object }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**'))
          return <Text key={i} style={{ fontFamily: F.bold }}>{part.slice(2, -2)}</Text>;
        if (part.startsWith('*') && part.endsWith('*'))
          return <Text key={i} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</Text>;
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </Text>
  );
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    if (line.startsWith('# '))
      return nodes.push(<Text key={i} style={md.h1}>{line.slice(2)}</Text>);
    if (line.startsWith('## '))
      return nodes.push(<Text key={i} style={md.h2}>{line.slice(3)}</Text>);
    if (line.startsWith('### '))
      return nodes.push(<Text key={i} style={md.h3}>{line.slice(4)}</Text>);
    if (/^[-*] /.test(line))
      return nodes.push(
        <View key={i} style={md.bullet}>
          <Text style={md.bulletDot}>·</Text>
          <InlineText text={line.slice(2)} style={md.bulletTxt} />
        </View>
      );
    const numMatch = line.match(/^(\d+)\. (.*)/);
    if (numMatch)
      return nodes.push(
        <View key={i} style={md.bullet}>
          <Text style={md.bulletDot}>{numMatch[1]}.</Text>
          <InlineText text={numMatch[2]} style={md.bulletTxt} />
        </View>
      );
    if (line.trim() === '')
      return nodes.push(<View key={i} style={{ height: 8 }} />);
    nodes.push(<InlineText key={i} text={line} style={md.p} />);
  });
  return nodes;
}

// ── ChatBaseScreen ────────────────────────────────────────────────────────────

export default function ChatBaseScreen({ config }: { config: ChatConfig }) {
  useNavigation<any>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState('Informe');

  const reportX = useRef(new Animated.Value(SW)).current;
  const chatX   = useRef(new Animated.Value(0)).current;

  const openReport = (content: string, title = 'Informe') => {
    setReportContent(content);
    setReportTitle(title);
    Animated.parallel([
      Animated.timing(reportX, { toValue: 0, duration: 320, useNativeDriver: true }),
      Animated.timing(chatX,   { toValue: -SW * 0.07, duration: 320, useNativeDriver: true }),
    ]).start();
  };

  const closeReport = () => {
    Animated.parallel([
      Animated.timing(reportX, { toValue: SW, duration: 280, useNativeDriver: true }),
      Animated.timing(chatX,   { toValue: 0,  duration: 280, useNativeDriver: true }),
    ]).start(() => setReportContent(null));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => evt.nativeEvent.locationX < 32,
      onMoveShouldSetPanResponder:  (_, gs) => gs.dx > 8 && Math.abs(gs.dy) < Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        const dx = Math.max(0, gs.dx);
        reportX.setValue(dx);
        chatX.setValue(-SW * 0.07 * (1 - dx / SW));
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > 80) {
          closeReport();
        } else {
          Animated.parallel([
            Animated.spring(reportX, { toValue: 0,          useNativeDriver: true }),
            Animated.spring(chatX,   { toValue: -SW * 0.07, useNativeDriver: true }),
          ]).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [config.messages]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    config.onSend?.(text);
  };

  const chips = config.slashChips ?? DEFAULT_CHIPS;
  const fundo = config.subtitle.split('·')[0].trim();

  return (
    <View style={s.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>

        {/* ── Chat panel ── */}
        <Animated.View style={[s.chatPanel, { transform: [{ translateX: chatX }] }]}>

          {/* Header */}
          <View style={s.hdr}>
            {config.avatarSource ? (
              <Image source={config.avatarSource} style={s.avatarImg} />
            ) : (
              <View style={s.avatarCircle}>
                <Text style={s.avatarTxt}>{config.avatarLabel ?? 'AI'}</Text>
              </View>
            )}
            <View style={s.hdrText}>
              <Text style={s.hdrName}>{config.name}</Text>
              <Text style={s.hdrSub}>{config.subtitle}</Text>
            </View>
            <TouchableOpacity style={s.icBtn} activeOpacity={0.7}>
              <Search size={16} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity style={s.icBtn} activeOpacity={0.7}>
              <Menu size={16} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={s.msgs}
            contentContainerStyle={s.msgsPad}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={s.dateSep}>{config.dateSep}</Text>

            {config.messages.map((m) => (
              <View key={m.id} style={m.from === 'user' ? s.rowUser : s.rowAi}>
                {m.from === 'user' ? (
                  <View style={s.uBubble}>
                    <Text style={s.uTxt}>{m.text}</Text>
                  </View>
                ) : (
                  <View style={s.aBlock}>
                    {m.isTyping && !m.text ? (
                      <View style={s.shimmerRow}>
                        {[0, 1, 2].map((i) => (
                          <View key={i} style={[s.shimmerDot, { opacity: 0.3 + i * 0.2 }]} />
                        ))}
                      </View>
                    ) : (
                      <Text style={s.aTxt}>{m.text}</Text>
                    )}

                    {m.artifacts?.map((art, i) => (
                      <ArtifactRenderer key={i} artifact={art} />
                    ))}

                    {m.text.length > 300 && (
                      <TouchableOpacity
                        style={s.reportBtn}
                        onPress={() => {
                          const title = m.text.split('\n')[0].replace(/^#+\s*/, '').trim() || 'Informe';
                          openReport(m.text, title);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={s.reportBtnTxt}>Ver informe completo</Text>
                        <ArrowRight size={13} color={GREEN} />
                      </TouchableOpacity>
                    )}

                    <View style={s.aActions}>
                      <TouchableOpacity style={s.aAct}><Copy size={12} color="#bbb" /></TouchableOpacity>
                      <TouchableOpacity style={s.aAct}><RefreshCcw size={12} color="#bbb" /></TouchableOpacity>
                      <TouchableOpacity style={s.aAct}><Bookmark size={12} color="#bbb" /></TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Composer */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={insets.top}
          >
            <View style={[s.comp, { paddingBottom: Math.max(insets.bottom, 14) }]}>

              {/* Data source pill */}
              <View style={s.dsPill}>
                <Database size={11} color="#888" />
                <Text style={s.dsPillFundo}>{fundo}</Text>
                <Text style={s.dsPillArrow}>→</Text>
                <Text style={s.dsPillSrc}>AgroApp</Text>
              </View>

              {/* Slash chips scroll */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.chipScroll}
                contentContainerStyle={s.chipRow}
              >
                {chips.map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    style={s.chip}
                    onPress={() => setInputText(chip + ' ')}
                    activeOpacity={0.7}
                  >
                    <Text style={s.chipTxt}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Input row */}
              <View style={s.inputRow}>
                <TouchableOpacity style={s.icBtn} activeOpacity={0.7}>
                  <Paperclip size={15} color="#aaa" />
                </TouchableOpacity>
                <TextInput
                  style={s.input}
                  placeholder={config.placeholder}
                  placeholderTextColor="#bbb"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  returnKeyType="default"
                />
                <TouchableOpacity style={s.icBtn} activeOpacity={0.7}>
                  <Mic size={15} color="#aaa" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.sendBtn, !inputText.trim() && s.sendBtnOff]}
                  onPress={handleSend}
                  activeOpacity={0.8}
                >
                  <ArrowRight size={14} color={inputText.trim() ? '#fff' : '#aaa'} />
                </TouchableOpacity>
              </View>

            </View>
          </KeyboardAvoidingView>
        </Animated.View>

        {/* ── Report panel ── */}
        {reportContent !== null && (
          <Animated.View
            style={[s.reportPanel, { transform: [{ translateX: reportX }] }]}
            {...panResponder.panHandlers}
          >
            <View style={s.edgeHint} />

            <View style={[s.rptHdr, { paddingTop: insets.top + 6 }]}>
              <TouchableOpacity style={s.backBtn} onPress={closeReport} activeOpacity={0.8}>
                <ChevronLeft size={18} color="#1a1a1a" />
              </TouchableOpacity>
              <View style={s.rptHdrInfo}>
                <Text style={s.rptKind}>Informe</Text>
                <Text style={s.rptTitle} numberOfLines={1}>{reportTitle}</Text>
              </View>
              <TouchableOpacity style={s.rptAct}><Save size={15} color="#666" /></TouchableOpacity>
              <TouchableOpacity style={s.rptAct}><Share2 size={15} color="#666" /></TouchableOpacity>
              <TouchableOpacity style={s.rptAct}><MoreHorizontal size={15} color="#666" /></TouchableOpacity>
            </View>

            <ScrollView
              style={s.rptBody}
              contentContainerStyle={s.rptBodyPad}
              showsVerticalScrollIndicator={false}
            >
              {renderMarkdown(reportContent)}
            </ScrollView>

            <TouchableOpacity
              style={[s.fab, { bottom: insets.bottom + 24 }]}
              onPress={closeReport}
              activeOpacity={0.85}
            >
              <MessageCircle size={22} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        )}

      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: CREAM },
  safe:       { flex: 1 },
  chatPanel:  { flex: 1 },

  // Header
  hdr: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: '#ebe9e3',
    backgroundColor: CREAM, gap: 8,
  },
  avatarImg:    { width: 32, height: 32, borderRadius: 8, backgroundColor: '#fff' },
  avatarCircle: { width: 32, height: 32, borderRadius: 8, backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center' },
  avatarTxt:    { fontFamily: F.bold, fontSize: 11, color: '#7ecfa0' },
  hdrText:      { flex: 1 },
  hdrName:      { fontFamily: F.bold, fontSize: 13, color: '#1a1a1a' },
  hdrSub:       { fontFamily: F.medium, fontSize: 9, color: '#888', marginTop: 1 },
  icBtn:        { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },

  // Messages
  msgs:     { flex: 1 },
  msgsPad:  { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  dateSep:  { fontFamily: F.regular, fontSize: 9, color: '#ccc', textAlign: 'center', marginBottom: 14 },

  rowUser: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 },
  rowAi:   { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 12 },

  uBubble: {
    backgroundColor: GREEN, borderRadius: 8, borderBottomRightRadius: 2,
    paddingVertical: 9, paddingHorizontal: 13, maxWidth: '80%',
  },
  uTxt: { fontFamily: F.regular, fontSize: 13, color: '#fff', lineHeight: 18 },

  aBlock:  { maxWidth: '90%' },
  aTxt:    { fontFamily: F.regular, fontSize: 13, color: '#1a1a1a', lineHeight: 20 },

  shimmerRow: { flexDirection: 'row', gap: 5, paddingVertical: 8 },
  shimmerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN },

  reportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 8, alignSelf: 'flex-start',
    backgroundColor: '#f0f7ee', borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 10,
    borderWidth: 0.5, borderColor: 'rgba(30,58,47,.15)',
  },
  reportBtnTxt: { fontFamily: F.medium, fontSize: 12, color: GREEN },

  aActions: { flexDirection: 'row', gap: 4, marginTop: 8 },
  aAct:     { width: 26, height: 26, borderRadius: 6, backgroundColor: '#f5f5f2', justifyContent: 'center', alignItems: 'center' },

  // Composer
  comp: {
    backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#ebe9e3',
    paddingHorizontal: 12, paddingTop: 10, gap: 6,
  },

  dsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#f5f3ee', borderRadius: 8,
    paddingVertical: 5, paddingHorizontal: 10, alignSelf: 'flex-start',
  },
  dsPillFundo: { fontFamily: F.bold,    fontSize: 11, color: '#555' },
  dsPillArrow: { fontFamily: F.regular, fontSize: 11, color: '#aaa' },
  dsPillSrc:   { fontFamily: F.regular, fontSize: 11, color: '#888' },

  chipScroll: { flexGrow: 0 },
  chipRow:    { flexDirection: 'row', gap: 6, paddingVertical: 2 },
  chip: {
    backgroundColor: '#f0f7ee', borderRadius: 8,
    paddingVertical: 5, paddingHorizontal: 10,
    borderWidth: 0.5, borderColor: 'rgba(30,58,47,.15)',
  },
  chipTxt: { fontFamily: F.medium, fontSize: 12, color: GREEN },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  input: {
    flex: 1, fontFamily: F.regular, fontSize: 13.5, color: '#1a1a1a',
    borderWidth: 0.5, borderColor: '#e0ddd8', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 9, minHeight: 40, maxHeight: 120,
    backgroundColor: '#fafaf8',
  },
  sendBtn:    { width: 36, height: 36, borderRadius: 8, backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center' },
  sendBtnOff: { backgroundColor: '#ebebeb' },

  // Report panel
  reportPanel: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  edgeHint: {
    position: 'absolute', left: 0, top: '30%', bottom: '30%',
    width: 3, backgroundColor: '#e0e0e0', borderRadius: 2,
  },
  rptHdr: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#ebebeb', gap: 8,
  },
  backBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#f0f0ee', justifyContent: 'center', alignItems: 'center',
  },
  rptHdrInfo: { flex: 1 },
  rptKind:    { fontFamily: F.medium, fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 },
  rptTitle:   { fontFamily: F.bold, fontSize: 14, color: '#1a1a1a', marginTop: 1 },
  rptAct:     { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  rptBody:    { flex: 1 },
  rptBodyPad: { padding: 18, paddingBottom: 100 },

  fab: {
    position: 'absolute', right: 20,
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: GREEN,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: GREEN, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
});

// ── Markdown styles ───────────────────────────────────────────────────────────

const md = StyleSheet.create({
  h1:        { fontFamily: F.bold,    fontSize: 18, color: '#1a1a1a', marginBottom: 6, marginTop: 4, letterSpacing: -0.3 },
  h2:        { fontFamily: F.bold,    fontSize: 14, color: '#1a1a1a', marginBottom: 4, marginTop: 14 },
  h3:        { fontFamily: F.bold,    fontSize: 12, color: '#555',    marginBottom: 3, marginTop: 10 },
  p:         { fontFamily: F.regular, fontSize: 13, color: '#333',    lineHeight: 20,  marginBottom: 4 },
  bullet:    { flexDirection: 'row', gap: 6, marginBottom: 3, paddingLeft: 4 },
  bulletDot: { fontFamily: F.bold,    fontSize: 13, color: '#888',    marginTop: 1, minWidth: 14 },
  bulletTxt: { fontFamily: F.regular, fontSize: 13, color: '#333',    lineHeight: 20, flex: 1 },
});
