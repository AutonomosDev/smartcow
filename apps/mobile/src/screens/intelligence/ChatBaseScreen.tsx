import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated, PanResponder,
  Dimensions, Image, Modal, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Search, Menu, Paperclip, Mic, ArrowRight, ChevronLeft, SquarePen,
  Database, Copy, RefreshCcw, Bookmark, MessageCircle,
  FolderOpen, PanelRight, Info, X as XIcon,
  FileText, Cloud, Mail, Zap, Code2, Link2, Table2, Type,
} from 'lucide-react-native';
import { GenerativeArtifact, ArtifactRenderer } from '../../components/generative/ArtifactRenderer';
import { useAuth } from '../../context/AuthContext';

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
  onNewChat?: () => void;
  onAttach?: () => void;
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
  const [reportArtifacts, setReportArtifacts] = useState<GenerativeArtifact[]>([]);
  const [reportSummary, setReportSummary] = useState('');
  const [saveOpen, setSaveOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const openModalDeferred = (setter: (v: boolean) => void) => {
    requestAnimationFrame(() => requestAnimationFrame(() => setter(true)));
  };

  const reportX = useRef(new Animated.Value(SW)).current;
  const chatX   = useRef(new Animated.Value(0)).current;

  const openReport = (msg: Message) => {
    const firstLine = (msg.text || '').split('\n').find((l) => l.trim()) ?? '';
    const title = firstLine.replace(/^#+\s*/, '').trim().slice(0, 60) || 'Informe';
    const arts = msg.artifacts ?? [];
    // Summary = primera oración del texto (sin los datos que ya van en el artifact)
    const summary = (msg.text || '').split(/[.\n]/)[0].trim();

    setReportTitle(title);
    setReportArtifacts(arts);
    setReportSummary(summary);
    setReportContent(arts.length > 0 ? null : msg.text); // fallback markdown si no hay artifacts
    Animated.parallel([
      Animated.timing(reportX, { toValue: 0,          duration: 320, useNativeDriver: true }),
      Animated.timing(chatX,   { toValue: -SW * 0.18, duration: 320, useNativeDriver: true }),
    ]).start();
  };

  const closeReport = () => {
    setSaveOpen(false);
    setCopyOpen(false);
    Animated.parallel([
      Animated.timing(reportX, { toValue: SW, duration: 280, useNativeDriver: true }),
      Animated.timing(chatX,   { toValue: 0,  duration: 280, useNativeDriver: true }),
    ]).start(() => {
      setReportContent(null);
      setReportArtifacts([]);
      setReportSummary('');
    });
  };

  const startSave = (key: string) => {
    setSaving(key);
    setTimeout(() => { setSaving(null); setSaveOpen(false); }, 1800);
  };
  const doCopy = (key: string) => {
    setCopied(key);
    setTimeout(() => { setCopied(null); setCopyOpen(false); }, 1200);
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

  const { user } = useAuth();
  const chips = config.slashChips ?? DEFAULT_CHIPS;
  const fundo = config.subtitle.split('·')[0].trim();
  const firstName = user?.nombre?.split(' ')[0];

  const visibleMessages = (searchOpen && searchQuery.trim())
    ? config.messages.filter((m) => m.text.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : config.messages;

  return (
    <View style={s.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>

        {/* ── Chat panel ── */}
        <Animated.View style={[s.chatPanel, { transform: [{ translateX: chatX }] }]}>

          {/* Header — oculto en empty state */}
          {config.messages.length > 0 && (
            searchOpen ? (
              <View style={[s.hdr, { paddingTop: insets.top + 10 }]}>
                <Search size={16} color={C.ink3} />
                <TextInput
                  style={s.searchInput}
                  placeholder="Buscar en el chat"
                  placeholderTextColor={C.ink4}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                  returnKeyType="search"
                />
                <TouchableOpacity
                  style={s.icBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => { setSearchOpen(false); setSearchQuery(''); }}
                >
                  <XIcon size={16} color={C.ink2} />
                </TouchableOpacity>
              </View>
            ) : (
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
                <TouchableOpacity
                  style={s.icBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  onPress={() => setSearchOpen(true)}
                >
                  <Search size={16} color={C.ink2} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.icBtn, s.icBtnNew]}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  onPress={() => config.onNewChat?.()}
                >
                  <SquarePen size={16} color={C.green} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.icBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Menu size={16} color={C.ink2} />
                </TouchableOpacity>
              </View>
            )
          )}

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={s.msgs}
            contentContainerStyle={s.msgsPad}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {config.messages.length === 0 ? (
              <View style={s.emptyState}>
                {config.avatarSource && (
                  <Image source={config.avatarSource} style={s.emptyImg} resizeMode="contain" />
                )}
                <Text style={s.emptyTitle}>
                  {firstName ? `¿En qué te ayudo, ${firstName}?` : '¿En qué te ayudo?'}
                </Text>
                <Text style={s.emptySub}>
                  {fundo} · Pregunta sobre tus lotes, animales o finanzas
                </Text>
                <View style={s.emptyChips}>
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
                </View>
              </View>
            ) : (
              <Text style={s.dateSep}>{config.dateSep}</Text>
            )}

            {visibleMessages.map((m) => (
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

                    {((m.artifacts?.length ?? 0) > 0 || m.text.length > 300) && (
                      <TouchableOpacity
                        style={s.reportBtn}
                        onPress={() => openReport(m)}
                        activeOpacity={0.85}
                      >
                        <Text style={s.reportBtnTxt}>Ver informe completo</Text>
                        <ArrowRight size={13} color="#2b6a4a" />
                      </TouchableOpacity>
                    )}

                    <View style={s.aActions}>
                      <TouchableOpacity
                        style={s.aAct}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => openModalDeferred(setCopyOpen)}
                      >
                        <Copy size={12} color={C.ink4} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.aAct}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <RefreshCcw size={12} color={C.ink4} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.aAct}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => openModalDeferred(setSaveOpen)}
                      >
                        <Bookmark size={12} color={C.ink4} />
                      </TouchableOpacity>
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
                <Text style={s.dsPillSrc}>smartCow</Text>
              </View>

              {/* Slash chips — solo cuando hay mensajes */}
              {config.messages.length > 0 && (
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
              )}

              {/* Input row */}
              <View style={s.inputBox}>
                <TouchableOpacity
                  style={s.inputIc}
                  activeOpacity={0.7}
                  onPress={() => config.onAttach?.()}
                >
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

            {/* Header — igual que ArtifactPanel web */}
            <View style={[s.rptHdr, { paddingTop: insets.top + 10 }]}>
              <TouchableOpacity style={s.rptBack} onPress={closeReport} activeOpacity={0.8}>
                <ChevronLeft size={18} color={C.ink1} />
              </TouchableOpacity>
              <Text style={s.rptKind} numberOfLines={1}>{reportTitle}</Text>
              <View style={s.rptActions}>
                <TouchableOpacity style={s.rptAct} onPress={() => setSaveOpen(true)} activeOpacity={0.7}>
                  <FolderOpen size={14} color={C.ink2} />
                  <Text style={s.rptActArr}>▾</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.rptAct} onPress={() => setCopyOpen(true)} activeOpacity={0.7}>
                  <Copy size={14} color={C.ink2} />
                </TouchableOpacity>
                <TouchableOpacity style={s.rptAct} onPress={closeReport} activeOpacity={0.7}>
                  <XIcon size={14} color={C.ink2} />
                </TouchableOpacity>
                <TouchableOpacity style={s.rptAct} activeOpacity={0.7}>
                  <PanelRight size={14} color={C.ink2} />
                  <Text style={s.rptActArr}>▾</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Comment bar */}
            <View style={s.rptCommentBar}>
              <Info size={11} color={C.ink3} />
              <Text style={s.rptCommentTxt}>Toca cualquier texto para comentar a smartCow</Text>
            </View>

            <ScrollView
              style={s.rptBody}
              contentContainerStyle={s.rptBodyPad}
              showsVerticalScrollIndicator={false}
            >
              {reportArtifacts.length > 0 ? (
                <View>
                  {reportSummary ? (
                    <Text style={s.rptSummary}>{reportSummary}</Text>
                  ) : null}
                  {reportArtifacts.map((art, i) => (
                    <View key={i} style={{ marginBottom: 16 }}>
                      <ArtifactRenderer artifact={art} />
                    </View>
                  ))}
                </View>
              ) : (
                renderMarkdown(reportContent)
              )}
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

        {/* ── Modales globales — accesibles desde chat y report panel ── */}
        {saveOpen && (
          <CwModal
            title="Guardar o compartir"
            sub={reportTitle}
            onClose={() => setSaveOpen(false)}
          >
            <CwModalOpt color="red"   icon={<FileText  size={16} color="#c23030" />} t1="Guardar como PDF"           t2={saving === 'pdf'     ? 'Generando PDF…'       : 'Se descarga local al equipo'}           working={saving === 'pdf'}     onPress={() => startSave('pdf')} />
            <CwModalOpt color="green" icon={<MessageCircle size={16} color="#1e3a2f" />} t1="Enviar por WhatsApp a JP" t2={saving === 'wa'      ? 'Enviando…'            : '+56 9 5432 1876 · contacto frecuente'}  working={saving === 'wa'}      onPress={() => startSave('wa')} />
            <CwModalOpt color="blue"  icon={<Cloud     size={16} color="#1a5276" />} t1="Guardar en Google Drive"      t2={saving === 'drive'   ? 'Subiendo…'            : 'smartCow / Informes / Fundo San Pedro' } working={saving === 'drive'}   onPress={() => startSave('drive')} />
            <CwModalOpt color="amber" icon={<Mail      size={16} color="#9b5e1a" />} t1="Enviar por email"             t2={saving === 'email'   ? 'Enviando…'            : 'jp@agropecuaria.cl'}                    working={saving === 'email'}   onPress={() => startSave('email')} />
            <CwModalOpt              icon={<Zap       size={16} color="#1a5276" />} t1="Guardar como routine"         t2={saving === 'routine' ? 'Creando routine…'     : 'Re-ejecutable con /routine pesajes'}    working={saving === 'routine'} onPress={() => startSave('routine')} />
            <CwModalFoot saving={!!saving} label="listo para exportar" />
          </CwModal>
        )}

        {copyOpen && (
          <CwModal
            title="Copiar o exportar"
            sub={reportTitle}
            onClose={() => setCopyOpen(false)}
          >
            <CwModalOpt              icon={<Code2     size={16} color="#1a5276" />} t1="Copiar como Markdown"         t2={copied === 'md'    ? '✓ Copiado al portapapeles' : 'Formato crudo con headings y listas'}    onPress={() => doCopy('md')} />
            <CwModalOpt color="blue" icon={<Type      size={16} color="#1a5276" />} t1="Copiar como texto enriquecido" t2={copied === 'rich'  ? '✓ Copiado'               : 'Pegá directo en Docs, Notion, Gmail'}   onPress={() => doCopy('rich')} />
            <CwModalOpt color="amber"icon={<Link2     size={16} color="#9b5e1a" />} t1="Copiar link compartible"      t2={copied === 'link'  ? '✓ Copiado'               : 'Acceso solo para equipo smartCow'}       onPress={() => doCopy('link')} />
            <CwModalOpt color="red"  icon={<Table2    size={16} color="#c23030" />} t1="Exportar a Excel / CSV"       t2={copied === 'xlsx'  ? '✓ Generando .xlsx…'      : 'Solo tablas y KPIs del informe'}         onPress={() => doCopy('xlsx')} />
            <CwModalFoot saving={false} label="markdown · listo para exportar" />
          </CwModal>
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
  hdrName:      { fontFamily: F.bold, fontSize: 16, color: C.ink1, lineHeight: 19 },
  hdrMeta:      { fontFamily: F.mono, fontSize: 12, color: C.ink3, marginTop: 2 },
  icBtn:        { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  icBtnNew:     { backgroundColor: C.note, borderWidth: 0.5, borderColor: C.noteBd },
  searchInput:  { flex: 1, fontFamily: F.mono, fontSize: 13, color: C.ink1, paddingVertical: 4, paddingHorizontal: 8 },

  // Messages — .chat-body
  msgs:    { flex: 1, backgroundColor: C.bg },
  msgsPad: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 12, gap: 14, flexGrow: 1 },
  dateSep: { fontFamily: F.mono, fontSize: 11, color: C.ink4, textAlign: 'center', marginBottom: 4 },
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
    fontSize: 14,
    fontWeight: '500',
    color: C.blueFg,
    lineHeight: 20,
  },

  // AI prose — .a-prose
  aBlock:  { maxWidth: '88%' },
  aProse:  { fontFamily: F.regular, fontSize: 14.5, lineHeight: 22, color: C.blueFg },

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
  reportBtnTxt: { fontFamily: F.monoMd, fontSize: 13.5, fontWeight: '500', color: '#2b6a4a', letterSpacing: 0.2 },

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
  dsPillTxt:   { fontFamily: F.mono,   fontSize: 13, color: C.ink1 },
  dsPillBold:  { fontFamily: F.monoMd, fontSize: 13, fontWeight: '500' },
  dsPillArrow: { fontFamily: F.mono,   fontSize: 13, color: C.ink4 },
  dsPillSrc:   { fontFamily: F.mono,   fontSize: 13, color: C.ink3 },

  // .slash-row .chip
  // Empty state
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingTop: 160, paddingBottom: 40,
  },
  emptyImg:   { width: 200, height: 200, marginBottom: 18 },
  emptyTitle: { fontFamily: F.bold, fontSize: 22, color: C.ink1, letterSpacing: -0.3, textAlign: 'center', marginBottom: 8 },
  emptySub:   { fontFamily: F.regular, fontSize: 15, color: C.ink3, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  emptyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },

  chipScroll: { flexGrow: 0 },
  chipRow:    { flexDirection: 'row', gap: 5, paddingBottom: 2 },
  chip: {
    backgroundColor: C.blue, borderRadius: 8,
    paddingVertical: 4, paddingHorizontal: 9, flexShrink: 0,
  },
  chipTxt: { fontFamily: F.monoMd, fontSize: 12.5, fontWeight: '500', color: C.blueFg },

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
  inputTxt:  { flex: 1, fontFamily: F.mono, fontSize: 14, color: C.ink1, maxHeight: 100 },

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
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingBottom: 10,
    backgroundColor: C.bg,
    borderBottomWidth: 0.5, borderBottomColor: C.fog,
  },
  rptBack:       { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  rptKind:       { flex: 1, fontFamily: F.regular, fontSize: 13, color: C.ink2 },
  rptActions:    { flexDirection: 'row', gap: 2, alignItems: 'center' },
  rptAct:        { width: 26, height: 26, borderRadius: 5, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 1 },
  rptActArr:     { fontSize: 9, color: C.ink4 },
  rptCommentBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, paddingBottom: 12 },
  rptCommentTxt: { fontFamily: F.regular, fontSize: 11.5, color: C.ink2 },
  rptBody:       { flex: 1, backgroundColor: C.rptBg },
  rptBodyPad:    { padding: 18, paddingBottom: 120 },
  rptSummary:    { fontFamily: F.regular, fontSize: 14, lineHeight: 21, color: C.blueFg, marginBottom: 16 },

  // Modal overlay
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,20,20,.38)',
    zIndex: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '88%', backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.22, shadowRadius: 60, elevation: 20,
    overflow: 'hidden',
  },
  modalHead: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  modalTitle: { flex: 1, fontFamily: F.bold, fontSize: 15, color: C.ink1 },
  modalClose: { width: 26, height: 26, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  modalSub:   { paddingHorizontal: 20, paddingBottom: 12, fontFamily: F.regular, fontSize: 12.5, color: C.ink2 },
  modalBody:  { paddingHorizontal: 10, paddingBottom: 10 },
  modalOpt: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 10, borderRadius: 8,
  },
  modalOptIco: {
    width: 34, height: 34, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  modalOptT1:  { fontFamily: F.medium, fontSize: 13.5, color: C.ink1 },
  modalOptT2:  { fontFamily: F.regular, fontSize: 11.5, color: C.ink2, marginTop: 1 },
  modalOptArr: { fontFamily: F.regular, fontSize: 14, color: C.ink4 },
  modalFoot: {
    borderTopWidth: 1, borderTopColor: '#eee',
    paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  modalFootDot:  { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#7bc59c' },
  modalFootSpin: { width: 11, height: 11, borderRadius: 5.5, borderWidth: 1.5, borderColor: '#dde3f5', borderTopColor: '#4b7bec' },
  modalFootTxt:  { fontFamily: F.mono, fontSize: 11.5, color: C.ink3 },

  fab: {
    position: 'absolute', right: 18,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.green,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: C.green, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 24, elevation: 8,
  },
});

// ── Modal components ─────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, { bg: string; fg: string }> = {
  red:   { bg: '#fbefef', fg: '#c23030' },
  green: { bg: '#e6f3ec', fg: '#1e3a2f' },
  blue:  { bg: '#eaf0f7', fg: '#1a5276' },
  amber: { bg: '#fdf0e6', fg: '#9b5e1a' },
};

