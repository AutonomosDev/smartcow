import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_600SemiBold' };

type Estado = 'OK' | 'Bajo' | 'Vacío' | 'Barro';
type InfraKey = 'comedero' | 'bebedero' | 'piso';

const ESTADO_STYLE: Record<Estado, { bg: string; color: string }> = {
  OK:    { bg: '#e6f3ec', color: '#1e3a2f' },
  Bajo:  { bg: '#fdf0e6', color: '#9b5e1a' },
  Vacío: { bg: '#fde8e8', color: '#c0392b' },
  Barro: { bg: '#fde8e8', color: '#c0392b' },
};

type Corral = { nombre: string; animales: number; comedero: Estado; bebedero: Estado; piso: Estado };

const CORRALES_INIT: Corral[] = [
  { nombre: 'Corral 1', animales: 42, comedero: 'OK',    bebedero: 'OK',   piso: 'OK'   },
  { nombre: 'Corral 2', animales: 38, comedero: 'OK',    bebedero: 'Bajo', piso: 'OK'   },
  { nombre: 'Corral 3', animales: 38, comedero: 'Vacío', bebedero: 'OK',   piso: 'Barro'},
  { nombre: 'Corral 4', animales: 45, comedero: 'OK',    bebedero: 'OK',   piso: 'OK'   },
  { nombre: 'Corral 5', animales: 40, comedero: 'OK',    bebedero: 'Vacío',piso: 'OK'   },
];

const ESTADOS_CICLO: Record<InfraKey, Estado[]> = {
  comedero: ['OK', 'Bajo', 'Vacío'],
  bebedero: ['OK', 'Bajo', 'Vacío'],
  piso:     ['OK', 'Barro'],
};

function calcStats(corrales: Corral[]) {
  let ok = 0, atencion = 0, urgente = 0;
  corrales.forEach((c) => {
    const bad = [c.comedero, c.bebedero, c.piso].some((e) => e === 'Vacío' || e === 'Barro');
    const warn = [c.comedero, c.bebedero, c.piso].some((e) => e === 'Bajo');
    if (bad) urgente++;
    else if (warn) atencion++;
    else ok++;
  });
  return { ok, atencion, urgente };
}

export default function EstadoCorralesScreen() {
  const navigation = useNavigation<any>();
  const [corrales, setCorrales] = useState<Corral[]>(CORRALES_INIT);
  const stats = calcStats(corrales);

  function cycleEstado(corralIdx: number, key: InfraKey) {
    setCorrales((prev) => {
      const next = [...prev];
      const c = { ...next[corralIdx] };
      const ciclo = ESTADOS_CICLO[key];
      const curr = c[key] as Estado;
      const i = ciclo.indexOf(curr);
      c[key] = ciclo[(i + 1) % ciclo.length] as Estado;
      next[corralIdx] = c;
      return next;
    });
  }

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>

        <View style={s.hdr}>
          <View style={s.hdrTop}>
            <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
              <ChevronLeft size={14} color="#444" />
            </TouchableOpacity>
            <Text style={s.hdrTag}>INFRAESTRUCTURA</Text>
          </View>
          <Text style={s.title}>Estado corrales</Text>
          <Text style={s.sub}>Feedlot · 14 abr 2026 · Jaime</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Stats */}
          <View style={s.statsRow}>
            <View style={s.stat}><Text style={[s.sv, { color: '#1e3a2f' }]}>{stats.ok}</Text><Text style={s.sl}>OK</Text></View>
            <View style={s.stat}><Text style={[s.sv, { color: '#f39c12' }]}>{stats.atencion}</Text><Text style={s.sl}>Atención</Text></View>
            <View style={s.stat}><Text style={[s.sv, { color: '#e74c3c' }]}>{stats.urgente}</Text><Text style={s.sl}>Urgente</Text></View>
          </View>

          {/* Sección */}
          <View style={s.secHdr}>
            <Text style={s.secTitle}>Corrales</Text>
            <Text style={s.secSub}>{corrales.length} total</Text>
          </View>

          {/* Filas de corrales */}
          {corrales.map((c, i) => (
            <View key={i} style={s.infraRow}>
              <View style={s.infraLeft}>
                <Text style={s.infraName}>{c.nombre} · {c.animales} animales</Text>
                <Text style={s.infraSub}>Comedero · Bebedero · Piso</Text>
              </View>
              <View style={s.infraBtns}>
                {(['comedero', 'bebedero', 'piso'] as InfraKey[]).map((key) => {
                  const est = c[key] as Estado;
                  const st = ESTADO_STYLE[est];
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[s.infraBtn, { backgroundColor: st.bg, borderColor: st.bg }]}
                      onPress={() => cycleEstado(i, key)}
                    >
                      <Text style={[s.infraBtnTxt, { color: st.color }]}>{est}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          <View style={{ height: 5 }} />
          <TouchableOpacity style={s.cta}><Text style={s.ctaTxt}>Guardar estado</Text></TouchableOpacity>

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
  statsRow: { flexDirection: 'row', gap: 5, marginHorizontal: 10, marginBottom: 6 },
  stat: { flex: 1, backgroundColor: '#fff', borderRadius: 9, padding: 7, alignItems: 'center' },
  sv: { fontFamily: F.bold, fontSize: 13, color: '#1a1a1a' },
  sl: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginTop: 1 },
  secHdr: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 4 },
  secTitle: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  secSub: { fontFamily: F.regular, fontSize: 10, color: '#1e3a2f' },
  infraRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 9, paddingVertical: 8, paddingHorizontal: 10, marginHorizontal: 10, marginBottom: 4 },
  infraLeft: {},
  infraName: { fontFamily: F.bold, fontSize: 10, color: '#1a1a1a' },
  infraSub: { fontFamily: F.regular, fontSize: 9, color: '#888' },
  infraBtns: { flexDirection: 'row', gap: 4 },
  infraBtn: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 20, borderWidth: 1.5 },
  infraBtnTxt: { fontFamily: F.bold, fontSize: 9 },
  cta: { backgroundColor: '#1e3a2f', borderRadius: 10, padding: 10, marginHorizontal: 10, alignItems: 'center' },
  ctaTxt: { fontFamily: F.medium, fontSize: 12, color: '#fff' },
});
