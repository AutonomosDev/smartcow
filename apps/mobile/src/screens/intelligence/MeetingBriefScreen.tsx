import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { r: 'DMSans_400Regular', m: 'DMSans_500Medium', b: 'DMSans_600SemiBold' };

// Participantes
const AVATARS = [
  { initials: 'JP', color: '#1e3a2f' },
  { initials: 'R',  color: '#7b3f00' },
  { initials: 'V',  color: '#1a5c3a' },
];

export default function MeetingBriefScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} color="#444" />
          </TouchableOpacity>
          <Text style={s.hdrBrief}>BRIEF LISTO</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>Reunión</Text>
          <Text style={s.subtitle}>Lunes 14 abril · Preparado por JPd</Text>

          {/* Hero reunión */}
          <View style={s.hero}>
            <Text style={s.heroLabel}>REUNIÓN HOY</Text>
            <Text style={s.heroTitle}>Lote Norte — Revisión mensual</Text>
            <Text style={s.heroSub}>10:00 AM · Sala principal · 3 participantes</Text>
            <View style={s.avatarRow}>
              {AVATARS.map((a) => (
                <View key={a.initials} style={[s.avatar, { backgroundColor: a.color }]}>
                  <Text style={s.avatarText}>{a.initials}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Lote Norte — datos */}
          <View style={s.card}>
            <View style={s.cardTopRow}>
              <Text style={s.cardTitle}>Lote Norte</Text>
              <View style={s.badgeWarn}>
                <Text style={s.badgeWarnText}>⚠ Atención</Text>
              </View>
            </View>
            <View style={s.divider} />
            {[
              { l: 'Animales',    v: '110 Angus',   c: '#1a1a1a' },
              { l: 'GD semana',   v: '1.4 kg ↓',    c: '#e74c3c' },
              { l: 'Objetivo',    v: '1.8 kg/día',   c: '#888' },
              { l: 'Déficit energía', v: '-17%',    c: '#e74c3c' },
              { l: 'Días a faena', v: '73 vs 55',   c: '#e74c3c' },
            ].map((row) => (
              <View key={row.l} style={s.dataRow}>
                <Text style={s.dataLabel}>{row.l}</Text>
                <Text style={[s.dataVal, { color: row.c }]}>{row.v}</Text>
              </View>
            ))}
          </View>

          {/* Sanidad */}
          <View style={s.card}>
            <View style={s.cardTopRow}>
              <Text style={s.cardTitle}>Sanidad</Text>
              <View style={s.badgeOk}>
                <Text style={s.badgeOkText}>OK</Text>
              </View>
            </View>
            <View style={s.divider} />
            {[
              { l: 'Tratamientos', v: '2 activos', c: '#e74c3c' },
              { l: 'Mortalidad mes', v: '0%',      c: '#1a1a1a' },
              { l: 'Vacunas',       v: 'Al día ✓', c: '#1e3a2f' },
            ].map((row) => (
              <View key={row.l} style={s.dataRow}>
                <Text style={s.dataLabel}>{row.l}</Text>
                <Text style={[s.dataVal, { color: row.c }]}>{row.v}</Text>
              </View>
            ))}
          </View>

          {/* Preguntas para la reunión */}
          <TouchableOpacity style={s.pregBtn}>
            <Text style={s.pregText}>Preguntas para la reunión</Text>
            <ChevronRight size={14} color="#9b5e1a" />
          </TouchableOpacity>

          {/* CTA iniciar */}
          <TouchableOpacity
            style={s.cta}
            onPress={() => navigation.navigate('ActiveMeeting', { meetingId: 'M-001' })}
          >
            <Text style={s.ctaText}>Iniciar reunión</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f1' },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#ebe9e3', justifyContent: 'center', alignItems: 'center' },
  hdrBrief: { fontFamily: F.b, fontSize: 11, color: '#1e3a2f', letterSpacing: 0.5 },
  title:    { fontFamily: F.b, fontSize: 24, color: '#1a1a1a', marginTop: 4, marginBottom: 2 },
  subtitle: { fontFamily: F.r, fontSize: 11, color: '#888', marginBottom: 12 },
  hero: { backgroundColor: '#1e3a2f', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 14, marginBottom: 10 },
  heroLabel: { fontFamily: F.b, fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 4 },
  heroTitle: { fontFamily: F.b, fontSize: 18, color: '#fff', marginBottom: 4 },
  heroSub:   { fontFamily: F.r, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  avatarRow: { flexDirection: 'row', gap: 6 },
  avatar:    { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { fontFamily: F.b, fontSize: 11, color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontFamily: F.b, fontSize: 13, color: '#1a1a1a' },
  divider:   { height: 0.5, backgroundColor: '#f0ede8', marginBottom: 8 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#f0ede8' },
  dataLabel: { fontFamily: F.r, fontSize: 12, color: '#888' },
  dataVal:   { fontFamily: F.b, fontSize: 12 },
  badgeWarn: { backgroundColor: '#fdf0e6', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 20 },
  badgeWarnText: { fontFamily: F.b, fontSize: 10, color: '#9b5e1a' },
  badgeOk:   { backgroundColor: '#e6f3ec', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 20 },
  badgeOkText: { fontFamily: F.b, fontSize: 10, color: '#1e3a2f' },
  pregBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fdf8e6', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  pregText: { fontFamily: F.m, fontSize: 12, color: '#9b5e1a' },
  cta: { backgroundColor: '#1e3a2f', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  ctaText: { fontFamily: F.m, fontSize: 13, color: '#fff' },
});
