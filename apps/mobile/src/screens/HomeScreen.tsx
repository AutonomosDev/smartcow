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

  const initials = (user?.nombre ?? 'JP').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const nombre   = user?.nombre ?? 'Fundo San Pedro';

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 18 && Math.abs(gs.dy) < 40,
      onPanResponderRelease: (_, gs) => { if (gs.dx < -50) navigation.navigate('SmartCowChat'); },
    })
  ).current;

  const goToChat = (text?: string) =>
    navigation.navigate('SmartCowChat', text ? { initialText: text } : undefined);

  const handleSend = () => { goToChat(inputText.trim() || undefined); setInputText(''); };

  // Widget sits above the input bar
  const barBottom  = insets.bottom + 56;
  const barHeight  = 50;
  const widgetBottom = barBottom + barHeight + 10;

  return (
    <View style={s.root} {...panResponder.panHandlers}>
      <StatusBar style="dark" />

      <Image source={require('../../../../public/cow_robot.png')} style={s.cow} resizeMode="contain" />

      {/* ── Widget — entre vaca e input ── */}
      <View style={[s.widgetWrap, { bottom: widgetBottom }]}>
        <BlurView intensity={52} tint="default" style={s.widget}>

          {/* Fila: avatar + nombre  |  temp + emoji (derecha) */}
          <View style={s.wTop}>
            <View style={s.wAvatar}>
              <Text style={s.wAvatarTxt}>{initials}</Text>
            </View>
            <Text style={s.wName} numberOfLines={1}>{nombre}</Text>
            <Text style={s.wTemp}>6°C</Text>
            <Text style={s.wEmoji}>🌧️</Text>
          </View>

          {/* Sub-cards: label izq — valor der */}
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

        </BlurView>
      </View>

      {/* ── Input flotante ── */}
      <View style={[s.barWrap, { bottom: barBottom }]}>
        <BlurView intensity={55} tint="default" style={s.bar}>
          <TextInput
            style={s.input}
            placeholder="Escribe a SmartCow..."
            placeholderTextColor="rgba(0,0,0,0.32)"
            value={inputText}
            onChangeText={setInputText}
            onFocus={() => { if (!inputText) goToChat(); }}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity onPress={handleSend} activeOpacity={0.7} style={{ padding: 6 }}>
            <ArrowRight size={18} color={TXT2} />
          </TouchableOpacity>
        </BlurView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  cow:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },

  // Widget wrapper — border vive aquí porque BlurView necesita overflow:hidden
  widgetWrap: {
    position: 'absolute', left: 16, right: 16,
    borderRadius: 18,
    borderWidth: 0.8,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  widget: { padding: 14, gap: 10 },

  wTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  wAvatarTxt: { fontFamily: F.bold, fontSize: 12, color: TXT },
  wName:  { flex: 1, fontFamily: F.medium, fontSize: 14, color: TXT },
  wTemp:  { fontFamily: F.bold, fontSize: 18, color: TXT, letterSpacing: -0.3 },
  wEmoji: { fontSize: 22 },

  wRow: { flexDirection: 'row', gap: 8 },
  wCardWrap: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 0.8,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  wCard: { paddingVertical: 9, paddingHorizontal: 10 },
  wCardLbl: { fontFamily: F.medium, fontSize: 11, color: TXT2, marginBottom: 4 },
  wCardVal: { fontFamily: F.bold, fontSize: 14, color: TXT, letterSpacing: -0.2, textAlign: 'right' },

  // Input bar
  barWrap: {
    position: 'absolute', left: 20, right: 20,
    borderRadius: 30,
    borderWidth: 0.8,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  bar: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingLeft: 22, paddingRight: 10, gap: 10,
  },
  input: {
    flex: 1, color: TXT,
    fontSize: 15, fontFamily: F.regular, paddingVertical: 2,
  },
});