function CwModal({ title, sub, onClose, children }: {
  title: string; sub: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View
          style={StyleSheet.absoluteFill}
          onStartShouldSetResponder={() => true}
          onResponderRelease={onClose}
        />
        <View style={s.modalCard}>
          <View style={s.modalHead}>
            <Text style={s.modalTitle}>{title}</Text>
            <TouchableOpacity style={s.modalClose} onPress={onClose} activeOpacity={0.7}>
              <XIcon size={15} color={C.ink3} />
            </TouchableOpacity>
          </View>
          <Text style={s.modalSub}>{sub}</Text>
          <View style={s.modalBody}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

function CwModalOpt({ color, icon, t1, t2, working, onPress }: {
  color?: string; icon: React.ReactNode; t1: string; t2: string;
  working?: boolean; onPress?: () => void;
}) {
  const c = color ? (COLOR_MAP[color] ?? COLOR_MAP.blue) : COLOR_MAP.blue;
  return (
    <TouchableOpacity style={s.modalOpt} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.modalOptIco, { backgroundColor: c.bg }]}>
        {working
          ? <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: c.fg, borderTopColor: 'transparent' }} />
          : icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.modalOptT1}>{t1}</Text>
        <Text style={s.modalOptT2}>{t2}</Text>
      </View>
      <Text style={s.modalOptArr}>→</Text>
    </TouchableOpacity>
  );
}

function CwModalFoot({ saving, label }: { saving: boolean; label: string }) {
  return (
    <View style={s.modalFoot}>
      {saving
        ? <View style={s.modalFootSpin} />
        : <View style={s.modalFootDot} />}
      <Text style={s.modalFootTxt}>{saving ? 'procesando…' : label}</Text>
    </View>
  );
}

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
