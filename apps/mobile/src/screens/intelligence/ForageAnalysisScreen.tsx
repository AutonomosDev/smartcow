import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { r: 'DMSans_400Regular', m: 'DMSans_500Medium', b: 'DMSans_600SemiBold' };

const PARAMETROS = [
  { label: 'Materia seca',   val: '28%', ref: '32%', color: '#e74c3c', pct: 0.875 },
  { label: 'Proteína bruta', val: '8.2%', ref: '8%',  color: '#1e3a2f', pct: 1.0 },
  { label: 'Energía EM',     val: '2.4',  ref: '2.8', color: '#f39c12', pct: 0.85 },
  { label: 'FDA',            val: '28%',  ref: '30%', color: '#888888', pct: 0.93 },
  { label: 'pH ensilaje',    val: '3.9',  ref: '4.0', color: '#888888', pct: 0.97 },
];

export default function ForageAnalysisScreen() {
  const navigation = useNavigation<any>();

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
          <Text style={s.title}>Análisis forrajero</Text>
          <Text style={s.subtitle}>Ensilaje maíz · Lote Norte</Text>

          {/* Muestra laboratorio */}
          <View style={s.muestraCard}>
            <Text style={s.muestraLabel}>MUESTRA LABORATORIO</Text>
            <Text style={s.muestraTitulo}>Ensilaje maíz — Silo 1</Text>
            <Text style={s.muestraSub}>Análisis: 1 abril 2026 · Lab. Quilamapu</Text>
          </View>

          {/* Parámetros nutricionales */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Parámetros nutricionales</Text>
            <View style={s.divider} />
            {PARAMETROS.map((p) => (
              <View key={p.label} style={s.paramRow}>
                <Text style={s.paramLabel}>{p.label}</Text>
                <View style={s.paramTrack}>
                  <View style={[s.paramFill, { width: `${p.pct * 100}%`, backgroundColor: p.color }]} />
                </View>
                <Text style={[s.paramVal, { color: p.color }]}>{p.val}</Text>
                <Text style={s.paramRef}>{p.ref}</Text>
              </View>
            ))}
          </View>

          {/* Recomendación AgroBrain — verde pálido */}
          <View style={s.recoCard}>
            <Text style={s.recoTitle}>Recomendación AgroBrain</Text>
            <Text style={s.recoBody}>
              Ensilaje con baja MS (28%). Aumentar inclusión de heno o afrecho para compensar déficit energético. Aumentar ración total en 15% o cambiar proveedor de ensilaje. Revisar con Rodrigo antes del miércoles.
            </Text>
          </View>

          {/* CTA */}
          <TouchableOpacity style={s.cta} onPress={() => navigation.goBack()}>
            <Text style={s.ctaText}>Enviar análisis a Rodrigo</Text>
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
  muestraCard: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  muestraLabel:  { fontFamily: F.b, fontSize: 9, color: '#888', letterSpacing: 1, marginBottom: 4 },
  muestraTitulo: { fontFamily: F.b, fontSize: 15, color: '#1a1a1a', marginBottom: 2 },
  muestraSub:    { fontFamily: F.r, fontSize: 11, color: '#888' },
  card: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  cardTitle: { fontFamily: F.b, fontSize: 13, color: '#1a1a1a', marginBottom: 8 },
  divider:   { height: 0.5, backgroundColor: '#f0ede8', marginBottom: 8 },
  paramRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  paramLabel: { fontFamily: F.r, fontSize: 11, color: '#888', width: 100 },
  paramTrack: { flex: 1, height: 6, backgroundColor: '#f0ede8', borderRadius: 3 },
  paramFill:  { height: 6, borderRadius: 3 },
  paramVal: { fontFamily: F.b, fontSize: 11, width: 36, textAlign: 'right' },
  paramRef: { fontFamily: F.r, fontSize: 10, color: '#bbb', width: 30, textAlign: 'right' },
  recoCard: { backgroundColor: '#e6f3ec', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  recoTitle: { fontFamily: F.b, fontSize: 12, color: '#1e3a2f', marginBottom: 6 },
  recoBody:  { fontFamily: F.r, fontSize: 11, color: '#444', lineHeight: 17 },
  cta: { backgroundColor: '#1e3a2f', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  ctaText: { fontFamily: F.m, fontSize: 13, color: '#fff' },
});
