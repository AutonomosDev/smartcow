import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const F = { r: 'DMSans_400Regular', m: 'DMSans_500Medium', b: 'DMSans_600SemiBold' };

const HISTORIAL = [
  { dot: '#e74c3c',  label: 'Neumonía — tratamiento activo',      sub: '9 abr · Dr. Muñoz · Día 3 de 7' },
  { dot: '#f39c12',  label: 'Control de peso — bajo objetivo',    sub: '1 abr · 298 kg → 312 kg (+14 kg)' },
  { dot: '#1a1a1a',  label: 'Vacuna IBR/BVD aplicada',            sub: '15 mar · Dr. Muñoz' },
  { dot: '#1a1a1a',  label: 'Ingreso al predio — SIPEC OK',       sub: '1 mar · Agropecuaria Sur' },
];

const VACUNAS = [
  { nombre: 'IBR/BVD',       fecha: '15 mar',   estado: 'ok' as const },
  { nombre: 'Clostridiosis', fecha: '15 mar',   estado: 'ok' as const },
  { nombre: 'Leptospira',    fecha: 'Jun 2026', estado: 'pendiente' as const },
];

export default function HealthFileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { diio } = route.params || { diio: '134.2.980.114.422' };

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} color="#444" />
          </TouchableOpacity>
          <Text style={s.hdrStatus}>EN TRATAMIENTO</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Título */}
          <Text style={s.title}>Ficha sanitaria</Text>
          <Text style={s.subtitle}>VetBrain · Dr. Muñoz</Text>

          {/* DIIO hero card verde */}
          <View style={s.hero}>
            <View style={s.heroTop}>
              <View>
                <Text style={s.heroLabel}>DIIO</Text>
                <Text style={s.heroDIIO}>{diio}</Text>
              </View>
              <View style={s.heroBadge}>
                <Text style={s.heroBadgeText}>Activo</Text>
              </View>
            </View>
            <View style={s.heroGrid}>
              {[
                { label: 'Raza', val: 'Wagyu' },
                { label: 'Sexo', val: 'Macho' },
                { label: 'Edad', val: '14 m' },
                { label: 'Peso', val: '312 kg' },
              ].map((item) => (
                <View key={item.label} style={s.heroItem}>
                  <Text style={s.heroItemLabel}>{item.label}</Text>
                  <Text style={s.heroItemVal}>{item.val}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Historial sanitario */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Historial sanitario</Text>
            <View style={s.divider} />
            {HISTORIAL.map((ev, i) => (
              <View key={i} style={s.histRow}>
                <View style={[s.histDot, { backgroundColor: ev.dot }]} />
                <View style={s.histBody}>
                  <Text style={s.histLabel}>{ev.label}</Text>
                  <Text style={s.histSub}>{ev.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Vacunas */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Vacunas</Text>
            <View style={s.divider} />
            {VACUNAS.map((v, i) => (
              <View key={i} style={[s.vacRow, i < VACUNAS.length - 1 && s.vacRowBorder]}>
                <Text style={s.vacNombre}>{v.nombre}</Text>
                <Text style={s.vacFecha}>{v.fecha}</Text>
                <View style={[s.badge, v.estado === 'ok' ? s.badgeOk : s.badgeNeutral]}>
                  <Text style={[s.badgeText, { color: v.estado === 'ok' ? '#1e3a2f' : '#888' }]}>
                    {v.estado === 'ok' ? 'Al día' : 'Pendiente'}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* CTA — ver tratamiento activo */}
          <TouchableOpacity
            style={s.cta}
            onPress={() => navigation.navigate('ActiveTreatment', { treatmentId: 'T-001' })}
          >
            <Text style={s.ctaText}>Ver tratamiento activo</Text>
            <ChevronRight size={14} color="#fff" />
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
  hdrStatus: { fontFamily: F.b, fontSize: 11, color: '#f39c12', letterSpacing: 0.5 },

  title:    { fontFamily: F.b, fontSize: 24, color: '#1a1a1a', marginTop: 4, marginBottom: 2 },
  subtitle: { fontFamily: F.r, fontSize: 11, color: '#888', marginBottom: 12 },

  // Hero verde DIIO
  hero: { backgroundColor: '#1e3a2f', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  heroLabel: { fontFamily: F.r, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  heroDIIO:  { fontFamily: F.b, fontSize: 16, color: '#fff' },
  heroBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20 },
  heroBadgeText: { fontFamily: F.b, fontSize: 10, color: '#7ecfa0' },
  heroGrid:  { flexDirection: 'row', gap: 5 },
  heroItem:  { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 7, padding: 6 },
  heroItemLabel: { fontFamily: F.r, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 1 },
  heroItemVal:   { fontFamily: F.b, fontSize: 12, color: '#fff' },

  // Cards
  card: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  cardTitle: { fontFamily: F.b, fontSize: 13, color: '#1a1a1a', marginBottom: 8 },
  divider: { height: 0.5, backgroundColor: '#f0ede8', marginBottom: 8 },

  histRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  histDot: { width: 8, height: 8, borderRadius: 4, marginTop: 3 },
  histBody: { flex: 1 },
  histLabel: { fontFamily: F.m, fontSize: 12, color: '#1a1a1a' },
  histSub:   { fontFamily: F.r, fontSize: 10, color: '#888', marginTop: 1 },

  vacRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  vacRowBorder: { borderBottomWidth: 0.5, borderBottomColor: '#f0ede8' },
  vacNombre: { fontFamily: F.r, fontSize: 12, color: '#1a1a1a', flex: 1 },
  vacFecha:  { fontFamily: F.r, fontSize: 11, color: '#888', marginRight: 6 },
  badge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20 },
  badgeOk:      { backgroundColor: '#e6f3ec' },
  badgeNeutral: { backgroundColor: '#fdf0e6' },
  badgeText: { fontFamily: F.b, fontSize: 10 },

  cta: {
    backgroundColor: '#1e3a2f', borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 13,
  },
  ctaText: { fontFamily: F.m, fontSize: 13, color: '#fff' },
});
