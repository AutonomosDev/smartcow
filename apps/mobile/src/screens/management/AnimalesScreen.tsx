import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, ChevronRight, Search, TrendingUp, AlertCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = {
  regular: 'DMSans_400Regular',
  medium:  'DMSans_500Medium',
  bold:    'DMSans_600SemiBold',
};

type TabKey = 'todos' | 'obs' | 'trat';

const ANIMALES = [
  { diio: 'AR 045', lote: 'Lote 4 · Wagyu F1', peso: '487 kg', gdp: '+1.31', estado: 'ok' as const },
  { diio: 'AR 102', lote: 'Lote 4 · Wagyu F1', peso: '461 kg', gdp: '+1.18', estado: 'ok' as const },
  { diio: 'AR 078', lote: 'Lote 3 · Angus',    peso: '392 kg', gdp: '+0.72', estado: 'obs' as const },
  { diio: 'AR 033', lote: 'Lote 3 · Angus',    peso: '410 kg', gdp: '+0.98', estado: 'ok' as const },
  { diio: 'AR 091', lote: 'Lote 3 · Angus',    peso: '388 kg', gdp: '+0.41', estado: 'trat' as const },
  { diio: 'AR 014', lote: 'Lote 4 · Wagyu F1', peso: '502 kg', gdp: '+1.40', estado: 'ok' as const },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: 'todos', label: 'Todos (242)' },
  { key: 'obs',   label: 'En observ. (2)' },
  { key: 'trat',  label: 'En trat. (1)' },
];

const ESTADO_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  ok:   { bg: '#e6f3ec', text: '#1e3a2f', label: 'OK' },
  obs:  { bg: '#fdf0e6', text: '#9b5e1a', label: 'Obs.' },
  trat: { bg: '#fde8e8', text: '#c0392b', label: 'Trat.' },
};

export default function AnimalesScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<TabKey>('todos');

  const filtered = tab === 'todos'
    ? ANIMALES
    : ANIMALES.filter((a) => a.estado === tab);

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} color="#444" />
          </TouchableOpacity>
          <View>
            <Text style={s.hdrTitle}>Mis Animales</Text>
            <Text style={s.hdrSub}>Fundo San Pedro · 242 total</Text>
          </View>
          <View style={{ width: 26 }} />
        </View>

        {/* ── Hero card ── */}
        <View style={s.hero}>
          <Text style={s.heroLabel}>STOCK GENERAL</Text>
          <Text style={s.heroTitle}>242 Animales activos</Text>
          <View style={s.heroGrid}>
            <View style={s.heroItem}>
              <Text style={s.heroItemLabel}>Peso prom.</Text>
              <Text style={s.heroItemVal}>437 kg</Text>
            </View>
            <View style={s.heroItem}>
              <Text style={s.heroItemLabel}>GDP prom.</Text>
              <Text style={[s.heroItemVal, { color: '#7ecfa0' }]}>+1.1 kg</Text>
            </View>
            <View style={s.heroItem}>
              <Text style={s.heroItemLabel}>Observ.</Text>
              <Text style={[s.heroItemVal, { color: '#f39c12' }]}>2</Text>
            </View>
          </View>
        </View>

        {/* ── Tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.tabsWrapper}
          contentContainerStyle={s.tabsRow}
        >
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[s.tabBtn, tab === t.key && s.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Lista ── */}
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {filtered.map((a, i) => (
            <TouchableOpacity
              key={i}
              style={s.card}
              onPress={() => navigation.navigate('HealthFile', { diio: a.diio })}
            >
              <View style={s.cardTop}>
                <View>
                  <Text style={s.cardTitle}>{a.diio}</Text>
                  <Text style={s.cardBody}>{a.lote}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: ESTADO_BADGE[a.estado].bg }]}>
                  <Text style={[s.badgeText, { color: ESTADO_BADGE[a.estado].text }]}>
                    {ESTADO_BADGE[a.estado].label}
                  </Text>
                </View>
              </View>

              {/* 8 - Progress bar peso */}
              <View style={s.progRow}>
                <Text style={s.progLabel}>Peso</Text>
                <View style={s.progTrack}>
                  <View style={[s.progFill, { width: `${Math.min((parseInt(a.peso) / 600) * 100, 100)}%` }]} />
                </View>
                <Text style={s.progVal}>{a.peso}</Text>
              </View>

              <View style={s.cardFooter}>
                <TrendingUp size={11} color="#bbb" />
                <Text style={s.footText}>GDP: {a.gdp} kg/día</Text>
                <ChevronRight size={12} color="#bbb" />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f1' },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#ebe9e3', justifyContent: 'center', alignItems: 'center',
  },
  hdrTitle: { fontFamily: F.bold, fontSize: 15, color: '#1a1a1a', textAlign: 'center' },
  hdrSub:   { fontFamily: F.regular, fontSize: 10, color: '#888', textAlign: 'center' },

  // Hero
  hero: {
    backgroundColor: '#1e3a2f',
    borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14,
    marginHorizontal: 16, marginBottom: 8,
  },
  heroLabel: { fontFamily: F.bold, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 3 },
  heroTitle: { fontFamily: F.bold, fontSize: 14, color: '#fff', marginBottom: 8 },
  heroGrid:  { flexDirection: 'row', gap: 5 },
  heroItem:  { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 7, padding: 6 },
  heroItemLabel: { fontFamily: F.regular, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 1 },
  heroItemVal:   { fontFamily: F.bold, fontSize: 12, color: '#fff' },

  // Tabs
  tabsWrapper: { maxHeight: 44, marginBottom: 4 },
  tabsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, alignItems: 'center' },
  tabBtn: {
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 20, backgroundColor: '#fff',
  },
  tabActive: { backgroundColor: '#1e3a2f' },
  tabText:   { fontFamily: F.bold, fontSize: 11, color: '#888' },
  tabTextActive: { color: '#fff' },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 8,
  },
  cardTitle: { fontFamily: F.bold, fontSize: 14, color: '#1a1a1a' },
  cardBody:  { fontFamily: F.regular, fontSize: 11, color: '#888', marginTop: 1 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  footText:   { fontFamily: F.regular, fontSize: 10, color: '#bbb', flex: 1 },

  // Progress bar (DS comp 8)
  progRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progLabel: { fontFamily: F.regular, fontSize: 9, color: '#bbb', width: 28 },
  progTrack: { flex: 1, height: 6, backgroundColor: '#f0ede8', borderRadius: 4 },
  progFill:  { height: 6, backgroundColor: '#1e3a2f', borderRadius: 4 },
  progVal:   { fontFamily: F.regular, fontSize: 9, color: '#bbb', width: 48, textAlign: 'right' },

  // Badge
  badge:     { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20 },
  badgeText: { fontFamily: F.bold, fontSize: 10 },
});
