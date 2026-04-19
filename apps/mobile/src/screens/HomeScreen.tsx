import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ImageBackground, TouchableOpacity,
  PanResponder, TextInput, ScrollView, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, Paperclip, Mic } from 'lucide-react-native';

import { Hero } from '../components/Hero';
import { useAuth } from '../context/AuthContext';
import { api, PredioKpis } from '../lib/api';

// ── Design tokens (same as ChatBaseScreen) ────────────────────────────────────
const C = {
  bg:     '#fff',
  fog:    '#f0ede8',
  cream:  '#ebe9e3',
  ink1:   '#1a1a1a',
  ink2:   '#666',
  ink3:   '#999',
  ink4:   '#bbb',
  blue:   '#eaf0f7',
  blueFg: '#1a5276',
  green:  '#1e3a2f',
  note:   '#fafaf7',
  noteBd: '#e8e5dd',
};

const F = {
  regular: 'DMSans_400Regular',
  medium:  'DMSans_500Medium',
  bold:    'DMSans_600SemiBold',
  mono:    'JetBrainsMono_400Regular',
  monoMd:  'JetBrainsMono_500Medium',
};

const CHIPS = ['/feedlot', '/FT', '/vaquillas', '/partos', '/tratamientos', '/ventas'];

type NavProp = NativeStackNavigationProp<any>;

