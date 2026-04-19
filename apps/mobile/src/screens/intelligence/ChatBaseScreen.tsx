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
  MessageCircle, Save, SquarePen,
} from 'lucide-react-native';
import { GenerativeArtifact, ArtifactRenderer } from '../../components/generative/ArtifactRenderer';

const { width: SW } = Dimensions.get('window');

// ── Design tokens — exactos del spec ─────────────────────────────────────────

const C = {
  bg:     '#fff',
  fog:    '#f0ede8',
  cream:  '#ebe9e3',
  ink1:   '#1a1a1a',
  ink2:   '#666',
  ink3:   '#999',
  ink4:   '#bbb',
  ink5:   '#e0ddd8',
  blue:   '#eaf0f7',
  blueFg: '#1a5276',
  green:  '#1e3a2f',
  note:   '#fafaf7',
  noteBd: '#e8e5dd',
  rptBg:  '#fdfcf8',
};

const F = {
  regular: 'DMSans_400Regular',
  medium:  'DMSans_500Medium',
  bold:    'DMSans_600SemiBold',
  mono:    'JetBrainsMono_400Regular',
  monoMd:  'JetBrainsMono_500Medium',
};

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Inline markdown (bold/italic) ────────────────────────────────────────────

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
  return text.split('\n').map((line, i) => {
    if (line.startsWith('# '))
      return <Text key={i} style={md.h1}>{line.slice(2)}</Text>;
    if (line.startsWith('## '))
      return <Text key={i} style={md.h2}>{line.slice(3)}</Text>;
    if (line.startsWith('### '))
      return <Text key={i} style={md.h3}>{line.slice(4)}</Text>;
    if (/^[-*] /.test(line))
      return (
        <View key={i} style={md.bullet}>
          <Text style={md.bulletDot}>·</Text>
          <InlineText text={line.slice(2)} style={md.bulletTxt} />
        </View>
      );
    const nm = line.match(/^(\d+)\. (.*)/);
    if (nm)
      return (
        <View key={i} style={md.bullet}>
          <Text style={md.bulletDot}>{nm[1]}.</Text>
          <InlineText text={nm[2]} style={md.bulletTxt} />
        </View>
      );
    if (line.trim() === '') return <View key={i} style={{ height: 8 }} />;
    return <InlineText key={i} text={line} style={md.p} />;
  });
}

// ── ChatBaseScreen ────────────────────────────────────────────────────────────

