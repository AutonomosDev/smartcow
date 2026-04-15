import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { r: 'DMSans_400Regular', m: 'DMSans_500Medium', b: 'DMSans_600SemiBold' };

const MAQUINARIA = [
  {
    id: 'm1', nombre: 'Tractor JD 6110', sub: 'John Deere 6110J · 2019',
    badge: 'Servicio vencido', badgeBg: '#fde8e8', badgeColor: '#c0392b',
    kpis: [{ l: 'Horas motor', v: '3.312 h', c: '#e74c3c' }, { l: 'Diesel hoy', v: '28 L', c: '#1a1a1a' }, { l: 'GPS', v: 'Activo', c: '#1e3a2f' }],
    alerta: 'Cambio aceite', alertaUrgente: true,
    loc: 'Potrero Norte · Hace 12 min',
  },
  {
    id: 'm2', nombre: 'Carro Forrajero', sub: 'Mixer 12m³ · 2021',
    badge: 'OK', badgeBg: '#e6f3ec', badgeColor: '#1e3a2f',
    kpis: [{ l: 'Salidas hoy', v: '3', c: '#1a1a1a' }, { l: 'Última', v: '08:30', c: '#1a1a1a' }, { l: 'GPS', v: 'Activo', c: '#1e3a2f' }],
    alerta: 'Al día ✓', alertaUrgente: false,
    loc: 'Manga principal · Hace 2 h',
  },
  {
    id: 'm3', nombre: 'Estanque Diesel', sub: 'Sensor Escort TD-150 · 5.000 L',
    badge: '42% restante', badgeBg: '#fdf0e6', badgeColor: '#9b5e1a',
    kpis: [{ l: 'Stock actual', v: '2.100 L', c: '#f39c12' }, { l: 'Consumo/día', v: '280 L', c: '#1a1a1a' }, { l: 'Días rest.', v: '7', c: '#e74c3c' }],
    alerta: '', alertaUrgente: false,
    loc: '',
  },
];

export default function MachineryDashboardScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} color="#444" />
          </TouchableOpacity>
          <Text style={s.hdrRight}>GPS · Traccar</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>Maquinaria</Text>
          <Text style={s.subtitle}>Fundo San Pedro · 4 activos</Text>

          {/* Stats row */}
          <View style={s.statsRow}>
            <View style={s.statCell}>
              <Text style={s.statVal}>4</Text>
              <Text style={s.statLabel}>Activos</Text>
            </View>
            <View style={s.statCell}>
              <Text style={[s.statVal, { color: '#e74c3c' }]}>1</Text>
              <Text style={s.statLabel}>Servicio{'\n'}vencido</Text>
            </View>
            <View style={s.statCell}>
              <Text style={[s.statVal, { color: '#f39c12' }]}>42%</Text>
              <Text style={s.statLabel}>Diesel{'\n'}estanque</Text>
            </View>
          </View>

          {/* Alerta crítica */}
          <View style={s.alertCard}>
            <AlertTriangle size={14} color="#c0392b" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.alertTitle}>Servicio vencido — Tractor JD 6110</Text>
              <Text style={s.alertBody}>Cambio aceite vencido a las 3.250h. Actualmente en 3.312h. Agendar servicio urgente.</Text>
            </View>
          </View>

          {/* Lista maquinaria */}
          {MAQUINARIA.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={s.card}
              onPress={() => navigation.navigate('MachineryDetail', { assetId: m.id })}
            >
              <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{m.nombre}</Text>
                  <Text style={s.cardSub}>{m.sub}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: m.badgeBg }]}>
                  <Text style={[s.badgeText, { color: m.badgeColor }]}>{m.badge}</Text>
                </View>
              </View>
              <View style={s.kpiRow}>
                {m.kpis.map((k) => (
                  <View key={k.l} style={s.kpiCell}>
                    <Text style={s.kpiLabel}>{k.l}</Text>
                    <Text style={[s.kpiVal, { color: k.c }]}>{k.v}</Text>
                  </View>
                ))}
              </View>
              {m.loc !== '' && (
                <View style={s.locRow}>
                  <Text style={s.locText}>{m.loc}</Text>
                  {m.alertaUrgente && (
                    <View style={s.alertBadge}>
                      <AlertTriangle size={9} color="#c0392b" />
                      <Text style={s.alertBadgeText}>{m.alerta}</Text>
                    </View>
                  )}
                  {!m.alertaUrgente && m.alerta !== '' && (
                    <Text style={{ fontFamily: F.r, fontSize: 10, color: '#1e3a2f' }}>{m.alerta}</Text>
                  )}
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
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 8, marginBottom: 10 },
  statCell: { flex: 1, alignItems: 'center' },
  statVal:  { fontFamily: F.b, fontSize: 20, color: '#1a1a1a' },
  statLabel: { fontFamily: F.r, fontSize: 9, color: '#bbb', textAlign: 'center', marginTop: 2 },
  alertCard: { flexDirection: 'row', backgroundColor: '#fde8e8', borderRadius: 14, padding: 12, marginBottom: 10, alignItems: 'flex-start' },
  alertTitle: { fontFamily: F.b, fontSize: 12, color: '#c0392b', marginBottom: 3 },
  alertBody:  { fontFamily: F.r, fontSize: 11, color: '#555', lineHeight: 15 },
  card: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontFamily: F.b, fontSize: 13, color: '#1a1a1a' },
  cardSub:   { fontFamily: F.r, fontSize: 10, color: '#888', marginTop: 1 },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 20 },
  badgeText: { fontFamily: F.b, fontSize: 9 },
  kpiRow: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  kpiCell: { flex: 1 },
  kpiLabel: { fontFamily: F.r, fontSize: 9, color: '#bbb', marginBottom: 1 },
  kpiVal:   { fontFamily: F.b, fontSize: 13 },
  locRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#f0ede8', paddingTop: 6 },
  locText: { fontFamily: F.r, fontSize: 10, color: '#888' },
  alertBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  alertBadgeText: { fontFamily: F.b, fontSize: 10, color: '#c0392b' },
});
