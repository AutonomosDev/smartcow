import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, SquarePen, Menu, Paperclip, Mic, ArrowRight, Database } from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import { api, PredioKpis } from '../lib/api';

// ── Tokens exactos del spec ────────────────────────────────────────────────────
const C = {
  bg:     '#f8f6f1',
  card:   '#ffffff',
  fog:    '#f0ede8',
  cream:  '#ebe9e3',
  ink1:   '#1a1a1a',
  ink2:   '#888',
  ink3:   '#bbb',
  ink4:   '#f0ede8',
  blue:   '#eaf0f7',
  blueFg: '#1a5276',
  green:  '#1e3a2f',
  leaf:   '#7ecfa0',
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
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [kpis, setKpis] = useState<PredioKpis | null>(null);
  const [inputText, setInputText] = useState('');

  const firstName = (user?.nombre ?? 'JP').split(' ')[0];

  useEffect(() => {
    api.get<PredioKpis>(`/api/predio/${predioId}/kpis`)
      .then(setKpis)
      .catch(() => {});
  }, [predioId]);

  const goToChat = (text?: string) => {
    navigation.navigate('SmartCowChat', text ? { initialText: text } : undefined);
  };

  const handleSend = () => {
    const t = inputText.trim();
    goToChat(t || undefined);
    setInputText('');
  };

  const handleChip = (chip: string) => {
    goToChat(chip + ' ');
  };

  const totalAnimales = kpis?.totalAnimales ?? 242;

  return (
    <View style={s.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe} edges={['top']}>

        {/* ── Header ── */}
        <View style={[s.hdr, { paddingTop: insets.top + 4 }]}>
          <Image
            source={require('../../../../public/cow_robot.png')}
            style={s.avatar}
          />
          <View style={s.hdrText}>
            <Text style={s.hdrName}>SmartCow AI</Text>
            <Text style={s.hdrMeta}>Fundo San Pedro · en línea</Text>
          </View>
          <TouchableOpacity style={s.icBtn} activeOpacity={0.7}>
            <Search size={16} color={C.ink2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.icBtn, s.icBtnNew]}
            activeOpacity={0.7}
            onPress={() => goToChat()}
          >
            <SquarePen size={16} color={C.green} />
          </TouchableOpacity>
          <TouchableOpacity style={s.icBtn} activeOpacity={0.7}>
            <Menu size={16} color={C.ink2} />
          </TouchableOpacity>
        </View>

        {/* ── Messages ── */}
        <ScrollView
          ref={scrollRef}
          style={s.body}
          contentContainerStyle={s.bodyPad}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={s.dateSep}>Hoy · Resumen matutino</Text>

          {/* AI greeting */}
          <View style={s.aBlock}>
            <Text style={s.aProse}>
              Buenos días {firstName}. Aquí el resumen del fundo:
            </Text>

            {/* KPI artifact */}
            <View style={s.artifact}>
              <View style={s.artHdr}>
                <Text style={s.artTitle}>📊 Indicadores — Fundo San Pedro</Text>
              </View>
              <View style={s.artBody}>
                <View style={s.artRow}>
                  <Text style={s.artLbl}>Animales activos</Text>
                  <Text style={[s.artVal, { color: C.green }]}>{totalAnimales}</Text>
                </View>
                <View style={s.artDivider} />
                <View style={s.artRow}>
                  <Text style={s.artLbl}>Dólar</Text>
                  <Text style={s.artVal}>$938 <Text style={s.artSub}>+$4 vs ayer</Text></Text>
                </View>
                <View style={s.artDivider} />
                <View style={s.artRow}>
                  <Text style={s.artLbl}>UF</Text>
                  <Text style={s.artVal}>$38.420</Text>
                </View>
                <View style={s.artDivider} />
                <View style={s.artRow}>
                  <Text style={s.artLbl}>Clima · Los Lagos</Text>
                  <Text style={s.artVal}>🌧 6°C · lluvia leve</Text>
                </View>
              </View>
            </View>

            {/* Alert artifact */}
            <View style={[s.artifact, s.alertArt]}>
              <View style={[s.artHdr, s.alertHdr]}>
                <Text style={[s.artTitle, { color: '#c0392b' }]}>🚨 Alerta urgente</Text>
              </View>
              <View style={s.artBody}>
                <View style={s.alertRow}>
                  <View style={s.alertDot} />
                  <Text style={s.alertTxt}>
                    Bebedero Corral 3 vacío · 38 animales sin agua 13 hrs
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[s.aProse, { marginTop: 6 }]}>
              ¿Qué quieres revisar primero?
            </Text>
          </View>
        </ScrollView>

        {/* ── Composer ── */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={insets.top}
        >
          <View style={[s.comp, { paddingBottom: Math.max(insets.bottom + 6, 44) }]}>

            {/* Data-source pill */}
            <View style={s.dsPill}>
              <Database size={12} color={C.ink2} />
              <Text style={s.dsPillTxt}>
                <Text style={s.dsPillBold}>Fundo San Pedro</Text>
              </Text>
              <Text style={s.dsPillArr}>→</Text>
              <Text style={s.dsPillSrc}>AgroApp</Text>
            </View>

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
                  onPress={() => handleChip(chip)}
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
                placeholder="Escribe a SmartCow..."
                placeholderTextColor={C.ink3}
                value={inputText}
                onChangeText={setInputText}
                onFocus={() => { if (!inputText) goToChat(); }}
                multiline
                returnKeyType="default"
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
        </KeyboardAvoidingView>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },

  // Header
  hdr: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingBottom: 10,
    backgroundColor: C.card,
    borderBottomWidth: 0.5, borderBottomColor: C.fog,
  },
  avatar:   { width: 36, height: 36, borderRadius: 8, resizeMode: 'contain' },
  hdrText:  { flex: 1 },
  hdrName:  { fontFamily: F.bold, fontSize: 14, color: C.ink1, lineHeight: 17 },
  hdrMeta:  { fontFamily: F.mono, fontSize: 10.5, color: C.ink2, marginTop: 2 },
  icBtn:    { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  icBtnNew: { backgroundColor: C.note, borderWidth: 0.5, borderColor: C.noteBd },

  // Body
  body:    { flex: 1, backgroundColor: C.bg },
  bodyPad: { padding: 16, gap: 14, paddingBottom: 24 },

  dateSep: {
    fontFamily: F.mono, fontSize: 10, color: C.ink2,
    textAlign: 'center', marginBottom: 4,
  },

  // AI block
  aBlock: { gap: 8 },
  aProse: {
    fontFamily: F.regular, fontSize: 12.5, lineHeight: 20,
    color: C.blueFg, maxWidth: '88%',
  },

  // Artifact card
  artifact: {
    backgroundColor: C.card,
    borderRadius: 8, borderWidth: 0.5, borderColor: C.fog,
    overflow: 'hidden', maxWidth: '92%',
  },
  artHdr: {
    backgroundColor: C.green,
    paddingVertical: 7, paddingHorizontal: 10,
  },
  artTitle: { fontFamily: F.bold, fontSize: 10, color: '#fff' },
  artBody:  { padding: 10, gap: 0 },
  artRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 6,
  },
  artLbl: { fontFamily: F.regular, fontSize: 11, color: C.ink2 },
  artVal: { fontFamily: F.bold, fontSize: 11, color: C.ink1 },
  artSub: { fontFamily: F.regular, fontSize: 10, color: C.ink2 },
  artDivider: { height: 0.5, backgroundColor: C.fog },

  // Alert artifact variant
  alertArt: {},
  alertHdr: { backgroundColor: '#fde8e8' },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  alertDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#e74c3c' },
  alertTxt: { fontFamily: F.medium, fontSize: 11.5, color: '#c0392b', flex: 1, lineHeight: 16 },

  // Composer
  comp: {
    backgroundColor: C.card,
    borderTopWidth: 0.5, borderTopColor: C.fog,
    paddingTop: 10, paddingHorizontal: 12, gap: 7,
  },
  dsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 7, paddingHorizontal: 10,
    backgroundColor: C.card,
    borderWidth: 0.5, borderColor: '#e0ddd8', borderRadius: 8,
  },
  dsPillTxt:  { fontFamily: F.mono, fontSize: 11, color: C.ink1 },
  dsPillBold: { fontFamily: F.monoMd, fontWeight: '500' },
  dsPillArr:  { fontFamily: F.mono, fontSize: 11, color: C.ink3, marginHorizontal: 2 },
  dsPillSrc:  { fontFamily: F.mono, fontSize: 11, color: C.ink2 },

  chipScroll: {},
  chipRow:    { gap: 6, flexDirection: 'row' },
  chip: {
    backgroundColor: C.blue, borderRadius: 8,
    paddingVertical: 4, paddingHorizontal: 9,
  },
  chipTxt: { fontFamily: F.monoMd, fontSize: 10.5, color: C.blueFg },

  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.card,
    borderWidth: 0.5, borderColor: '#e0ddd8', borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 8,
    minHeight: 44,
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
});
