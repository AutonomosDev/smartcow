import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';

const F = { r: 'DMSans_400Regular', m: 'DMSans_500Medium', b: 'DMSans_600SemiBold' };

const AVATARS = [
  { initials: 'JP', label: 'JP',       color: '#1e3a2f' },
  { initials: 'R',  label: 'Rodrigo',  color: '#9b5e1a' },
  { initials: 'V',  label: 'Dr. Muñoz', color: '#1e3a2f' },
];

// Waveform mock bars
const BARS = [4, 8, 16, 24, 32, 18, 10, 6, 20, 28, 36, 20, 12, 8, 22, 30, 38, 22, 14, 10, 18, 26];

export default function ActiveMeetingScreen() {
  const navigation = useNavigation<any>();
  const [seconds, setSeconds] = useState(1394); // 23:14

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        <View style={s.header}>
          {/* No back button during active recording */}
          <View style={{ width: 26 }} />
          <View style={{ width: 26 }} />
        </View>

        <View style={s.content}>

          {/* Timer */}
          <Text style={s.timer}>{mm}:{ss}</Text>

          {/* Grabando indicator */}
          <View style={s.recRow}>
            <View style={s.recDot} />
            <Text style={s.recText}>Grabando reunión</Text>
          </View>

          {/* Waveform */}
          <View style={s.waveform}>
            {BARS.map((h, i) => (
              <View
                key={i}
                style={[s.waveBar, {
                  height: h,
                  opacity: i < Math.floor(seconds % BARS.length) + 1 ? 1 : 0.3,
                }]}
              />
            ))}
          </View>

          {/* Info card — "La IA no existe durante esta reunión" */}
          <View style={s.infoCard}>
            <Text style={s.infoTitle}>La IA no existe durante esta reunión</Text>
            <Text style={s.infoBody}>
              Solo grabación. Los humanos piensan y deciden solos. JPd procesará los acuerdos en 30 minutos al terminar.
            </Text>
          </View>

          {/* Stop button */}
          <TouchableOpacity
            style={s.stopBtn}
            onPress={() => navigation.goBack()}
          >
            <View style={s.stopIcon} />
          </TouchableOpacity>
          <Text style={s.stopLabel}>Terminar reunión</Text>

          {/* Avatares participantes */}
          <View style={s.participantRow}>
            {AVATARS.map((a) => (
              <View key={a.initials} style={s.participantCol}>
                <View style={[s.avatar, { backgroundColor: a.color }]}>
                  <Text style={s.avatarText}>{a.initials}</Text>
                </View>
                <Text style={s.avatarLabel}>{a.label}</Text>
              </View>
            ))}
          </View>

          <Text style={s.disclaimer}>Audio eliminado automáticamente post procesamiento</Text>
        </View>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f1' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 30 },
  timer: { fontFamily: F.b, fontSize: 64, color: '#1a1a1a', lineHeight: 70 },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 24 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e74c3c' },
  recText: { fontFamily: F.m, fontSize: 13, color: '#888' },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 48, marginBottom: 24 },
  waveBar: { width: 3, backgroundColor: '#1e3a2f', borderRadius: 2 },
  infoCard: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14, marginBottom: 32, width: '100%' },
  infoTitle: { fontFamily: F.b, fontSize: 13, color: '#1a1a1a', marginBottom: 6 },
  infoBody:  { fontFamily: F.r, fontSize: 11, color: '#888', lineHeight: 16 },
  stopBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#1e3a2f',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  stopIcon: { width: 20, height: 20, borderRadius: 4, backgroundColor: '#fff' },
  stopLabel: { fontFamily: F.r, fontSize: 12, color: '#888', marginBottom: 32 },
  participantRow: { flexDirection: 'row', gap: 24, marginBottom: 12 },
  participantCol: { alignItems: 'center', gap: 4 },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: F.b, fontSize: 13, color: '#fff' },
  avatarLabel: { fontFamily: F.r, fontSize: 10, color: '#888' },
  disclaimer: { fontFamily: F.r, fontSize: 9, color: '#bbb', textAlign: 'center' },
});
