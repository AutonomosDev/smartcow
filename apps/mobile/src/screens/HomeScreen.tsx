import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Image, PanResponder,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowRight } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { api, PredioKpis } from '../lib/api';

const F = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_600SemiBold' };
const BORDER = 'rgba(255,255,255,0.38)';
const TXT    = 'rgba(0,0,0,0.82)';
const TXT2   = 'rgba(0,0,0,0.5)';

type NavProp = NativeStackNavigationProp<any>;

export default function HomeScreen() {
  const { user, predioId } = useAuth();
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [kpis, setKpis] = useState<PredioKpis | null>(null);

  useEffect(() => {
    api.get<PredioKpis>(`/api/predio/${predioId}/kpis`).then(setKpis).catch(() => {});
  }, [predioId]);


  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 18 && Math.abs(gs.dy) < 40,
      onPanResponderRelease: (_, gs) => { if (gs.dx < -50) navigation.navigate('SmartCowChat'); },
    })
  ).current;

  const goToChat = (text?: string) =>
    navigation.navigate('SmartCowChat', text ? { initialText: text } : undefined);

  const handleSend = () => { goToChat(inputText.trim() || undefined); setInputText(''); };

  // Unified widget — holds weather, KPIs and input in one box
  const widgetBottom = insets.bottom + 24;

  const today = new Date().toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <View style={s.root} {...panResponder.panHandlers}>
      <StatusBar style="dark" />

      <Image
        source={require('../../../../public/cow_robot.png')}
        style={[s.cow, { bottom: widgetBottom + 210 }]}
        resizeMode="contain"
      />

      {/* ── Widget unificado — weather + KPIs + input ── */}
      <View style={[s.widgetWrap, { bottom: widgetBottom }]}>
        <BlurView intensity={52} tint="default" style={s.widget}>

          {/* Row 1: fecha izq · temp + emoji der */}
          <View style={s.wTop}>
            <Text style={s.wDate}>{today}</Text>
            <View style={s.wTempGroup}>
              <Text style={s.wTemp}>6°C</Text>
              <Text style={s.wEmoji}>🌧️</Text>
            </View>
          </View>

          {/* Row 2: 3 KPI cards */}
          <View style={s.wRow}>
            {[
              { lbl: 'Animales', val: String(kpis?.totalAnimales ?? 242) },
              { lbl: 'Dólar',    val: '$938' },
              { lbl: 'UF',       val: '$38.420' },
            ].map(({ lbl, val }) => (
              <View key={lbl} style={s.wCardWrap}>
                <BlurView intensity={28} tint="default" style={s.wCard}>
                  <Text style={s.wCardLbl}>{lbl}</Text>
                  <Text style={s.wCardVal}>{val}</Text>
                </BlurView>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={s.wDiv} />

          {/* Row 3: input */}
          <View style={s.wInputRow}>
            <TextInput
              style={s.input}
              placeholder="Escribe a smartCow..."
              placeholderTextColor="rgba(0,0,0,0.32)"
              value={inputText}
              onChangeText={setInputText}
              onFocus={() => { if (!inputText) goToChat(); }}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity onPress={handleSend} activeOpacity={0.7} style={s.sendBtn}>
              <ArrowRight size={18} color={TXT2} />
            </TouchableOpacity>
          </View>

        </BlurView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  cow:  { position: 'absolute', top: 0, left: 0, right: 0, width: '100%' },

  // Widget wrapper — border vive aquí porque BlurView necesita overflow:hidden
  widgetWrap: {
    position: 'absolute', left: 16, right: 16,
    borderRadius: 18,
    borderWidth: 0.8,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  widget: { padding: 12, gap: 8 },

  wTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  wDate: { fontFamily: F.medium, fontSize: 12, color: TXT2, textTransform: 'capitalize', letterSpacing: 0.2 },
  wTempGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wTemp:  { fontFamily: F.bold, fontSize: 17, color: TXT, letterSpacing: -0.3 },
  wEmoji: { fontSize: 19 },

  wRow: { flexDirection: 'row', gap: 6 },
  wCardWrap: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 0.8,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  wCard: { paddingVertical: 9, paddingHorizontal: 10, alignItems: 'flex-end' },
  wCardLbl: { fontFamily: F.medium, fontSize: 10, color: TXT2, marginBottom: 2 },
  wCardVal: { fontFamily: F.bold, fontSize: 18, color: '#1a1a1a', letterSpacing: -0.5 },

  // Divider between KPIs and input
  wDiv: { height: 0.6, backgroundColor: 'rgba(0,0,0,0.08)', marginHorizontal: 2 },

  // Input row inside unified widget
  wInputRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 4, paddingVertical: 2, gap: 8,
  },
  sendBtn: { padding: 6 },
  input: {
    flex: 1, color: TXT,
    fontSize: 15, fontFamily: F.regular, paddingVertical: 6,
  },
});
