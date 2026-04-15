import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, AlignLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { r: 'DMSans_400Regular', m: 'DMSans_500Medium', b: 'DMSans_600SemiBold' };

const BARS = [22, 14, 12, 8, 18, 26, 30, 24, 14, 10, 6, 18, 28, 32, 20, 16, 10, 8, 12, 22, 18];

export default function WeatherDetailScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<'mes' | 'semana'>('mes');

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} color="#444" />
          </TouchableOpacity>
          <AlignLeft size={18} color="#444" />
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>Impacto climático</Text>
          <Text style={s.subtitle}>Abril 2026 · San Pedro</Text>

          {/* Tabs */}
          <View style={s.tabs}>
            {(['mes', 'semana'] as const).map((t) => (
              <TouchableOpacity key={t} style={[s.tabBtn, tab === t && s.tabActive]} onPress={() => setTab(t)}>
                <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Gráfico barras precipitaciones */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Precipitaciones — abril</Text>
            <View style={s.chart}>
              {BARS.map((h, i) => (
                <View key={i} style={s.barWrap}>
                  <View style={[s.bar, { height: Math.max(4, (h / 32) * 80) }]} />
                  {i % 4 === 0 && <Text style={s.barLabel}>{i + 1}</Text>}
                </View>
              ))}
              <View style={s.barWrap}>
                <View style={[s.bar, s.barToday, { height: 60 }]} />
                <Text style={s.barLabel}>Hoy</Text>
              </View>
            </View>
          </View>

          {/* Stats 2x2 */}
          <View style={s.statsGrid}>
            <View style={s.statCell}>
              <Text style={s.statLabel}>Días lluvia mes</Text>
              <Text style={[s.statVal, { color: '#e74c3c' }]}>18</Text>
              <Text style={s.statSub}>Normal: 12 días</Text>
            </View>
            <View style={s.statCell}>
              <Text style={s.statLabel}>Acumulado mes</Text>
              <Text style={[s.statVal, { color: '#e74c3c' }]}>148 mm</Text>
              <Text style={s.statSub}>Normal: 90 mm</Text>
            </View>
            <View style={s.statCell}>
              <Text style={s.statLabel}>Energía extra</Text>
              <Text style={[s.statVal, { color: '#f39c12' }]}>+12%</Text>
              <Text style={s.statSub}>Por frío y barro</Text>
            </View>
            <View style={s.statCell}>
              <Text style={s.statLabel}>Temp promedio</Text>
              <Text style={s.statVal}>6.2°</Text>
              <Text style={s.statSub}>Mínima: 2.1°</Text>
            </View>
          </View>

          {/* Vuelos drone */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Vuelos drone este mes</Text>
            <View style={s.divider} />
            {[
              { label: 'Vuelos completados',  val: '7',        color: '#1a1a1a' },
              { label: 'Cancelados por viento', val: '4',      color: '#e74c3c' },
              { label: 'Próxima ventana',     val: 'Sáb 08:00', color: '#1a1a1a' },
            ].map((row) => (
              <View key={row.label} style={s.droneRow}>
                <Text style={s.droneLbl}>{row.label}</Text>
                <Text style={[s.droneVal, { color: row.color }]}>{row.val}</Text>
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
  title:    { fontFamily: F.b, fontSize: 24, color: '#1a1a1a', marginTop: 4, marginBottom: 2 },
  subtitle: { fontFamily: F.r, fontSize: 11, color: '#888', marginBottom: 12 },
  tabs: { flexDirection: 'row', backgroundColor: '#ebe9e3', borderRadius: 12, padding: 3, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontFamily: F.m, fontSize: 13, color: '#888' },
  tabTextActive: { color: '#1a1a1a' },
  card: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  cardTitle: { fontFamily: F.b, fontSize: 13, color: '#1a1a1a', marginBottom: 10 },
  divider:   { height: 0.5, backgroundColor: '#f0ede8', marginBottom: 8 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 100 },
  barWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar:      { width: '100%', backgroundColor: '#bbd6e8', borderRadius: 2 },
  barToday: { backgroundColor: '#1e3a2f' },
  barLabel: { fontFamily: F.r, fontSize: 7, color: '#bbb', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  statCell: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 14, padding: 12 },
  statLabel: { fontFamily: F.r, fontSize: 9, color: '#bbb', marginBottom: 3 },
  statVal:   { fontFamily: F.b, fontSize: 20, color: '#1a1a1a' },
  statSub:   { fontFamily: F.r, fontSize: 9, color: '#bbb', marginTop: 2 },
  droneRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: '#f0ede8' },
  droneLbl: { fontFamily: F.r, fontSize: 12, color: '#888' },
  droneVal: { fontFamily: F.b, fontSize: 12 },
});
