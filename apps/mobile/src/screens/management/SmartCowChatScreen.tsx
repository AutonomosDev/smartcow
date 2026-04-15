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
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Send, MoreHorizontal } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_600SemiBold' };

// --- TIPOS ---
type MessageRole = 'user' | 'ai';
type ArtifactType = 'gdp' | 'financial' | 'alerts';

interface ArtifactData {
  type: ArtifactType;
  title: string;
  items?: { label: string; value: string; status?: 'ok' | 'warn' | 'orange' }[];
  kpis?: { label: string; value: string; status?: 'ok' | 'none' }[];
  details?: { label: string; value: string; status?: 'ok' | 'none' }[];
}

interface Message {
  id: string;
  role: MessageRole;
  text: string;
  time: string;
  artifact?: ArtifactData;
}

// --- COMPONENTES DE ARTIFACTS ---

const ArtifactGDP = ({ data }: { data: ArtifactData }) => (
  <View style={s.artContainer}>
    <View style={s.artHdr}>
      <Text style={s.artTitle}>{data.title}</Text>
    </View>
    <View style={s.artBody}>
      {data.items?.map((item, i) => (
        <View key={i} style={s.miniRow}>
          <Text style={s.miniLbl}>{item.label}</Text>
          <Text style={[s.miniVal, item.status === 'ok' && s.valOk, item.status === 'warn' && s.valWarn, item.status === 'orange' && s.valOrange]}>
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  </View>
);

const ArtifactFinancial = ({ data }: { data: ArtifactData }) => (
  <View style={s.artContainer}>
    <View style={s.artHdr}>
      <Text style={s.artTitle}>{data.title}</Text>
    </View>
    <View style={s.artBody}>
      <View style={s.kpiRow}>
        {data.kpis?.map((kpi, i) => (
          <View key={i} style={s.kpi}>
            <Text style={[s.kpiVal, kpi.status === 'ok' && s.valOk]}>{kpi.value}</Text>
            <Text style={s.kpiLbl}>{kpi.label}</Text>
          </View>
        ))}
      </View>
      <View style={s.miniDivider} />
      {data.items?.map((item, i) => (
        <View key={i} style={s.miniRow}>
          <Text style={s.miniLbl}>{item.label}</Text>
          <Text style={[s.miniVal, item.status === 'ok' && s.valOk]}>{item.value}</Text>
        </View>
      ))}
    </View>
  </View>
);

const ArtifactAlerts = ({ data }: { data: ArtifactData }) => (
  <View style={s.artContainer}>
    <View style={s.artHdr}>
      <Text style={s.artTitle}>{data.title}</Text>
    </View>
    <View style={s.artBody}>
      {data.items?.map((item, i) => (
        <React.Fragment key={i}>
          <View style={[s.miniRow, { alignItems: 'flex-start', gap: 6 }]}>
            <View style={[s.badge, item.status === 'warn' && s.badgeUrg, item.status === 'orange' && s.badgeAtn, item.status === 'ok' && s.badgeInfo]}>
              <Text style={[s.badgeTxt, item.status === 'warn' && s.badgeTxtUrg, item.status === 'orange' && s.badgeTxtAtn, item.status === 'ok' && s.badgeTxtInfo]}>
                {item.status === 'warn' ? 'Urgente' : item.status === 'orange' ? 'Atención' : 'Info'}
              </Text>
            </View>
            <Text style={[s.miniLbl, { flex: 1, color: '#1a1a1a', lineHeight: 14 }]}>{item.label}</Text>
          </View>
          {i < (data.items?.length || 0) - 1 && <View style={s.miniDivider} />}
        </React.Fragment>
      ))}
    </View>
  </View>
);

// --- PANTALLA PRINCIPAL ---

export default function SmartCowChatScreen() {
  const navigation = useNavigation<any>();
  const scrollRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      time: '07:00',
      text: 'Buenos días JP. 3 cosas que necesitan tu atención:',
      artifact: {
        type: 'alerts',
        title: '🚨 Alertas del día — 14 abr',
        items: [
          { label: 'Bebedero Corral 3 vacío 13 hrs. 38 animales.', value: '', status: 'warn' },
          { label: 'Stock concentrado: 3 días restantes.', value: '', status: 'orange' },
          { label: 'MUE-00847: negativo Brucelosis. OK.', value: '', status: 'ok' },
        ],
      },
    },
    {
      id: '2',
      role: 'user',
      time: '08:14',
      text: '¿Cómo van los lotes esta semana?',
    },
    {
      id: '3',
      role: 'ai',
      time: '08:14',
      text: 'Resumen de tus 4 lotes. Lote Central preocupa — GDP cayó esta semana.',
      artifact: {
        type: 'gdp',
        title: '📊 GDP por lote — semana actual',
        items: [
          { label: 'Lote Norte', value: '1.8 kg/d ↑', status: 'ok' },
          { label: 'Lote Sur', value: '1.5 kg/d →', status: 'ok' },
          { label: 'Lote Central', value: '0.8 kg/d ↓', status: 'warn' },
          { label: 'Wagyu', value: '1.2 kg/d →', status: 'orange' },
        ],
      },
    },
  ]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const newMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    
    // Simular respuesta
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: 'Analizando los datos del predio para responderte...',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, response]);
    }, 1000);
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
          <Text style={s.dateSep}>Hoy · 14 abr 2026</Text>
          
          {messages.map((m) => (
            <View key={m.id}>
              <View style={[s.row, m.role === 'user' ? s.rowUser : s.rowAi]}>
                {m.role === 'ai' && (
                  <View style={s.miniAv}><Text style={s.miniAvTxt}>SC</Text></View>
                )}
                <View style={[s.bubble, m.role === 'user' ? s.bubbleUser : s.bubbleAi]}>
                  <Text style={[s.txt, m.role === 'user' ? s.txtUser : s.txtAi]}>{m.text}</Text>
                  <Text style={[s.time, m.role === 'user' ? s.timeUser : s.timeAi]}>{m.time}</Text>
                </View>
              </View>
              
              {m.artifact && (
                <View style={s.artRow}>
                  {m.artifact.type === 'gdp' && <ArtifactGDP data={m.artifact} />}
                  {m.artifact.type === 'financial' && <ArtifactFinancial data={m.artifact} />}
                  {m.artifact.type === 'alerts' && <ArtifactAlerts data={m.artifact} />}
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
              placeholder="Escribe a SmartCow..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity style={s.sendBtn} onPress={handleSend}>
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
  // Header
  hdr: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 10, borderBottomWidth: 0.5, borderColor: '#ebe9e3',
  },
  back: { marginRight: 12 },
  hdrContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#1e3a2f',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  avatarTxt: { fontFamily: F.bold, fontSize: 11, color: '#7ecfa0' },
  hdrName: { fontFamily: F.bold, fontSize: 13, color: '#1a1a1a' },
  hdrSub: { fontFamily: F.medium, fontSize: 9, color: '#1e3a2f' },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1e3a2f' },
  
  // Messages
  msgsArea: { flex: 1 },
  msgsScroll: { padding: 12, paddingBottom: 24 },
  dateSep: { textAlign: 'center', fontFamily: F.bold, fontSize: 9, color: '#bbb', marginVertical: 12 },
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

  // Artifacts
  artRow: { marginLeft: 28, marginBottom: 12 },
  artContainer: { 
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', 
    borderWidth: 0.5, borderColor: '#e8e5df', maxWidth: '90%' 
  },
  artHdr: { backgroundColor: '#1e3a2f', paddingVertical: 8, paddingHorizontal: 12 },
  artTitle: { fontFamily: F.bold, fontSize: 10, color: '#fff' },
  artBody: { padding: 12 },
  miniRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  miniLbl: { fontFamily: F.regular, fontSize: 10, color: '#888' },
  miniVal: { fontFamily: F.bold, fontSize: 10, color: '#1a1a1a' },
  miniDivider: { height: 0.5, backgroundColor: '#f0ede8', marginVertical: 6 },
  valOk: { color: '#1e3a2f' },
  valWarn: { color: '#e74c3c' },
  valOrange: { color: '#f39c12' },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  kpi: { flex: 1, alignItems: 'center' },
  kpiVal: { fontFamily: F.bold, fontSize: 15, color: '#1a1a1a' },
  kpiLbl: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginTop: 1 },
  // Badges Alertas
  badge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 10 },
  badgeUrg: { backgroundColor: '#fde8e8' },
  badgeAtn: { backgroundColor: '#fdf0e6' },
  badgeInfo: { backgroundColor: '#e6f0f8' },
  badgeTxt: { fontFamily: F.bold, fontSize: 8 },
  badgeTxtUrg: { color: '#c0392b' },
  badgeTxtAtn: { color: '#9b5e1a' },
  badgeTxtInfo: { color: '#1a5276' },

  // Input Bar
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
});