export default function ChatBaseScreen({ config }: { config: ChatConfig }) {
  const navigation = useNavigation<any>();
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
      Animated.timing(reportX, { toValue: 0,          duration: 320, useNativeDriver: true }),
      Animated.timing(chatX,   { toValue: -SW * 0.18, duration: 320, useNativeDriver: true }),
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
      onStartShouldSetPanResponder: (evt) => evt.nativeEvent.locationX < 28,
      onMoveShouldSetPanResponder:  (_, gs) => gs.dx > 8 && Math.abs(gs.dy) < Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        const dx = Math.max(0, gs.dx);
        reportX.setValue(dx);
        chatX.setValue(-SW * 0.18 * (1 - dx / SW));
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > 80) {
          closeReport();
        } else {
          Animated.parallel([
            Animated.spring(reportX, { toValue: 0,          useNativeDriver: true }),
            Animated.spring(chatX,   { toValue: -SW * 0.18, useNativeDriver: true }),
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
          <View style={[s.hdr, { paddingTop: insets.top + 10 }]}>
            {config.avatarSource ? (
              <Image source={config.avatarSource} style={s.avatarImg} />
            ) : (
              <View style={s.avatarCircle}>
                <Text style={s.avatarTxt}>{config.avatarLabel ?? 'AI'}</Text>
              </View>
            )}
            <View style={s.hdrText}>
              <Text style={s.hdrName}>{config.name}</Text>
              <Text style={s.hdrMeta}>{config.subtitle}</Text>
            </View>
            <TouchableOpacity style={s.icBtn} activeOpacity={0.7}>
              <Search size={16} color={C.ink2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.icBtn, s.icBtnNew]}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <SquarePen size={16} color={C.green} />
            </TouchableOpacity>
            <TouchableOpacity style={s.icBtn} activeOpacity={0.7}>
              <Menu size={16} color={C.ink2} />
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
              <View key={m.id} style={s.msgWrap}>
                {m.from === 'user' ? (
                  // User message — blue pill, LEFT aligned, mono font
                  <View style={s.uMsg}>
                    <Text style={s.uMsgTxt}>{m.text}</Text>
                  </View>
                ) : (
                  // AI response — flat prose, blue-fg color
                  <View style={s.aBlock}>
                    {m.isTyping && !m.text ? (
                      <View style={s.shimmerRow}>
                        {[0, 1, 2].map((i) => (
                          <View key={i} style={[s.shimmerDot, { opacity: 0.3 + i * 0.2 }]} />
                        ))}
                      </View>
                    ) : (
                      <Text style={s.aProse}>{m.text}</Text>
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
                        activeOpacity={0.85}
                      >
                        <Text style={s.reportBtnTxt}>Ver informe completo</Text>
                        <ArrowRight size={13} color="#2b6a4a" />
                      </TouchableOpacity>
                    )}

                    <View style={s.aActions}>
                      <TouchableOpacity style={s.aAct}><Copy size={12} color={C.ink4} /></TouchableOpacity>
                      <TouchableOpacity style={s.aAct}><RefreshCcw size={12} color={C.ink4} /></TouchableOpacity>
                      <TouchableOpacity style={s.aAct}><Bookmark size={12} color={C.ink4} /></TouchableOpacity>
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
            <View style={[s.comp, { paddingBottom: Math.max(insets.bottom + 6, 44) }]}>

              {/* Data source pill */}
              <View style={s.dsPill}>
                <Database size={12} color={C.ink2} />
                <Text style={s.dsPillTxt}>
                  <Text style={s.dsPillBold}>{fundo}</Text>
                </Text>
                <Text style={s.dsPillArrow}>→</Text>
                <Text style={s.dsPillSrc}>AgroApp</Text>
              </View>

              {/* Slash chips */}
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
              <View style={s.inputBox}>
                <TouchableOpacity style={s.inputIc} activeOpacity={0.7}>
                  <Paperclip size={14} color={C.ink1} />
                </TouchableOpacity>
                <TextInput
                  style={s.inputTxt}
                  placeholder={config.placeholder}
                  placeholderTextColor={C.ink4}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  returnKeyType="default"
                />
                <TouchableOpacity style={s.inputIc} activeOpacity={0.7}>
                  <Mic size={14} color={C.ink1} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.inputIc, s.inputSend]}
                  onPress={handleSend}
                  activeOpacity={0.85}
                >
                  <ArrowRight size={14} color="#fff" />
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

            <View style={[s.rptHdr, { paddingTop: insets.top + 10 }]}>
              <TouchableOpacity style={s.rptBack} onPress={closeReport} activeOpacity={0.8}>
                <ChevronLeft size={18} color={C.ink1} />
              </TouchableOpacity>
              <View style={s.rptHdrInfo}>
                <Text style={s.rptKind}>INFORME</Text>
                <Text style={s.rptTitle} numberOfLines={1}>{reportTitle}</Text>
              </View>
              <TouchableOpacity style={s.rptAct}><Save size={15} color={C.ink2} /></TouchableOpacity>
              <TouchableOpacity style={s.rptAct}><Share2 size={15} color={C.ink2} /></TouchableOpacity>
              <TouchableOpacity style={s.rptAct}><MoreHorizontal size={15} color={C.ink2} /></TouchableOpacity>
            </View>

            <ScrollView
              style={s.rptBody}
              contentContainerStyle={s.rptBodyPad}
              showsVerticalScrollIndicator={false}
            >
              {renderMarkdown(reportContent)}
            </ScrollView>

            <TouchableOpacity
              style={[s.fab, { bottom: insets.bottom + 28 }]}
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
  root:      { flex: 1, backgroundColor: C.bg },
  safe:      { flex: 1 },
  chatPanel: { flex: 1 },

  // Header — .chat-top
  hdr: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 10,
    backgroundColor: C.bg,
    borderBottomWidth: 0.5, borderBottomColor: C.fog,
  },
  avatarImg:    { width: 36, height: 36, objectFit: 'contain' },
  avatarCircle: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.green, justifyContent: 'center', alignItems: 'center' },
  avatarTxt:    { fontFamily: F.bold, fontSize: 12, color: '#7ecfa0' },
  hdrText:      { flex: 1 },
  hdrName:      { fontFamily: F.bold, fontSize: 14, color: C.ink1, lineHeight: 17 },
  hdrMeta:      { fontFamily: F.mono, fontSize: 10.5, color: C.ink3, marginTop: 2 },
  icBtn:        { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  icBtnNew:     { backgroundColor: C.note, borderWidth: 0.5, borderColor: C.noteBd },

  // Messages — .chat-body
  msgs:    { flex: 1, backgroundColor: C.bg },
  msgsPad: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 12, gap: 14 },
  dateSep: { fontFamily: F.mono, fontSize: 9, color: C.ink4, textAlign: 'center', marginBottom: 4 },
  msgWrap: { flexDirection: 'column' },

  // User message — .u-msg
  uMsg: {
    alignSelf: 'flex-start',
    backgroundColor: C.blue,
    borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 12,
    maxWidth: '82%',
  },
  uMsgTxt: {
    fontFamily: F.monoMd,
    fontSize: 12,
    fontWeight: '500',
    color: C.blueFg,
    lineHeight: 17,
  },

  // AI prose — .a-prose
  aBlock:  { maxWidth: '88%' },
  aProse:  { fontFamily: F.regular, fontSize: 12.5, lineHeight: 20, color: C.blueFg },

  shimmerRow: { flexDirection: 'row', gap: 5, paddingVertical: 8 },
  shimmerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },

  // .open-report-btn
  reportBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#f3f5f0',
    borderRadius: 6,
    paddingVertical: 6, paddingHorizontal: 12,
    borderWidth: 1, borderColor: 'transparent',
    marginTop: 6,
  },
  reportBtnTxt: { fontFamily: F.monoMd, fontSize: 12, fontWeight: '500', color: '#2b6a4a', letterSpacing: 0.2 },

  // .a-actions
  aActions: { flexDirection: 'row', gap: 4, marginTop: 4 },
  aAct:     { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },

  // Composer — .comp-wrap
  comp: {
    backgroundColor: C.bg,
    borderTopWidth: 0.5, borderTopColor: C.fog,
    paddingHorizontal: 12, paddingTop: 10, gap: 7,
  },

  // .ds-pill
  dsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 7, paddingHorizontal: 10,
    backgroundColor: C.bg,
    borderWidth: 0.5, borderColor: C.ink5, borderRadius: 8,
    alignSelf: 'flex-start',
  },
  dsPillTxt:   { fontFamily: F.mono,   fontSize: 11, color: C.ink1 },
  dsPillBold:  { fontFamily: F.monoMd, fontSize: 11, fontWeight: '500' },
  dsPillArrow: { fontFamily: F.mono,   fontSize: 11, color: C.ink4 },
  dsPillSrc:   { fontFamily: F.mono,   fontSize: 11, color: C.ink3 },

  // .slash-row .chip
  chipScroll: { flexGrow: 0 },
  chipRow:    { flexDirection: 'row', gap: 5, paddingBottom: 2 },
  chip: {
    backgroundColor: C.blue, borderRadius: 8,
    paddingVertical: 4, paddingHorizontal: 9, flexShrink: 0,
  },
  chipTxt: { fontFamily: F.monoMd, fontSize: 10.5, fontWeight: '500', color: C.blueFg },

  // .input-box
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.bg,
    borderWidth: 0.5, borderColor: C.ink5, borderRadius: 8,
    paddingVertical: 9, paddingHorizontal: 11,
    minHeight: 44,
  },
  inputIc:   { width: 28, height: 28, borderRadius: 14, backgroundColor: C.cream, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  inputSend: { backgroundColor: C.green },
  inputTxt:  { flex: 1, fontFamily: F.mono, fontSize: 12, color: C.ink1, maxHeight: 100 },

  // Report panel
  reportPanel: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.bg,
    shadowColor: '#000',
    shadowOffset: { width: -12, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 16,
  },
  edgeHint: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 16, zIndex: 10,
    backgroundColor: 'transparent',
  },
  rptHdr: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingBottom: 10,
    backgroundColor: C.bg,
    borderBottomWidth: 0.5, borderBottomColor: C.fog,
  },
  rptBack:    { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  rptHdrInfo: { flex: 1 },
  rptKind:    { fontFamily: F.mono,   fontSize: 9.5, color: C.ink3, letterSpacing: 0.3 },
  rptTitle:   { fontFamily: F.bold,   fontSize: 14,  color: C.ink1, lineHeight: 18, marginTop: 1 },
  rptAct:     { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  rptBody:    { flex: 1, backgroundColor: C.rptBg },
  rptBodyPad: { padding: 18, paddingBottom: 120 },

  fab: {
    position: 'absolute', right: 18,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.green,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: C.green, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 24, elevation: 8,
  },
});

// ── Markdown styles ───────────────────────────────────────────────────────────

const md = StyleSheet.create({
  h1:        { fontFamily: F.bold,  fontSize: 20, color: C.ink1, letterSpacing: -0.2, marginBottom: 4, marginTop: 0 },
  h2:        { fontFamily: F.bold,  fontSize: 13, color: C.ink1, marginBottom: 7, marginTop: 18 },
  h3:        { fontFamily: F.bold,  fontSize: 11, color: C.ink2, marginBottom: 3, marginTop: 10 },
  p:         { fontFamily: F.regular, fontSize: 12.5, color: C.blueFg, lineHeight: 20, marginBottom: 4 },
  bullet:    { flexDirection: 'row', gap: 6, marginBottom: 3, paddingLeft: 4 },
  bulletDot: { fontFamily: F.mono, fontSize: 12.5, color: C.ink2, marginTop: 1, minWidth: 14 },
  bulletTxt: { fontFamily: F.regular, fontSize: 12.5, color: C.blueFg, lineHeight: 20, flex: 1 },
});
