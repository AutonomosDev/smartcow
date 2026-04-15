import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_600SemiBold' };

const INGREDIENTES = [
  { nombre: 'Silaje maíz',   pct: 55, kg: '8.2 kg' },
  { nombre: 'Heno alfalfa',  pct: 30, kg: '4.4 kg' },
  { nombre: 'Concentrado',   pct: 18, kg: '2.6 kg' },
  { nombre: 'Afrecho trigo', pct: 10, kg: '1.4 kg' },
  { nombre: 'Minerales',     pct: 4,  kg: '0.12 kg' },
];

export default function RecetaTMRScreen() {
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
            <Text style={[s.tag, { color: '#1e3a2f' }]}>RECETA TMR</Text>
          </View>
          <Text style={s.title}>Engorda Angus V2</Text>
          <Text style={s.sub}>Receta activa · 3 corrales · Actualizada hoy</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={s.hero}>
            <Text style={s.hl}>RESUMEN RECETA</Text>
            <Text style={s.hv}>Engorda Angus V2</Text>
            <Text style={s.hs}>12.4 kg MS/animal/día · $1.82/kg MS</Text>
            <View style={s.hg}>
              <View style={s.hi}><Text style={s.hil}>MS objetivo</Text><Text style={[s.hiv, { color: '#7ecfa0' }]}>12.4 kg</Text></View>
              <View style={s.hi}><Text style={s.hil}>Costo/animal</Text><Text style={s.hiv}>$2.260</Text></View>
              <View style={s.hi}><Text style={s.hil}>Versión</Text><Text style={s.hiv}>V2.3</Text></View>
            </View>
          </View>

          {/* Composición */}
          <View style={s.card}>
            <Text style={s.ct}>Composición por ingrediente</Text>
            {INGREDIENTES.map((ing, i) => (
              <View key={i} style={s.ingrRow}>
                <Text style={s.ingrName}>{ing.nombre}</Text>
                <View style={s.ingrBarWrap}>
                  <View style={[s.ingrBar, { width: `${ing.pct}%` as any }]} />
                </View>
                <Text style={s.ingrKg}>{ing.kg}</Text>
              </View>
            ))}
          </View>

          {/* Botón secundario */}
          <TouchableOpacity style={s.ctaSecondary}>
            <Text style={s.ctaSecondaryTxt}>Ver historial versiones</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.cta}>
            <Text style={s.ctaTxt}>Editar receta</Text>
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
  ingrRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  ingrName: { fontFamily: F.medium, fontSize: 11, color: '#1a1a1a', width: 90 },
  ingrBarWrap: { flex: 1, backgroundColor: '#f0ede8', borderRadius: 3, height: 4, marginHorizontal: 6 },
  ingrBar: { height: 4, borderRadius: 3, backgroundColor: '#1e3a2f' },
  ingrKg: { fontFamily: F.bold, fontSize: 10, color: '#1e3a2f', width: 46, textAlign: 'right' },
  ctaSecondary: {
    backgroundColor: '#fff', borderRadius: 13, paddingVertical: 12,
    marginHorizontal: 16, alignItems: 'center', marginBottom: 6,
    borderWidth: 1, borderColor: '#e0ddd8',
  },
  ctaSecondaryTxt: { fontFamily: F.medium, fontSize: 12, color: '#1a1a1a' },
  cta: { backgroundColor: '#1e3a2f', borderRadius: 13, paddingVertical: 13, marginHorizontal: 16, alignItems: 'center' },
  ctaTxt: { fontFamily: F.medium, fontSize: 12, color: '#fff' },
});
