import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_600SemiBold' };

type IngrState = 'done' | 'active' | 'pending';

const ORDEN_CARGA: { orden: number; nombre: string; pct: number; kg: string; state: IngrState }[] = [
  { orden: 1, nombre: 'Silaje maíz',   pct: 100, kg: '✓ 2.100', state: 'done' },
  { orden: 2, nombre: 'Heno alfalfa',  pct: 100, kg: '✓ 740',   state: 'done' },
  { orden: 3, nombre: 'Concentrado',   pct: 50,  kg: '→ 620',   state: 'active' },
  { orden: 4, nombre: 'Afrecho trigo', pct: 0,   kg: '310',     state: 'pending' },
  { orden: 5, nombre: 'Minerales',     pct: 0,   kg: '28',      state: 'pending' },
];

const BAR_COLORS: Record<IngrState, string> = {
  done:    '#7ecfa0',
  active:  '#f39c12',
  pending: '#e0ddd8',
};
const KG_COLORS: Record<IngrState, string> = {
  done:    '#1e3a2f',
  active:  '#f39c12',
  pending: '#bbb',
};

export default function ArmarCarroScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>
        <View style={s.hdr}>
          <View style={s.hdrTop}>
            <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
              <ChevronLeft size={13} color="#444" />
            </TouchableOpacity>
            <Text style={[s.tag, { color: '#1e3a2f' }]}>BATCH #3</Text>
          </View>
          <Text style={s.title}>Armar el carro</Text>
          <Text style={s.sub}>Corrales 3 y 4 · 83 animales</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={s.hero}>
            <Text style={s.hl}>INSTRUCCIONES DE CARGA</Text>
            <Text style={s.hv}>Batch #3 — 14 abr</Text>
            <Text style={s.hs}>Capacidad carro: 4.200 kg · Carga: 3.890 kg</Text>
            <View style={s.hg}>
              <View style={s.hi}><Text style={s.hil}>Cargado</Text><Text style={[s.hiv, { color: '#7ecfa0' }]}>2.840</Text></View>
              <View style={s.hi}><Text style={s.hil}>Restante</Text><Text style={[s.hiv, { color: '#f39c12' }]}>1.050</Text></View>
              <View style={s.hi}><Text style={s.hil}>Uso</Text><Text style={s.hiv}>73%</Text></View>
            </View>
          </View>

          {/* Orden de carga */}
          <View style={s.card}>
            <Text style={s.ct}>Orden de carga</Text>
            {ORDEN_CARGA.map((ing) => (
              <View key={ing.orden} style={s.ingrRow}>
                <Text style={s.ingrName}>{ing.orden}. {ing.nombre}</Text>
                <View style={s.ingrBarWrap}>
                  <View style={[s.ingrBar, { width: `${ing.pct}%` as any, backgroundColor: BAR_COLORS[ing.state] }]} />
                </View>
                <Text style={[s.ingrKg, { color: KG_COLORS[ing.state] }]}>{ing.kg}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 8 }} />
          <TouchableOpacity style={s.cta}>
            <Text style={s.ctaTxt}>Confirmar carga completa</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f1' },
  safe: { flex: 1 },
  scroll: { paddingBottom: 40 },
  hdr: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  hdrTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  back: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#ebe9e3', justifyContent: 'center', alignItems: 'center' },
  tag: { fontFamily: F.medium, fontSize: 9 },
  title: { fontFamily: F.bold, fontSize: 15, color: '#1a1a1a' },
  sub: { fontFamily: F.regular, fontSize: 10, color: '#999' },
  hero: { backgroundColor: '#1e3a2f', borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 8 },
  hl: { fontFamily: F.bold, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  hv: { fontFamily: F.bold, fontSize: 15, color: '#fff', marginBottom: 1 },
  hs: { fontFamily: F.regular, fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  hg: { flexDirection: 'row', gap: 4 },
  hi: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: 6 },
  hil: { fontFamily: F.regular, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 1 },
  hiv: { fontFamily: F.bold, fontSize: 12, color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 8 },
  ct: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a', marginBottom: 8 },
  ingrRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ingrName: { fontFamily: F.medium, fontSize: 10, color: '#1a1a1a', width: 90 },
  ingrBarWrap: { flex: 1, backgroundColor: '#f0ede8', borderRadius: 3, height: 4, marginHorizontal: 6 },
  ingrBar: { height: 4, borderRadius: 3 },
  ingrKg: { fontFamily: F.bold, fontSize: 10, width: 50, textAlign: 'right' },
  cta: { backgroundColor: '#1e3a2f', borderRadius: 13, paddingVertical: 13, marginHorizontal: 16, alignItems: 'center' },
  ctaTxt: { fontFamily: F.medium, fontSize: 12, color: '#fff' },
});
