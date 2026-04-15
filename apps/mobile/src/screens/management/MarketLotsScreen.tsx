import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { r: 'DMSans_400Regular', m: 'DMSans_500Medium', b: 'DMSans_600SemiBold' };

const LOTES = [
  {
    id: 'norte',
    nombre: 'Lote Norte — Angus',
    proveedor: 'Agropecuaria Sur',
    badge: 'Engorda', badgeColor: '#e6f3ec', badgeText: '#1e3a2f',
    animales: 110, dias: 47, gd: '1.4', margen: '+12%',
    ingreso: '24 feb', alerta: 'GD bajo objetivo', alertaUrgente: true,
  },
  {
    id: 'sur',
    nombre: 'Lote Sur — Wagyu',
    proveedor: 'Ganadería Los Andes',
    badge: 'Recría', badgeColor: '#e8f4fd', badgeText: '#1a6aa0',
    animales: 78, dias: 34, gd: '1.1', margen: '+18%',
    ingreso: '8 mar', alerta: 'En rango ✓', alertaUrgente: false,
  },
  {
    id: 'central',
    nombre: 'Lote Central — Angus',
    proveedor: 'Agropecuaria Sur',
    badge: 'Faena 15 días', badgeColor: '#fdf0e6', badgeText: '#9b5e1a',
    animales: 155, dias: 68, gd: '1.9', margen: '+16%',
    ingreso: '6 ene', alerta: '', alertaUrgente: false,
  },
];

export default function MarketLotsScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<'lotes' | 'proveedores'>('lotes');

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} color="#444" />
          </TouchableOpacity>
          <Text style={s.hdrRight}>Abril 2026</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>Compra-venta</Text>
          <Text style={s.subtitle}>Fundo San Pedro · 4 lotes activos</Text>

          {/* Tabs */}
          <View style={s.tabs}>
            {(['lotes', 'proveedores'] as const).map((t) => (
              <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabActive]} onPress={() => setTab(t)}>
                <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Stats hero */}
          <View style={s.statsRow}>
            <View style={s.statCell}>
              <Text style={s.statLabel}>Animales{'\n'}activos</Text>
              <Text style={s.statVal}>343</Text>
              <Text style={s.statSub}>4 lotes</Text>
            </View>
            <View style={s.statCell}>
              <Text style={s.statLabel}>Inversión{'\n'}total</Text>
              <Text style={s.statVal}>$28.4M</Text>
              <Text style={s.statSub}>CLP</Text>
            </View>
            <View style={s.statCell}>
              <Text style={s.statLabel}>Margen{'\n'}proy.</Text>
              <Text style={[s.statVal, { color: '#1e3a2f' }]}>+14%</Text>
              <Text style={s.statSub}>promedio</Text>
            </View>
          </View>

          {/* Lotes */}
          {LOTES.map((lote) => (
            <TouchableOpacity
              key={lote.id}
              style={s.card}
              onPress={() => navigation.navigate('ProviderDetail', { providerId: lote.proveedor })}
            >
              <View style={s.cardTop}>
                <Text style={s.cardTitle}>{lote.nombre}</Text>
                <View style={[s.badge, { backgroundColor: lote.badgeColor }]}>
                  <Text style={[s.badgeText, { color: lote.badgeText }]}>{lote.badge}</Text>
                </View>
              </View>
              <Text style={s.cardSub}>{lote.proveedor}</Text>
              <View style={s.kpiRow}>
                {[
                  { l: 'Animales', v: String(lote.animales), c: '#1a1a1a' },
                  { l: 'Días',     v: String(lote.dias),     c: '#1a1a1a' },
                  { l: 'GD',       v: lote.gd,               c: parseFloat(lote.gd) < 1.5 ? '#e74c3c' : '#1a1a1a' },
                  { l: 'Margen',   v: lote.margen,            c: '#1e3a2f' },
                ].map((k) => (
                  <View key={k.l} style={s.kpiCell}>
                    <Text style={s.kpiLabel}>{k.l}</Text>
                    <Text style={[s.kpiVal, { color: k.c }]}>{k.v}</Text>
                  </View>
                ))}
              </View>
              {lote.alerta !== '' && (
                <View style={s.alertRow}>
                  <Text style={s.alertIngreso}>Ingresó {lote.ingreso}</Text>
                  <View style={s.alertRight}>
                    {lote.alertaUrgente && <AlertTriangle size={10} color="#e74c3c" />}
                    <Text style={[s.alertText, { color: lote.alertaUrgente ? '#e74c3c' : '#1e3a2f' }]}>
                      {lote.alerta}
                    </Text>
                  </View>
                </View>
              )}
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
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#ebe9e3', justifyContent: 'center', alignItems: 'center' },
  hdrRight: { fontFamily: F.r, fontSize: 11, color: '#888' },
  title:    { fontFamily: F.b, fontSize: 28, color: '#1a1a1a', marginTop: 4, marginBottom: 2 },
  subtitle: { fontFamily: F.r, fontSize: 11, color: '#888', marginBottom: 12 },
  tabs: { flexDirection: 'row', backgroundColor: '#ebe9e3', borderRadius: 12, padding: 3, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontFamily: F.m, fontSize: 13, color: '#888' },
  tabTextActive: { color: '#1a1a1a' },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 8, marginBottom: 10, gap: 4 },
  statCell: { flex: 1, alignItems: 'center' },
  statLabel: { fontFamily: F.r, fontSize: 9, color: '#bbb', textAlign: 'center', marginBottom: 2 },
  statVal:   { fontFamily: F.b, fontSize: 16, color: '#1a1a1a' },
  statSub:   { fontFamily: F.r, fontSize: 9, color: '#bbb' },
  card: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  cardTitle: { fontFamily: F.b, fontSize: 13, color: '#1a1a1a', flex: 1 },
  cardSub:   { fontFamily: F.r, fontSize: 10, color: '#888', marginBottom: 8 },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 20 },
  badgeText: { fontFamily: F.b, fontSize: 9 },
  kpiRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  kpiCell: { flex: 1 },
  kpiLabel: { fontFamily: F.r, fontSize: 9, color: '#bbb', marginBottom: 1 },
  kpiVal:   { fontFamily: F.b, fontSize: 14 },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#f0ede8', paddingTop: 6 },
  alertIngreso: { fontFamily: F.r, fontSize: 10, color: '#888' },
  alertRight:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  alertText:    { fontFamily: F.b, fontSize: 10 },
});
