import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { r: 'DMSans_400Regular', m: 'DMSans_500Medium', b: 'DMSans_600SemiBold' };

const INGREDIENTES = [
  { nombre: 'Ensilaje maíz', pct: 70, color: '#1e3a2f' },
  { nombre: 'Heno ballica',  pct: 20, color: '#7ecfa0' },
  { nombre: 'Afrecho trigo', pct: 10, color: '#bbbbbb' },
];

export default function ActiveDietScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<'dieta' | 'historial'>('dieta');

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} color="#444" />
          </TouchableOpacity>
          <Text style={s.hdrRight}>AgroBrain</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>Dieta activa</Text>
          <Text style={s.subtitle}>Lote Norte · 110 Angus</Text>

          {/* Tabs */}
          <View style={s.tabs}>
            {(['dieta', 'historial'] as const).map((t) => (
              <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabActive]} onPress={() => setTab(t)}>
                <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Hero verde energía */}
          <View style={s.hero}>
            <Text style={s.heroLabel}>Energía metabolizable diaria</Text>
            <Text style={s.heroAmount}>11.8 Mcal/día</Text>
            <Text style={s.heroSub}>Objetivo agrónomo: 14.2 Mcal/día</Text>
            <View style={s.heroGrid}>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>Proteína</Text>
                <Text style={s.heroItemVal}>13.2%</Text>
              </View>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>MS total</Text>
                <Text style={[s.heroItemVal, { color: '#f39c12' }]}>28%</Text>
              </View>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>Déficit</Text>
                <Text style={[s.heroItemVal, { color: '#e74c3c' }]}>-17%</Text>
              </View>
            </View>
          </View>

          {/* Alerta déficit — amarillo */}
          <View style={s.warnCard}>
            <Text style={s.warnTitle}>Déficit energético — 17%</Text>
            <Text style={s.warnBody}>
              Ensilaje entrega 11.8 vs 14.2 Mcal objetivo. Materia seca 28% — debería ser 32%. AgroBrain sugiere ajuste de ración.
            </Text>
          </View>

          {/* Ingredientes */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Ingredientes dieta actual</Text>
            <View style={s.divider} />
            {INGREDIENTES.map((ing) => (
              <View key={ing.nombre} style={s.ingRow}>
                <View style={[s.ingDot, { backgroundColor: ing.color }]} />
                <Text style={s.ingNombre}>{ing.nombre}</Text>
                <View style={s.ingTrack}>
                  <View style={[s.ingFill, { width: `${ing.pct}%`, backgroundColor: ing.color }]} />
                </View>
                <Text style={s.ingPct}>{ing.pct}%</Text>
              </View>
            ))}
          </View>

          {/* Consumo vs objetivo */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Consumo vs objetivo</Text>
            <View style={s.divider} />
            {[
              { label: 'MS consumida',  val: '8.4 kg/día', color: '#e74c3c' },
              { label: 'MS objetivo',   val: '10.2 kg/día', color: '#1a1a1a' },
              { label: 'Agua bebedero', val: '35 L/día',   color: '#1a1a1a' },
            ].map((row) => (
              <View key={row.label} style={s.conRow}>
                <Text style={s.conLabel}>{row.label}</Text>
                <Text style={[s.conVal, { color: row.color }]}>{row.val}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={s.cta}
            onPress={() => navigation.navigate('ForageAnalysis', { sampleId: 'S-001' })}
          >
            <Text style={s.ctaText}>Ver análisis forrajero</Text>
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
  hdrRight: { fontFamily: F.r, fontSize: 11, color: '#888' },
  title:    { fontFamily: F.b, fontSize: 24, color: '#1a1a1a', marginTop: 4, marginBottom: 2 },
  subtitle: { fontFamily: F.r, fontSize: 11, color: '#888', marginBottom: 12 },
  tabs: { flexDirection: 'row', backgroundColor: '#ebe9e3', borderRadius: 12, padding: 3, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontFamily: F.m, fontSize: 13, color: '#888' },
  tabTextActive: { color: '#1a1a1a' },
  hero: { backgroundColor: '#1e3a2f', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  heroLabel:  { fontFamily: F.r, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 3 },
  heroAmount: { fontFamily: F.b, fontSize: 26, color: '#fff', marginBottom: 2 },
  heroSub:    { fontFamily: F.r, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 10 },
  heroGrid:   { flexDirection: 'row', gap: 5 },
  heroItem:   { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 7, padding: 6 },
  heroItemLabel: { fontFamily: F.r, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 1 },
  heroItemVal:   { fontFamily: F.b, fontSize: 14, color: '#fff' },
  warnCard: { backgroundColor: '#fdf0e6', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  warnTitle: { fontFamily: F.b, fontSize: 12, color: '#9b5e1a', marginBottom: 4 },
  warnBody:  { fontFamily: F.r, fontSize: 11, color: '#555', lineHeight: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  cardTitle: { fontFamily: F.b, fontSize: 13, color: '#1a1a1a', marginBottom: 8 },
  divider: { height: 0.5, backgroundColor: '#f0ede8', marginBottom: 8 },
  ingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  ingDot: { width: 7, height: 7, borderRadius: 3.5 },
  ingNombre: { fontFamily: F.r, fontSize: 12, color: '#1a1a1a', width: 90 },
  ingTrack: { flex: 1, height: 6, backgroundColor: '#f0ede8', borderRadius: 4 },
  ingFill:  { height: 6, borderRadius: 4 },
  ingPct: { fontFamily: F.b, fontSize: 11, color: '#1a1a1a', width: 32, textAlign: 'right' },
  conRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  conLabel: { fontFamily: F.r, fontSize: 12, color: '#888' },
  conVal:   { fontFamily: F.b, fontSize: 12 },
  cta: { backgroundColor: '#1e3a2f', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  ctaText: { fontFamily: F.m, fontSize: 13, color: '#fff' },
});
