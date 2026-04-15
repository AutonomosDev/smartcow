import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_600SemiBold' };

const escaneados = 38;
const esperados  = 42;
const faltantes  = esperados - escaneados;
const pct        = Math.round((escaneados / esperados) * 100);

const MISSING_DIIOS = ['...581219', '...581207', '...581198', '...581187'];
const RECIENTES = [
  { diio: '...581234', info: 'Angus · 342 kg · 08:41' },
  { diio: '...581228', info: 'Angus · 387 kg · 08:40' },
];

export default function ConteoCorralScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>

        <View style={s.hdr}>
          <View style={s.hdrTop}>
            <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
              <ChevronLeft size={14} color="#444" />
            </TouchableOpacity>
            <Text style={s.hdrTag}>CONTEO</Text>
          </View>
          <Text style={s.title}>Conteo corral</Text>
          <Text style={s.sub}>Corral 3 · 14 abr 2026</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <View style={s.hero}>
            <Text style={s.hl}>SESIÓN CONTEO</Text>
            <Text style={s.hv}>Corral 3</Text>
            <Text style={s.hs}>14 abr · 08:30 AM · Jaime</Text>
            <View style={s.hg}>
              <View style={s.hi}><Text style={s.hil}>Escaneados</Text><Text style={[s.hiv, { color: '#7ecfa0' }]}>{escaneados}</Text></View>
              <View style={s.hi}><Text style={s.hil}>Esperados</Text><Text style={s.hiv}>{esperados}</Text></View>
              <View style={s.hi}><Text style={s.hil}>Faltantes</Text><Text style={[s.hiv, { color: '#ff6b6b' }]}>{faltantes}</Text></View>
            </View>
          </View>

          {/* Progreso */}
          <View style={s.progCard}>
            <View style={s.progHdr}>
              <Text style={s.progLbl}>Progreso escaneo</Text>
              <Text style={s.progPct}>{pct}%</Text>
            </View>
            <View style={s.track}>
              <View style={[s.fill, { width: `${pct}%` as any }]} />
            </View>
            <View style={s.progFooter}>
              <Text style={s.progMin}>0</Text>
              <Text style={s.progMin}>{esperados} animales</Text>
            </View>
          </View>

          {/* Alerta faltantes */}
          <View style={s.alertCard}>
            <Text style={s.alertTitle}>{faltantes} DIIOs no encontrados</Text>
            <Text style={s.alertDiios}>{MISSING_DIIOS.join(' · ')}</Text>
            <Text style={s.alertSub}>Último conteo: 12 abr — estaban presentes</Text>
          </View>

          {/* Lista recientes */}
          <View style={s.secHdr}>
            <Text style={s.secTitle}>Escaneados hoy</Text>
            <Text style={s.secLink}>{escaneados} animales</Text>
          </View>
          {RECIENTES.map((a, i) => (
            <View key={i} style={s.animalRow}>
              <View>
                <Text style={s.arDiio}>{a.diio}</Text>
                <Text style={s.arInfo}>{a.info}</Text>
              </View>
              <View style={s.badge}><Text style={s.badgeTxt}>OK</Text></View>
            </View>
          ))}

          <View style={{ height: 5 }} />
          <TouchableOpacity style={s.cta}><Text style={s.ctaTxt}>Cerrar y sincronizar</Text></TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f1' },
  safe: { flex: 1 },
  scroll: { paddingBottom: 40 },
  hdr: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 4 },
  hdrTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  back: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#ebe9e3', justifyContent: 'center', alignItems: 'center' },
  hdrTag: { fontFamily: F.medium, fontSize: 9, color: '#1e3a2f' },
  title: { fontFamily: F.bold, fontSize: 14, color: '#1a1a1a' },
  sub: { fontFamily: F.regular, fontSize: 10, color: '#999' },
  hero: { backgroundColor: '#1e3a2f', borderRadius: 12, padding: 10, marginHorizontal: 10, marginBottom: 6 },
  hl: { fontFamily: F.bold, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 3 },
  hv: { fontFamily: F.bold, fontSize: 15, color: '#fff', marginBottom: 2 },
  hs: { fontFamily: F.regular, fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 7 },
  hg: { flexDirection: 'row', gap: 4 },
  hi: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: 5 },
  hil: { fontFamily: F.regular, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 1 },
  hiv: { fontFamily: F.bold, fontSize: 12, color: '#fff' },
  progCard: { backgroundColor: '#fff', borderRadius: 11, padding: 9, marginHorizontal: 10, marginBottom: 6 },
  progHdr: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  progLbl: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  progPct: { fontFamily: F.regular, fontSize: 11, color: '#888' },
  track: { backgroundColor: '#f0ede8', borderRadius: 4, height: 5, marginVertical: 5 },
  fill:  { height: 5, borderRadius: 4, backgroundColor: '#1e3a2f' },
  progFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  progMin: { fontFamily: F.regular, fontSize: 9, color: '#bbb' },
  alertCard: { backgroundColor: '#fde8e8', borderRadius: 11, padding: 9, marginHorizontal: 10, marginBottom: 6 },
  alertTitle: { fontFamily: F.bold, fontSize: 11, color: '#c0392b', marginBottom: 4 },
  alertDiios: { fontFamily: F.regular, fontSize: 10, color: '#c0392b', marginBottom: 4 },
  alertSub: { fontFamily: F.regular, fontSize: 9, color: '#c0392b' },
  secHdr: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 4 },
  secTitle: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  secLink: { fontFamily: F.regular, fontSize: 10, color: '#1e3a2f' },
  animalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 9, paddingVertical: 7, paddingHorizontal: 9, marginHorizontal: 10, marginBottom: 4 },
  arDiio: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  arInfo: { fontFamily: F.regular, fontSize: 10, color: '#888' },
  badge: { backgroundColor: '#e6f3ec', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 20 },
  badgeTxt: { fontFamily: F.bold, fontSize: 9, color: '#1e3a2f' },
  cta: { backgroundColor: '#1e3a2f', borderRadius: 10, padding: 10, marginHorizontal: 10, alignItems: 'center' },
  ctaTxt: { fontFamily: F.medium, fontSize: 12, color: '#fff' },
});