export default function HomeScreen() {
  const { predioId, user } = useAuth();
  const navigation = useNavigation<NavProp>();
  const [kpis, setKpis] = useState<PredioKpis | null>(null);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    api.get<PredioKpis>(`/api/predio/${predioId}/kpis`)
      .then(setKpis)
      .catch(() => {});
  }, [predioId]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 20,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -50) navigation.navigate('SmartCowChat');
      },
    })
  ).current;

  const goToChat = (chip?: string) => {
    navigation.navigate('SmartCowChat', chip ? { initialText: chip + ' ' } : undefined);
  };

  const handleSend = () => {
    if (!inputText.trim()) { goToChat(); return; }
    navigation.navigate('SmartCowChat', { initialText: inputText.trim() });
    setInputText('');
  };

  const weatherStrip = [
    { day: 'Hoy', icon: '🌧', temp: '6°', isToday: true },
    { day: 'Sáb', icon: '🌦', temp: '8°' },
    { day: 'Dom', icon: '⛅', temp: '11°' },
    { day: 'Lun', icon: '☀️', temp: '13°' },
    { day: 'Mar', icon: '☀️', temp: '14°' },
    { day: 'Mié', icon: '🌦', temp: '9°' },
  ];

  return (
    <View style={s.container} {...panResponder.panHandlers}>
      <StatusBar style="light" />
      <ImageBackground
        source={require('../../../../public/1.jpg')}
        style={s.bg}
        imageStyle={{ objectFit: 'cover' }}
      >
        <LinearGradient
          colors={['rgba(5,18,10,0.72)', 'transparent']}
          style={s.ovTop}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(5,18,10,0.82)', 'rgba(5,18,10,0.96)']}
          locations={[0, 0.45, 1]}
          style={s.ovBot}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        />

        <SafeAreaView style={s.content} edges={['top', 'bottom']}>
          <Hero userName={user?.nombre} />

          <View style={s.spacer} />

          <View style={s.bottom}>

            {/* Weather Card */}
            <View style={[s.card, s.blurCard]}>
              <View style={s.wTop}>
                <View>
                  <Text style={s.temp}>6<Text style={s.tempSup}>°C</Text></Text>
                  <Text style={s.wDesc}>Lluvia leve · Fundo San Pedro</Text>
                </View>
                <View style={s.wRight}>
                  <Text style={s.wPredio}>Los Lagos</Text>
                  <Text style={s.wStatus}>Drone no vuela hoy</Text>
                </View>
              </View>
              <View style={s.wStrip}>
                {weatherStrip.map((w, idx) => (
                  <View key={idx} style={s.wday}>
                    <Text style={s.wdN}>{w.day}</Text>
                    <Text style={s.wdI}>{w.icon}</Text>
                    <Text style={[s.wdT, w.isToday && s.wdTHoy]}>{w.temp}</Text>
                    {w.isToday && <View style={s.wdDot} />}
                  </View>
                ))}
              </View>
            </View>

            {/* Data Row */}
            <View style={s.dataRow}>
              <View style={[s.dc, s.blurCard]}>
                <Text style={s.dcL}>DÓLAR</Text>
                <Text style={s.dcV}>$938</Text>
                <Text style={s.dcS}>+$4 vs ayer</Text>
              </View>
              <View style={[s.dc, s.blurCard]}>
                <Text style={s.dcL}>UF</Text>
                <Text style={s.dcV}>$38.420</Text>
                <Text style={s.dcS}>Actualizada</Text>
              </View>
              <View style={[s.dc, s.blurCard]}>
                <Text style={s.dcL}>ANIMALES</Text>
                <Text style={[s.dcV, s.ok]}>{kpis?.totalAnimales || 242}</Text>
                <Text style={s.dcS}>Activos</Text>
              </View>
            </View>

            {/* Alert */}
            <View style={s.alert}>
              <View style={s.aDot} />
              <Text style={s.aTxt}>Bebedero Corral 3 vacío · 38 animales sin agua 13 hrs</Text>
              <Text style={s.aArr}>›</Text>
            </View>

            {/* ── Chat Card ── */}
            <View style={s.chatCard}>

              {/* Header */}
              <View style={s.chatHdr}>
                <Image
                  source={require('../../../../public/cow_robot.png')}
                  style={s.chatAvatar}
                />
                <View style={s.chatHdrText}>
                  <Text style={s.chatName}>SmartCow AI</Text>
                  <Text style={s.chatMeta}>Fundo San Pedro · 3 alertas</Text>
                </View>
                <View style={s.onlineDot} />
              </View>

              {/* Divider */}
              <View style={s.chatDivider} />

              {/* Slash chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.chipScroll}
                contentContainerStyle={s.chipRow}
              >
                {CHIPS.map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    style={s.chip}
                    onPress={() => goToChat(chip)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.chipTxt}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Input row */}
              <View style={s.inputRow}>
                <TouchableOpacity style={s.inputIc} activeOpacity={0.7}>
                  <Paperclip size={14} color={C.ink1} />
                </TouchableOpacity>
                <TextInput
                  style={s.inputTxt}
                  placeholder="Escribe a SmartCow..."
                  placeholderTextColor={C.ink4}
                  value={inputText}
                  onChangeText={setInputText}
                  onFocus={() => { if (!inputText) goToChat(); }}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                />
                <TouchableOpacity style={s.inputIc} activeOpacity={0.7}>
                  <Mic size={14} color={C.ink1} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.inputIc, s.sendBtn]}
                  onPress={handleSend}
                  activeOpacity={0.85}
                >
                  <ArrowRight size={14} color="#fff" />
                </TouchableOpacity>
              </View>

            </View>

            {/* Dots */}
            <View style={s.dots}>
              <View style={[s.dot, s.dotOn]} />
              <View style={s.dot} />
            </View>

          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bg:        { flex: 1, width: '100%', height: '100%' },
  ovTop:     { position: 'absolute', top: 0, left: 0, right: 0, height: 180 },
  ovBot:     { position: 'absolute', bottom: 0, left: 0, right: 0, height: 460 },
  content:   { flex: 1, flexDirection: 'column' },
  spacer:    { flex: 1 },
  bottom:    { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },

  // Dark glassmorphism cards (weather / kpis / alert)
  card:     { paddingVertical: 20, paddingHorizontal: 18 },
  blurCard: {
    backgroundColor: 'rgba(5,22,12,0.65)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 24,
  },

  wTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  temp:   { fontSize: 44, fontFamily: F.bold, color: '#fff', letterSpacing: -1 },
  tempSup:{ fontSize: 16, fontFamily: F.regular, color: 'rgba(255,255,255,0.5)' },
  wDesc:  { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: F.regular, marginTop: 4 },
  wRight: { alignItems: 'flex-end' },
  wPredio:{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: F.regular, marginBottom: 4 },
  wStatus:{ fontSize: 12, fontFamily: F.medium, color: '#7ecfa0' },

  wStrip: { flexDirection: 'row', gap: 5, justifyContent: 'space-between', marginTop: 8 },
  wday:   { flex: 1, alignItems: 'center', gap: 4 },
  wdN:    { fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: F.medium },
  wdI:    { fontSize: 16, lineHeight: 20 },
  wdT:    { fontSize: 12, fontFamily: F.bold, color: 'rgba(255,255,255,0.7)' },
  wdTHoy: { color: '#fff', fontSize: 13 },
  wdDot:  { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#7ecfa0', marginTop: 2 },

  dataRow: { flexDirection: 'row', gap: 10 },
  dc: {
    flex: 1, paddingVertical: 14, paddingHorizontal: 11,
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(5,22,12,0.65)',
  },
  dcL: { fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontFamily: F.medium, letterSpacing: 0.3 },
  dcV: { fontSize: 18, fontFamily: F.bold, color: '#fff', letterSpacing: -0.3 },
  ok:  { color: '#7ecfa0' },
  dcS: { fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontFamily: F.regular },

  alert: {
    backgroundColor: 'rgba(160,30,20,0.45)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,100,80,0.3)',
    paddingVertical: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  aDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff6b6b' },
  aTxt: { fontSize: 13, color: 'rgba(255,255,255,0.88)', lineHeight: 18, flex: 1, fontFamily: F.medium },
  aArr: { fontSize: 16, color: 'rgba(255,255,255,0.3)', fontFamily: F.regular },

  // ── White chat card ───────────────────────────────────────────────────────
  chatCard: {
    backgroundColor: C.bg,
    borderRadius: 20,
    paddingTop: 14,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },

  chatHdr: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingBottom: 10,
  },
  chatAvatar:   { width: 36, height: 36, borderRadius: 8, resizeMode: 'contain' },
  chatHdrText:  { flex: 1 },
  chatName:     { fontFamily: F.bold, fontSize: 13, color: C.ink1 },
  chatMeta:     { fontFamily: F.mono, fontSize: 10, color: C.ink3, marginTop: 2 },
  onlineDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ecc71', marginRight: 4 },

  chatDivider:  { height: 0.5, backgroundColor: C.fog, marginHorizontal: 14 },

  chipScroll:   { marginTop: 10 },
  chipRow:      { paddingHorizontal: 14, gap: 6, flexDirection: 'row' },
  chip: {
    backgroundColor: C.blue, borderRadius: 8,
    paddingVertical: 5, paddingHorizontal: 10,
  },
  chipTxt: { fontFamily: F.monoMd, fontSize: 10.5, color: C.blueFg },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 10, marginTop: 10,
    backgroundColor: C.note,
    borderRadius: 12, borderWidth: 0.5, borderColor: C.noteBd,
    paddingVertical: 6, paddingHorizontal: 8,
  },
  inputIc: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.cream, justifyContent: 'center', alignItems: 'center',
  },
  inputTxt: {
    flex: 1, fontFamily: F.regular, fontSize: 13, color: C.ink1,
    paddingVertical: 2,
  },
  sendBtn: { backgroundColor: C.green },

  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 8 },
  dot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotOn:{ backgroundColor: '#7ecfa0', width: 16, borderRadius: 3 },
});
