import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_600SemiBold' };

type Sobras = 'Sin sobras' | '1-5%' | '5-10%' | '>10%';
const SOBRAS_OPTS: Sobras[] = ['Sin sobras', '1-5%', '5-10%', '>10%'];

export default function RecorridoSobrasScreen() {
  const navigation = useNavigation<any>();
  const [sobras, setSobras] = useState<Sobras>('Sin sobras');

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>
        <View style={s.hdr}>
          <View style={s.hdrTop}>
            <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
              <ChevronLeft size={13} color="#444" />
            </TouchableOpacity>
            <Text style={[s.tag, { color: '#1e3a2f' }]}>RECORRIDO</Text>
          </View>
          <Text style={s.title}>Descarga corrales</Text>
          <Text style={s.sub}>Batch #3 · Corrales 3 y 4</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Stats */}
          <View style={s.statsRow}>
            <View style={s.sc}><Text style={[s.sv, { color: '#1e3a2f' }]}>1</Text><Text style={s.slab}>Descargado</Text></View>
            <View style={s.sc}><Text style={[s.sv, { color: '#f39c12' }]}>1</Text><Text style={s.slab}>Pendiente</Text></View>
            <View style={s.sc}><Text style={s.sv}>3.890</Text><Text style={s.slab}>kg total</Text></View>
          </View>

          <View style={s.secHdr}>
            <Text style={s.sh}>Corrales del batch</Text>
            <Text style={s.sl}>Batch #3</Text>
          </View>

          {/* Corral 3 — Listo */}
          <View style={s.listRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.lrTitle}>Corral 3 · 38 animales</Text>
              <Text style={s.lrSub}>1.860 kg · Engorda Angus V2</Text>
            </View>
            <View style={[s.badge, { backgroundColor: '#e6f3ec' }]}>
              <Text style={[s.badgeTxt, { color: '#1e3a2f' }]}>Listo ✓</Text>
            </View>
          </View>

          {/* Corral 4 — ACTUAL (con selector sobras) */}
          <View style={s.card}>
            <Text style={s.ct}>Corral 4 · 45 animales — ACTUAL</Text>
            <View style={s.field}>
              <Text style={s.fl}>RACIÓN PLANIFICADA</Text>
              <Text style={s.fv}>2.030 kg · Wagyu Premium</Text>
            </View>
            <View style={s.divider} />
            <Text style={s.fl}>SOBRAS CORRAL 3 (registrar)</Text>
            <View style={s.btnRow}>
              {SOBRAS_OPTS.map((o) => (
                <TouchableOpacity
                  key={o}
                  style={[s.btnSel, sobras === o && s.btnSelActive]}
                  onPress={() => setSobras(o)}
                >
                  <Text style={[s.btnSelTxt, sobras === o && s.btnSelTxtActive]}>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={s.cta}>
            <Text style={s.ctaTxt}>Confirmar descarga C4</Text>
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
  statsRow: { flexDirection: 'row', gap: 6, marginHorizontal: 16, marginBottom: 10 },
  sc: { flex: 1, backgroundColor: '#fff', borderRadius: 11, padding: 8, alignItems: 'center' },
  sv: { fontFamily: F.bold, fontSize: 14, color: '#1a1a1a' },
  slab: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginTop: 1 },
  secHdr: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 6 },
  sh: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  sl: { fontFamily: F.regular, fontSize: 10, color: '#1e3a2f' },
  listRow: {
    backgroundColor: '#fff', borderRadius: 11, padding: 10,
    marginHorizontal: 16, marginBottom: 6,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  lrTitle: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  lrSub: { fontFamily: F.regular, fontSize: 10, color: '#888' },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 20, marginLeft: 8 },
  badgeTxt: { fontFamily: F.bold, fontSize: 9 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 8 },
  ct: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a', marginBottom: 8 },
  fl: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginBottom: 3 },
  fv: { fontFamily: F.bold, fontSize: 13, color: '#1a1a1a' },
  divider: { height: 0.5, backgroundColor: '#f0ede8', marginVertical: 7 },
  field: { marginBottom: 6 },
  btnRow: { flexDirection: 'row', gap: 5, marginTop: 5 },
  btnSel: {
    flex: 1, borderRadius: 8, paddingVertical: 8,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#e0ddd8', backgroundColor: '#fff',
  },
  btnSelActive: { backgroundColor: '#1e3a2f', borderColor: '#1e3a2f' },
  btnSelTxt: { fontFamily: F.medium, fontSize: 10, color: '#888' },
  btnSelTxtActive: { color: '#fff' },
  cta: { backgroundColor: '#1e3a2f', borderRadius: 13, paddingVertical: 13, marginHorizontal: 16, alignItems: 'center' },
  ctaTxt: { fontFamily: F.medium, fontSize: 12, color: '#fff' },
});
