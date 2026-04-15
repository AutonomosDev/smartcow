import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_600SemiBold',
};

type Screen = 'individual' | 'sesion';

const DESTETADOS = [
  { diio: '...591022', info: '162 kg · Angus · Potrero recría Norte', badge: 'OK', ok: true },
  { diio: '...591018', info: '171 kg · Angus · Potrero recría Norte', badge: 'OK', ok: true },
  { diio: '...591003', info: '148 kg · Angus · Potrero recría Norte', badge: 'Bajo peso', ok: false },
];

export default function DesteSessionScreen() {
  const navigation = useNavigation<any>();
  const [screen, setScreen] = useState<Screen>('individual');
  const pct = 56;

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>

        <View style={s.hdr}>
          <View style={s.hdrTop}>
            <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
              <ChevronLeft size={14} color="#444" />
            </TouchableOpacity>
            <Text style={s.hdrTag}>{screen === 'individual' ? 'DESTETE' : 'EN PROGRESO'}</Text>
          </View>
          <Text style={s.title}>{screen === 'individual' ? 'Registro destete' : 'Destete lote crianza'}</Text>
          <Text style={s.sub}>{screen === 'individual' ? 'Potrero crianza · 14 abr 2026' : '14 abr 2026 · Jaime'}</Text>
        </View>

        {screen === 'individual' && (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {/* DIIO */}
            <View style={s.card}>
              <Text style={s.fl}>DIIO ESCANEADO</Text>
              <Text style={[s.fv, { color: '#1e3a2f', marginBottom: 5 }]}>276000204591022</Text>
              <View style={s.divider} />
              <View style={s.field}>
                <Text style={s.fl}>IDENTIFICADO COMO</Text>
                <Text style={s.fv}>Ternero · Angus · Nacido 12 oct 2025</Text>
              </View>
              <View style={s.field}>
                <Text style={s.fl}>MADRE</Text>
                <Text style={s.fv}>...581198 · Lote Sur</Text>
              </View>
              <View style={s.field}>
                <Text style={s.fl}>EDAD HOY</Text>
                <Text style={s.fv}>185 días</Text>
              </View>
            </View>

            {/* Pesos */}
            <View style={s.pesoRow}>
              <View style={s.pesoBox}>
                <Text style={s.pesoLabel}>PESO DESTETE</Text>
                <Text style={s.pesoVal}>162 <Text style={s.pesoUnit}>kg</Text></Text>
              </View>
              <View style={s.pesoBox}>
                <Text style={s.pesoLabel}>PESO NACIMIENTO</Text>
                <Text style={s.pesoVal}>38 <Text style={s.pesoUnit}>kg</Text></Text>
              </View>
            </View>

            {/* Fecha + Potrero destino */}
            <View style={s.card}>
              <View style={s.field}>
                <Text style={s.fl}>FECHA DESTETE</Text>
                <Text style={s.fv}>14 abr 2026</Text>
              </View>
              <View style={s.divider} />
              <View style={s.field}>
                <Text style={s.fl}>POTRERO DESTINO</Text>
                <Text style={s.fv}>Potrero recría Norte</Text>
              </View>
            </View>

            <TouchableOpacity style={s.cta} onPress={() => setScreen('sesion')}>
              <Text style={s.ctaTxt}>Guardar destete</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {screen === 'sesion' && (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {/* Hero */}
            <View style={s.hero}>
              <Text style={s.hl}>SESIÓN DESTETE</Text>
              <Text style={s.hv}>Potrero Crianza Sur</Text>
              <Text style={s.hs}>Terneros nacidos oct–nov 2025 · 180+ días</Text>
              <View style={s.hg}>
                <View style={s.hi}><Text style={s.hil}>Destetados</Text><Text style={[s.hiv, { color: '#7ecfa0' }]}>18</Text></View>
                <View style={s.hi}><Text style={s.hil}>Restantes</Text><Text style={s.hiv}>14</Text></View>
                <View style={s.hi}><Text style={s.hil}>Peso prom.</Text><Text style={s.hiv}>158 kg</Text></View>
              </View>
            </View>

            {/* Progress */}
            <View style={s.progCard}>
              <View style={s.progHeader}>
                <Text style={s.progTitle}>Progreso sesión</Text>
                <Text style={s.progPct}>{pct}%</Text>
              </View>
              <View style={s.progTrack}>
                <View style={[s.progFill, { width: `${pct}%` }]} />
              </View>
              <View style={s.progLabels}>
                <Text style={s.progLbl}>0 crías</Text>
                <Text style={s.progLbl}>32 crías total</Text>
              </View>
            </View>

            <View style={s.secHdr}>
              <Text style={s.sh}>Últimos registrados</Text>
              <Text style={s.sl2}>Ver todos →</Text>
            </View>

            {DESTETADOS.map((d, i) => (
              <View key={i} style={s.animalRow}>
                <View>
                  <Text style={s.arDiio}>{d.diio}</Text>
                  <Text style={s.arInfo}>{d.info}</Text>
                </View>
                <View style={[s.badge, d.ok ? s.badgeOk : s.badgeWarn]}>
                  <Text style={[s.badgeTxt, { color: d.ok ? '#1e3a2f' : '#9b5e1a' }]}>{d.badge}</Text>
                </View>
              </View>
            ))}

            <View style={{ height: 10 }} />
            <TouchableOpacity style={s.cta}>
              <Text style={s.ctaTxt}>Cerrar y sincronizar</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
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
  hdrTag: { fontFamily: F.medium, fontSize: 9, color: '#1e3a2f' },
  title: { fontFamily: F.bold, fontSize: 15, color: '#1a1a1a' },
  sub: { fontFamily: F.regular, fontSize: 10, color: '#999' },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 8 },
  fl: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginBottom: 3 },
  fv: { fontFamily: F.bold, fontSize: 13, color: '#1a1a1a' },
  divider: { height: 0.5, backgroundColor: '#f0ede8', marginVertical: 7 },
  field: { marginBottom: 7 },

  pesoRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 8 },
  pesoBox: { flex: 1, backgroundColor: '#fff', borderRadius: 11, padding: 10 },
  pesoLabel: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginBottom: 2 },
  pesoVal: { fontFamily: F.bold, fontSize: 18, color: '#1a1a1a' },
  pesoUnit: { fontFamily: F.regular, fontSize: 10, color: '#888' },

  cta: { backgroundColor: '#1e3a2f', borderRadius: 13, paddingVertical: 13, marginHorizontal: 16, alignItems: 'center', marginBottom: 6 },
  ctaTxt: { fontFamily: F.medium, fontSize: 12, color: '#fff' },

  hero: { backgroundColor: '#1e3a2f', borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 8 },
  hl: { fontFamily: F.bold, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 3 },
  hv: { fontFamily: F.bold, fontSize: 16, color: '#fff', marginBottom: 2 },
  hs: { fontFamily: F.regular, fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  hg: { flexDirection: 'row', gap: 4 },
  hi: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: 6 },
  hil: { fontFamily: F.regular, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 1 },
  hiv: { fontFamily: F.bold, fontSize: 12, color: '#fff' },

  progCard: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 8 },
  progHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  progTitle: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  progPct: { fontFamily: F.regular, fontSize: 11, color: '#888' },
  progTrack: { backgroundColor: '#f0ede8', borderRadius: 4, height: 5, marginVertical: 5 },
  progFill: { height: 5, borderRadius: 4, backgroundColor: '#1e3a2f' },
  progLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progLbl: { fontFamily: F.regular, fontSize: 9, color: '#bbb' },

  secHdr: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 6 },
  sh: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  sl2: { fontFamily: F.regular, fontSize: 10, color: '#1e3a2f' },

  animalRow: { backgroundColor: '#fff', borderRadius: 11, padding: 10, marginHorizontal: 16, marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  arDiio: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  arInfo: { fontFamily: F.regular, fontSize: 10, color: '#888' },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20 },
  badgeOk: { backgroundColor: '#e6f3ec' },
  badgeWarn: { backgroundColor: '#fdf0e6' },
  badgeTxt: { fontFamily: F.bold, fontSize: 9 },
});
