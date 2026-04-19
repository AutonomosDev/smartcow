import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Paperclip, Mic, ArrowRight, Database } from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';

const C = {
  bg:     '#ffffff',
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
  const { user } = useAuth();
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');

  const firstName = (user?.nombre ?? 'JP').split(' ')[0];

  const goToChat = (text?: string) => {
    navigation.navigate('SmartCowChat', text ? { initialText: text } : undefined);
  };

  const handleSend = () => {
    const t = inputText.trim();
    goToChat(t || undefined);
    setInputText('');
  };

  return (
    <View style={s.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

        {/* ── Centro — vaca protagonista + chips ── */}
        <View style={s.center}>
          <Image
            source={require('../../../../public/cow_robot.png')}
            style={s.cowImg}
            resizeMode="contain"
          />
          <Text style={s.title}>¿En qué te ayudo, {firstName}?</Text>
          <Text style={s.sub}>Fundo San Pedro · SmartCow AI</Text>

          {/* Chips centrados, wrap */}
          <View style={s.chips}>
            {CHIPS.map((chip) => (
              <TouchableOpacity
                key={chip}
                style={s.chip}
                onPress={() => goToChat(chip + ' ')}
                activeOpacity={0.7}
              >
                <Text style={s.chipTxt}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Cajón inferior ── */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={insets.top}
        >
          <View style={[s.comp, { paddingBottom: Math.max(insets.bottom + 6, 28) }]}>

            {/* Data-source pill */}
            <View style={s.dsPill}>
              <Database size={12} color={C.ink2} />
              <Text style={s.dsPillTxt}><Text style={s.dsPillBold}>Fundo San Pedro</Text></Text>
              <Text style={s.dsPillArr}>→</Text>
              <Text style={s.dsPillSrc}>AgroApp</Text>
            </View>

            {/* Chips en el cajón — scroll horizontal */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipRow}
            >
              {CHIPS.map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={s.chip}
                  onPress={() => goToChat(chip + ' ')}
                  activeOpacity={0.7}
                >
                  <Text style={s.chipTxt}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Input */}
            <View style={s.inputBox}>
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

  // Centro
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 0,
  },
  cowImg: { width: 120, height: 120, marginBottom: 20 },
  title: {
    fontFamily: F.bold, fontSize: 20, color: C.ink1,
    letterSpacing: -0.3, textAlign: 'center', marginBottom: 6,
  },
  sub: {
    fontFamily: F.mono, fontSize: 11, color: C.ink3,
    textAlign: 'center', marginBottom: 24,
  },
  chips: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 8,
  },
  chip: {
    backgroundColor: C.blue, borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 14,
  },
  chipTxt: { fontFamily: F.monoMd, fontSize: 12, color: C.blueFg },

  // Cajón
  comp: {
    backgroundColor: C.bg,
    borderTopWidth: 0.5, borderTopColor: C.fog,
    paddingTop: 10, paddingHorizontal: 12, gap: 7,
  },
  dsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 7, paddingHorizontal: 10,
    borderWidth: 0.5, borderColor: '#e0ddd8', borderRadius: 8,
  },
  dsPillTxt:  { fontFamily: F.mono, fontSize: 11, color: C.ink1 },
  dsPillBold: { fontFamily: F.monoMd },
  dsPillArr:  { fontFamily: F.mono, fontSize: 11, color: C.ink3 },
  dsPillSrc:  { fontFamily: F.mono, fontSize: 11, color: C.ink2 },
  chipRow: { gap: 6, flexDirection: 'row' },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 0.5, borderColor: '#e0ddd8', borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 8, minHeight: 44,
  },
  inputIc: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.cream, justifyContent: 'center', alignItems: 'center',
  },
  inputTxt: { flex: 1, fontFamily: F.regular, fontSize: 13, color: C.ink1, paddingVertical: 2 },
  sendBtn: { backgroundColor: C.green },
});
