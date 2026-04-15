import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { r: 'DMSans_400Regular', m: 'DMSans_500Medium', b: 'DMSans_600SemiBold' };

const SERVICIOS = [
  { nombre: 'Cambio aceite',   estado: 'Vencido 62h',       pct: 1.0,  color: '#e74c3c' },
  { nombre: 'Filtro aire',     estado: '500 h restantes',    pct: 0.58, color: '#1e3a2f' },
  { nombre: 'Revisión frenos', estado: '1.200 h restantes', pct: 0.24, color: '#1e3a2f' },
];

const MANTENCIONES = [
  { label: 'Cambio aceite', fecha: '15 ene · 3.250 h', estado: 'Hecho' },
  { label: 'Filtro',        fecha: '15 ene · 3.250 h', estado: 'Hecho' },
];

export default function MachineryDetailScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} color="#444" />
          </TouchableOpacity>
          <Text style={s.hdrAlert}>SERVICIO VENCIDO</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>Tractor JD 6110</Text>
          <Text style={s.subtitle}>John Deere 6110J · 2019</Text>

          {/* Hero estado actual */}
          <View style={s.hero}>
            <Text style={s.heroLabel}>ESTADO ACTUAL</Text>
            <Text style={s.heroTitle}>Tractor JD 6110</Text>
            <Text style={s.heroSub}>Traccar GPS · Teltonika FMB920</Text>
            <View style={s.heroGrid}>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>Horas motor</Text>
                <Text style={[s.heroItemVal, { color: '#f39c12' }]}>3.312 h</Text>
              </View>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>Diesel hoy</Text>
                <Text style={s.heroItemVal}>28 L</Text>
              </View>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>Ubicación</Text>
                <Text style={s.heroItemVal}>Norte</Text>
              </View>
            </View>
          </View>

          {/* Servicios programados */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Servicios programados</Text>
            <View style={s.divider} />
            {SERVICIOS.map((sv) => (
              <View key={sv.nombre} style={s.svcRow}>
                <Text style={s.svcNombre}>{sv.nombre}</Text>
                <View style={s.svcTrack}>
                  <View style={[s.svcFill, { width: `${Math.min(sv.pct * 100, 100)}%`, backgroundColor: sv.color }]} />
                </View>
                <Text style={[s.svcEstado, { color: sv.color }]}>{sv.estado}</Text>
              </View>
            ))}
          </View>

          {/* Consumo diesel — amarillo */}
          <View style={s.warnCard}>
            <Text style={s.warnTitle}>Consumo diesel — Abril</Text>
            <View style={s.warnGrid}>
              <View style={s.warnCell}>
                <Text style={s.warnLabel}>Total mes</Text>
                <Text style={s.warnVal}>842 L</Text>
              </View>
              <View style={s.warnCell}>
                <Text style={s.warnLabel}>Promedio/día</Text>
                <Text style={s.warnVal}>28 L</Text>
              </View>
              <View style={s.warnCell}>
                <Text style={s.warnLabel}>Costo mes</Text>
                <Text style={s.warnVal}>$674.000</Text>
              </View>
              <View style={s.warnCell}>
                <Text style={s.warnLabel}>L/hora motor</Text>
                <Text style={s.warnVal}>8.2 L/h</Text>
              </View>
            </View>
          </View>

          {/* Historial mantenciones */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Historial mantenciones</Text>
            <View style={s.divider} />
            {MANTENCIONES.map((m, i) => (
              <View key={i} style={s.mantRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.mantLabel}>{m.label}</Text>
                  <Text style={s.mantFecha}>{m.fecha}</Text>
                </View>
                <View style={s.badgeOk}>
                  <Text style={s.badgeOkText}>{m.estado}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* CTA agendar servicio */}
          <TouchableOpacity style={s.cta} onPress={() => navigation.goBack()}>
            <Text style={s.ctaText}>Agendar servicio urgente</Text>
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
  hdrAlert: { fontFamily: F.b, fontSize: 11, color: '#c0392b', letterSpacing: 0.5 },
  title:    { fontFamily: F.b, fontSize: 24, color: '#1a1a1a', marginTop: 4, marginBottom: 2 },
  subtitle: { fontFamily: F.r, fontSize: 11, color: '#888', marginBottom: 12 },
  hero: { backgroundColor: '#1e3a2f', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  heroLabel: { fontFamily: F.b, fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 2 },
  heroTitle: { fontFamily: F.b, fontSize: 16, color: '#fff', marginBottom: 2 },
  heroSub:   { fontFamily: F.r, fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 10 },
  heroGrid:  { flexDirection: 'row', gap: 5 },
  heroItem:  { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 7, padding: 6 },
  heroItemLabel: { fontFamily: F.r, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 1 },
  heroItemVal:   { fontFamily: F.b, fontSize: 12, color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  cardTitle: { fontFamily: F.b, fontSize: 13, color: '#1a1a1a', marginBottom: 8 },
  divider:   { height: 0.5, backgroundColor: '#f0ede8', marginBottom: 8 },
  svcRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  svcNombre: { fontFamily: F.r, fontSize: 11, color: '#888', width: 90 },
  svcTrack:  { flex: 1, height: 6, backgroundColor: '#f0ede8', borderRadius: 3 },
  svcFill:   { height: 6, borderRadius: 3 },
  svcEstado: { fontFamily: F.b, fontSize: 10, width: 80, textAlign: 'right' },
  warnCard: { backgroundColor: '#fdf8e6', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  warnTitle: { fontFamily: F.b, fontSize: 12, color: '#9b5e1a', marginBottom: 8 },
  warnGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  warnCell:  { width: '48%', marginBottom: 4 },
  warnLabel: { fontFamily: F.r, fontSize: 9, color: '#888', marginBottom: 1 },
  warnVal:   { fontFamily: F.b, fontSize: 13, color: '#1a1a1a' },
  mantRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#f0ede8' },
  mantLabel: { fontFamily: F.m, fontSize: 12, color: '#1a1a1a' },
  mantFecha: { fontFamily: F.r, fontSize: 10, color: '#888' },
  badgeOk: { backgroundColor: '#e6f3ec', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20 },
  badgeOkText: { fontFamily: F.b, fontSize: 10, color: '#1e3a2f' },
  cta: { backgroundColor: '#1e3a2f', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  ctaText: { fontFamily: F.m, fontSize: 13, color: '#fff' },
});
