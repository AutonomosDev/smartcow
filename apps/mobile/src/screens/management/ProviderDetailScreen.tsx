import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const F = { r: 'DMSans_400Regular', m: 'DMSans_500Medium', b: 'DMSans_600SemiBold' };

export default function ProviderDetailScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} color="#444" />
          </TouchableOpacity>
          <Text style={s.hdrRight}>Proveedor</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>Agropecuaria Sur</Text>
          <Text style={s.subtitle}>RUT 76.234.123-4 · 3 lotes históricos</Text>

          {/* Hero verde rendimiento histórico */}
          <View style={s.hero}>
            <Text style={s.heroLabel}>Rendimiento histórico del proveedor</Text>
            <Text style={s.heroTitle}>Agropecuaria Sur</Text>
            <View style={s.heroGrid}>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>GD promedio</Text>
                <Text style={s.heroItemVal}>1.7 kg</Text>
              </View>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>Mortalidad</Text>
                <Text style={s.heroItemVal}>0.3%</Text>
              </View>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>Este lote</Text>
                <Text style={[s.heroItemVal, { color: '#f39c12' }]}>1.4 kg</Text>
              </View>
            </View>
          </View>

          {/* Detalle compra */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Detalle compra — Lote Norte</Text>
            <View style={s.divider} />
            {[
              { label: 'Fecha compra',  val: '24 feb 2026', bold: false },
              { label: 'Animales',      val: '110 Angus',   bold: true },
              { label: 'Peso promedio', val: '342 kg',      bold: false },
              { label: 'Precio kg vivo', val: '$1.850/kg',  bold: false },
              { label: 'Total compra',  val: '$69.521.000', bold: true },
              { label: 'Guía despacho', val: 'GD-00234',   bold: false },
            ].map((row) => (
              <View key={row.label} style={s.detRow}>
                <Text style={s.detLabel}>{row.label}</Text>
                <Text style={[s.detVal, row.bold && { fontFamily: F.b }]}>{row.val}</Text>
              </View>
            ))}
          </View>

          {/* Rendimiento vs histórico */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Rendimiento vs histórico proveedor</Text>
            <View style={s.divider} />
            {[
              { label: 'GD histórico', val: 1.7, max: 2.0, color: '#1e3a2f' },
              { label: 'GD este lote', val: 1.4, max: 2.0, color: '#e74c3c' },
              { label: 'Mortalidad',   val: 0.3, max: 5.0, color: '#bbb' },
            ].map((row) => (
              <View key={row.label} style={s.rvsRow}>
                <Text style={s.rvsLabel}>{row.label}</Text>
                <View style={s.rvsTrack}>
                  <View style={[s.rvsFill, { width: `${(row.val / row.max) * 100}%`, backgroundColor: row.color }]} />
                </View>
                <Text style={[s.rvsVal, { color: row.color }]}>{row.val}</Text>
              </View>
            ))}
          </View>

          {/* SIPEC */}
          <View style={s.card}>
            <Text style={s.cardTitle}>SIPEC SAG — Trazabilidad</Text>
            <View style={s.divider} />
            {[
              { label: 'Guía despacho', val: 'GD-00234' },
              { label: 'Estado SIPEC',  val: 'Validado ✓' },
              { label: 'Predio origen', val: 'Los Andes · VIII Región' },
            ].map((row) => (
              <View key={row.label} style={s.detRow}>
                <Text style={s.detLabel}>{row.label}</Text>
                <Text style={s.detVal}>{row.val}</Text>
              </View>
            ))}
          </View>
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
  hero: { backgroundColor: '#1e3a2f', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  heroLabel: { fontFamily: F.r, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  heroTitle: { fontFamily: F.b, fontSize: 16, color: '#fff', marginBottom: 8 },
  heroGrid:  { flexDirection: 'row', gap: 5 },
  heroItem:  { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 7, padding: 6 },
  heroItemLabel: { fontFamily: F.r, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 1 },
  heroItemVal:   { fontFamily: F.b, fontSize: 12, color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  cardTitle: { fontFamily: F.b, fontSize: 13, color: '#1a1a1a', marginBottom: 8 },
  divider:   { height: 0.5, backgroundColor: '#f0ede8', marginBottom: 8 },
  detRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: '#f0ede8' },
  detLabel: { fontFamily: F.r, fontSize: 12, color: '#888' },
  detVal:   { fontFamily: F.r, fontSize: 12, color: '#1a1a1a' },
  rvsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rvsLabel: { fontFamily: F.r, fontSize: 11, color: '#888', width: 90 },
  rvsTrack: { flex: 1, height: 6, backgroundColor: '#f0ede8', borderRadius: 3 },
  rvsFill:  { height: 6, borderRadius: 3 },
  rvsVal:   { fontFamily: F.b, fontSize: 12, width: 28, textAlign: 'right' },
});
