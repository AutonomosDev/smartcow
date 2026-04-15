import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ComparisonBar } from '../components/ComparisonBar';

const F = { r: 'DMSans_400Regular', m: 'DMSans_500Medium', b: 'DMSans_600SemiBold' };

export default function CostsSummaryScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<'lote' | 'predio'>('lote');

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} color="#444" />
          </TouchableOpacity>
          <Text style={s.hdrPeriod}>Abril 2026</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          {/* Título */}
          <Text style={s.title}>Costos</Text>
          <Text style={s.subtitle}>Lote Norte · 110 Angus</Text>

          {/* Tabs Lote / Predio */}
          <View style={s.tabs}>
            {(['lote', 'predio'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[s.tabBtn, tab === t && s.tabActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Hero card verde — DS: bg #1e3a2f · radius 16 · padding 12 14 · margin 0 16 */}
          <View style={s.hero}>
            <Text style={s.heroLabel}>Costo total acumulado</Text>
            <Text style={s.heroAmount}>$8.420.000</Text>
            <Text style={s.heroSub}>$76.545 por animal · 47 días engorda</Text>
            <View style={s.heroGrid}>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>Alimentación</Text>
                <Text style={s.heroItemVal}>62%</Text>
              </View>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>Animal pie</Text>
                <Text style={s.heroItemVal}>28%</Text>
              </View>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>Sanidad</Text>
                <Text style={s.heroItemVal}>10%</Text>
              </View>
            </View>
          </View>

          {/* Desglose */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Desglose de costos</Text>
            <View style={s.divider} />
            {[
              { label: 'Alimentación', pct: 62, val: '$5.220.000', color: '#1e3a2f' },
              { label: 'Animal pie',   pct: 28, val: '$2.358.000', color: '#385045' },
              { label: 'Sanidad',      pct: 10, val: '$842.000',   color: '#bbbbbb' },
            ].map((row) => (
              <View key={row.label} style={s.desgRow}>
                <View style={s.desgLeft}>
                  <Text style={s.desgLabel}>{row.label}</Text>
                  <ComparisonBar percentage={row.pct} height={7} color={row.color} />
                </View>
                <Text style={s.desgVal}>{row.val}</Text>
              </View>
            ))}
          </View>

          {/* Proyección faena */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Proyección faena</Text>
            <View style={s.divider} />
            {[
              { label: 'Precio venta estimado',  val: '$11.200.000', color: '#1a1a1a' },
              { label: 'Costo total proyectado', val: '$9.850.000',  color: '#1a1a1a' },
              { label: 'Margen estimado',         val: '+$1.350.000', color: '#1e3a2f' },
              { label: 'Margen por animal',       val: '+$12.272',    color: '#1e3a2f' },
            ].map((row, i) => (
              <View key={row.label} style={[s.projRow, i > 1 && s.projSep]}>
                <Text style={s.projLabel}>{row.label}</Text>
                <Text style={[s.projVal, { color: row.color }]}>{row.val}</Text>
              </View>
            ))}
          </View>

          {/* Ver última factura */}
          <TouchableOpacity
            style={s.linkRow}
            onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: 'F-00421' })}
          >
            <Text style={s.linkText}>Ver detalle última factura</Text>
            <ChevronRight size={14} color="#888" />
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
  hdrPeriod: { fontFamily: F.r, fontSize: 11, color: '#888' },

  title:    { fontFamily: F.b, fontSize: 28, color: '#1a1a1a', marginTop: 4, marginBottom: 2 },
  subtitle: { fontFamily: F.r, fontSize: 11, color: '#888', marginBottom: 12 },

  tabs: { flexDirection: 'row', backgroundColor: '#ebe9e3', borderRadius: 12, padding: 3, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontFamily: F.m, fontSize: 13, color: '#888' },
  tabTextActive: { color: '#1a1a1a' },

  // Hero
  hero: { backgroundColor: '#1e3a2f', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  heroLabel: { fontFamily: F.r, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 3 },
  heroAmount: { fontFamily: F.b, fontSize: 28, color: '#fff', marginBottom: 2 },
  heroSub: { fontFamily: F.r, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 10 },
  heroGrid: { flexDirection: 'row', gap: 5 },
  heroItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 7, padding: 6 },
  heroItemLabel: { fontFamily: F.r, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 1 },
  heroItemVal: { fontFamily: F.b, fontSize: 14, color: '#fff' },

  // Cards
  card: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  cardTitle: { fontFamily: F.b, fontSize: 13, color: '#1a1a1a', marginBottom: 8 },
  divider: { height: 0.5, backgroundColor: '#f0ede8', marginBottom: 10 },

  desgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  desgLeft: { flex: 1, marginRight: 12 },
  desgLabel: { fontFamily: F.r, fontSize: 12, color: '#444', marginBottom: 4 },
  desgVal: { fontFamily: F.b, fontSize: 13, color: '#1a1a1a', paddingBottom: 2 },

  projRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  projSep: { marginTop: 7, paddingTop: 7, borderTopWidth: 0.5, borderTopColor: '#f0ede8' },
  projLabel: { fontFamily: F.r, fontSize: 12, color: '#888' },
  projVal: { fontFamily: F.b, fontSize: 12 },

  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  linkText: { fontFamily: F.m, fontSize: 12, color: '#1a1a1a' },
});
