import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, ChevronRight, MapPin, AlertTriangle, Droplets, TrendingUp } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = {
  regular: 'DMSans_400Regular',
  medium:  'DMSans_500Medium',
  bold:    'DMSans_600SemiBold',
};

const POTREROS = [
  {
    id: 'p1',
    nombre: 'Potrero Norte',
    lote: 'Lote 4 — Wagyu F1',
    animales: 82,
    gdp: '+1.24 kg',
    agua: 94,
    estado: 'ok' as const,
  },
  {
    id: 'p2',
    nombre: 'Potrero Sur',
    lote: 'Lote 3 — Angus',
    animales: 110,
    gdp: '+0.98 kg',
    agua: 17,
    estado: 'warn' as const,
  },
  {
    id: 'p3',
    nombre: 'Manga Principal',
    lote: 'Recepción',
    animales: 50,
    gdp: '+1.10 kg',
    agua: 88,
    estado: 'ok' as const,
  },
];

export default function FundoDetailScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={16} color="#444" />
          </TouchableOpacity>
          <View>
            <Text style={s.hdrTitle}>Fundo San Pedro</Text>
            <Text style={s.hdrSub}>3 potreros · Abril 2026</Text>
          </View>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Hero card ── */}
          <View style={s.hero}>
            <Text style={s.heroLabel}>RESUMEN DEL FUNDO</Text>
            <Text style={s.heroTitle}>Feedlot · Wagyu F1 & Angus</Text>
            <View style={s.heroGrid}>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>Total</Text>
                <Text style={s.heroItemVal}>242</Text>
              </View>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>Ton vivos</Text>
                <Text style={[s.heroItemVal, { color: '#7ecfa0' }]}>106</Text>
              </View>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>GDP Prom</Text>
                <Text style={[s.heroItemVal, { color: '#7ecfa0' }]}>+1.1</Text>
              </View>
            </View>
          </View>

          {/* ── Stats ── */}
          <View style={s.stats}>
            <View style={s.stat}>
              <Text style={s.statVal}>94%</Text>
              <Text style={s.statLabel}>Efic.{'\n'}ración</Text>
            </View>
            <View style={s.stat}>
              <Text style={[s.statVal, { color: '#e74c3c' }]}>1</Text>
              <Text style={s.statLabel}>Alerta{'\n'}activa</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statVal}>18.4%</Text>
              <Text style={s.statLabel}>Margen{'\n'}est.</Text>
            </View>
          </View>

          {/* ── Potreros ── */}
          <Text style={s.secTitle}>POTREROS</Text>

          {POTREROS.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={s.card}
              onPress={() => navigation.navigate('PotreroDetalle', { potreroId: p.id })}
            >
              <View style={s.cardTop}>
                <View style={s.cardLeft}>
                  <MapPin size={14} color="#1e3a2f" style={{ marginRight: 6 }} />
                  <Text style={s.cardTitle}>{p.nombre}</Text>
                </View>
                <View style={[s.badge, p.estado === 'ok' ? s.badgeOk : s.badgeWarn]}>
                  <Text style={[s.badgeText, { color: p.estado === 'ok' ? '#1e3a2f' : '#9b5e1a' }]}>
                    {p.estado === 'ok' ? 'OK' : 'Atención'}
                  </Text>
                </View>
              </View>

              <Text style={s.cardBody}>{p.lote}</Text>

              <View style={s.cardFooter}>
                <View style={s.footItem}>
                  <TrendingUp size={11} color="#bbb" />
                  <Text style={s.footText}>{p.gdp}/día</Text>
                </View>
                <View style={s.footItem}>
                  <Droplets size={11} color={p.agua < 30 ? '#e74c3c' : '#bbb'} />
                  <Text style={[s.footText, p.agua < 30 ? { color: '#e74c3c' } : {}]}>
                    {p.agua}% agua
                  </Text>
                </View>
                <Text style={s.footText}>{p.animales} animales</Text>
                <ChevronRight size={12} color="#bbb" />
              </View>
            </TouchableOpacity>
          ))}

          {/* ── CTA ── */}
          <TouchableOpacity
            style={s.cta}
            onPress={() => navigation.navigate('MapaPredio')}
          >
            <Text style={s.ctaText}>Ver mapa del fundo</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f1' },
  safeArea: { flex: 1 },
  scroll: { paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ebe9e3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hdrTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  hdrSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },

  // Hero
  hero: {
    backgroundColor: '#1e3a2f',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  heroLabel: { fontFamily: F.bold, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 3 },
  heroTitle: { fontFamily: F.bold, fontSize: 14, color: '#fff', marginBottom: 8 },
  heroGrid: { flexDirection: 'row', gap: 5 },
  heroItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 7, padding: 6 },
  heroItemLabel: { fontFamily: F.regular, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 1 },
  heroItemVal: { fontFamily: F.bold, fontSize: 12, color: '#fff' },

  // Stats
  stats: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 8 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 11, padding: 9, alignItems: 'center' },
  statVal: { fontFamily: F.bold, fontSize: 16, color: '#1a1a1a' },
  statLabel: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginTop: 1, textAlign: 'center' },

  // Section title
  secTitle: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#888',
    letterSpacing: 1,
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 8,
  },

  // Card blanca
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontFamily: F.bold, fontSize: 13, color: '#1a1a1a' },
  cardBody: { fontFamily: F.regular, fontSize: 11, color: '#888', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  footItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  footText: { fontFamily: F.regular, fontSize: 10, color: '#bbb', flex: 1 },

  // Badge
  badge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20 },
  badgeOk: { backgroundColor: '#e6f3ec' },
  badgeWarn: { backgroundColor: '#fdf0e6' },
  badgeText: { fontFamily: F.bold, fontSize: 10 },

  // CTA
  cta: {
    backgroundColor: '#1e3a2f',
    borderRadius: 12,
    padding: 13,
    marginHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  ctaText: { fontFamily: F.medium, fontSize: 13, color: '#fff' },
});
