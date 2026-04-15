import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_600SemiBold' };

type BadgeType = 'ok' | 'bajo' | 'alerta';

const INGREDIENTES: { nombre: string; ms: number; precio: number; stock: string; badge: BadgeType }[] = [
  { nombre: 'Heno alfalfa',        ms: 88, precio: 180, stock: '4.2 ton',  badge: 'ok' },
  { nombre: 'Silaje maíz',         ms: 32, precio: 95,  stock: '8.1 ton',  badge: 'ok' },
  { nombre: 'Concentrado engorda', ms: 86, precio: 420, stock: '1.2 ton',  badge: 'bajo' },
  { nombre: 'Afrecho trigo',       ms: 88, precio: 210, stock: '3.8 ton',  badge: 'ok' },
  { nombre: 'Minerales mezcla',    ms: 98, precio: 890, stock: '180 kg',   badge: 'alerta' },
];

const BADGE_COLORS: Record<BadgeType, { bg: string; color: string; label: string }> = {
  ok:     { bg: '#e6f3ec', color: '#1e3a2f', label: 'OK' },
  bajo:   { bg: '#fde8e8', color: '#c0392b', label: 'Bajo' },
  alerta: { bg: '#fdf0e6', color: '#9b5e1a', label: 'Alerta' },
};

export default function IngredientesScreen() {
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
            <Text style={[s.tag, { color: '#1e3a2f' }]}>ALIMENTACIÓN</Text>
          </View>
          <Text style={s.title}>Ingredientes</Text>
          <Text style={s.sub}>Fundo San Pedro · 8 ingredientes</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Stats row */}
          <View style={s.statsRow}>
            <View style={s.sc}><Text style={[s.sv, { color: '#1e3a2f' }]}>8</Text><Text style={s.slab}>Total</Text></View>
            <View style={s.sc}><Text style={[s.sv, { color: '#e74c3c' }]}>2</Text><Text style={s.slab}>Stock bajo</Text></View>
            <View style={s.sc}><Text style={s.sv}>$4.2M</Text><Text style={s.slab}>Costo mes</Text></View>
          </View>

          {/* Header lista */}
          <View style={s.secHdr}>
            <Text style={s.sh}>Lista ingredientes</Text>
            <Text style={s.sl}>+ Nuevo →</Text>
          </View>

          {/* Lista */}
          {INGREDIENTES.map((ing, i) => {
            const b = BADGE_COLORS[ing.badge];
            return (
              <View key={i} style={s.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.lrTitle}>{ing.nombre}</Text>
                  <Text style={s.lrSub}>MS {ing.ms}% · ${ing.precio}/kg · {ing.stock} stock</Text>
                </View>
                <View style={[s.badge, { backgroundColor: b.bg }]}>
                  <Text style={[s.badgeTxt, { color: b.color }]}>{b.label}</Text>
                </View>
              </View>
            );
          })}

          <View style={{ height: 8 }} />
          <TouchableOpacity style={s.cta}>
            <Text style={s.ctaTxt}>+ Agregar ingrediente</Text>
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
    marginHorizontal: 16, marginBottom: 5,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  lrTitle: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  lrSub: { fontFamily: F.regular, fontSize: 10, color: '#888' },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 20, marginLeft: 8 },
  badgeTxt: { fontFamily: F.bold, fontSize: 9 },
  cta: { backgroundColor: '#1e3a2f', borderRadius: 13, paddingVertical: 13, marginHorizontal: 16, alignItems: 'center' },
  ctaTxt: { fontFamily: F.medium, fontSize: 12, color: '#fff' },
});
