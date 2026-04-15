import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_600SemiBold' };

type CorralStatus = 'done' | 'pending';

const CORRALES: { nombre: string; status: CorralStatus; animales: number; receta: string; hora?: string; fill: number }[] = [
  { nombre: 'Corral 1', status: 'done',    animales: 42, receta: 'Engorda Angus V2', hora: '8:14', fill: 100 },
  { nombre: 'Corral 2', status: 'done',    animales: 38, receta: 'Engorda Angus V2', hora: '8:32', fill: 100 },
  { nombre: 'Corral 3', status: 'pending', animales: 38, receta: 'Engorda Angus V2', fill: 0 },
  { nombre: 'Corral 4', status: 'pending', animales: 45, receta: 'Wagyu Premium',     fill: 0 },
];

export default function CorralesScreen() {
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
            <Text style={[s.tag, { color: '#1e3a2f' }]}>CORRALES</Text>
          </View>
          <Text style={s.title}>Corrales alimentación</Text>
          <Text style={s.sub}>11 corrales · 2 pasadas diarias</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Stats */}
          <View style={s.statsRow}>
            <View style={s.sc}><Text style={s.sv}>440</Text><Text style={s.slab}>Animales</Text></View>
            <View style={s.sc}><Text style={[s.sv, { color: '#1e3a2f' }]}>9</Text><Text style={s.slab}>Alimentados</Text></View>
            <View style={s.sc}><Text style={[s.sv, { color: '#f39c12' }]}>2</Text><Text style={s.slab}>Pendientes</Text></View>
          </View>

          <View style={s.secHdr}>
            <Text style={s.sh}>Corrales hoy</Text>
            <Text style={s.sl}>Ver todos →</Text>
          </View>

          {CORRALES.map((c, i) => (
            <View key={i} style={s.corralCard}>
              <View style={s.crTop}>
                <Text style={s.crName}>{c.nombre}</Text>
                <Text style={[s.crStatus, { color: c.status === 'done' ? '#1e3a2f' : '#f39c12' }]}>
                  {c.status === 'done' ? 'Alimentado ✓' : 'Pendiente'}
                </Text>
              </View>
              <View style={s.progTrack}>
                <View style={[s.progFill, { width: `${c.fill}%` as any }]} />
              </View>
              <View style={s.crBottom}>
                <Text style={s.crB}>{c.animales} animales · {c.receta}</Text>
                <Text style={s.crB}>{c.hora ?? '—'}</Text>
              </View>
            </View>
          ))}

          <View style={{ height: 8 }} />
          <TouchableOpacity style={s.cta}>
            <Text style={s.ctaTxt}>+ Agregar corral</Text>
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
  corralCard: { backgroundColor: '#fff', borderRadius: 11, padding: 10, marginHorizontal: 16, marginBottom: 5 },
  crTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  crName: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  crStatus: { fontFamily: F.bold, fontSize: 9 },
  progTrack: { backgroundColor: '#f0ede8', borderRadius: 3, height: 3, marginBottom: 3 },
  progFill: { height: 3, borderRadius: 3, backgroundColor: '#1e3a2f' },
  crBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  crB: { fontFamily: F.regular, fontSize: 9, color: '#bbb' },
  cta: { backgroundColor: '#1e3a2f', borderRadius: 13, paddingVertical: 13, marginHorizontal: 16, alignItems: 'center' },
  ctaTxt: { fontFamily: F.medium, fontSize: 12, color: '#fff' },
});
