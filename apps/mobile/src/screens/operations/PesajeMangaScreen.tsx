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

const CC_OPTIONS = ['CC 1-2', 'CC 3', 'CC 4-5'];

const PESAJES = [
  { diio: '...4581234', peso: '342 kg', cc: 'CC 3', hora: '08:41', gdp: '+1.3 kg/d', ok: true },
  { diio: '...4581198', peso: '387 kg', cc: 'CC 3', hora: '08:39', gdp: '+1.8 kg/d', ok: true },
  { diio: '...4581102', peso: '301 kg', cc: 'CC 2', hora: '08:37', gdp: '+0.8 kg/d', ok: false },
  { diio: '...4580991', peso: '412 kg', cc: 'CC 4', hora: '08:35', gdp: '+2.1 kg/d', ok: true },
];

type Screen = 'sesion' | 'resumen';

export default function PesajeMangaScreen() {
  const navigation = useNavigation<any>();
  const [screen, setScreen] = useState<Screen>('sesion');
  const [ccSel, setCcSel] = useState<string>('CC 3');

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>

        {/* Header */}
        <View style={s.hdr}>
          <View style={s.hdrTop}>
            <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
              <ChevronLeft size={14} color="#444" />
            </TouchableOpacity>
            <Text style={s.hdrTag}>{screen === 'sesion' ? 'Tru-Test XRS2i' : 'EN PROGRESO'}</Text>
          </View>
          <Text style={s.title}>{screen === 'sesion' ? 'Pesaje en manga' : 'Bastón · Toma de datos'}</Text>
          <Text style={s.sub}>{screen === 'sesion' ? 'Lote Norte · 110 Angus' : 'Lote Norte · Manga principal'}</Text>
        </View>

        {screen === 'sesion' && (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {/* BT Indicator */}
            <View style={s.btRow}>
              <View style={s.btDot} />
              <Text style={s.btTxt}>Bastón conectado · Balanza conectada</Text>
            </View>

            {/* Hero */}
            <View style={s.hero}>
              <Text style={s.hl}>SESIÓN ACTIVA</Text>
              <Text style={s.hv}>Manga Norte</Text>
              <Text style={s.hs}>Lunes 14 abr · 08:14 AM · Jaime</Text>
              <View style={s.hg}>
                <View style={s.hi}><Text style={s.hil}>Pesados</Text><Text style={[s.hiv, { color: '#7ecfa0' }]}>42</Text></View>
                <View style={s.hi}><Text style={s.hil}>Restantes</Text><Text style={[s.hiv, { color: '#f39c12' }]}>68</Text></View>
                <View style={s.hi}><Text style={s.hil}>GDP prom.</Text><Text style={s.hiv}>1.4 kg</Text></View>
              </View>
            </View>

            {/* DIIO Box */}
            <View style={s.diioBox}>
              <Text style={s.diioLabel}>DIIO ESCANEADO</Text>
              <Text style={s.diioVal}>276000204581234</Text>
              <Text style={s.diioSub}>Angus · Macho · Lote Norte · Ingreso 15 feb</Text>
            </View>

            {/* Peso Box */}
            <View style={s.pesoBox}>
              <Text style={s.pesoLabel}>PESO ACTUAL (BALANZA)</Text>
              <Text style={s.pesoVal}>342 kg</Text>
              <Text style={s.pesoSub}>Anterior: 318 kg · +24 kg en 18 días · GDP 1.3 kg/día</Text>
            </View>

            {/* CC Buttons */}
            <View style={s.btn3}>
              {CC_OPTIONS.map((cc) => (
                <TouchableOpacity
                  key={cc}
                  style={[s.b3, ccSel === cc && s.b3Active]}
                  onPress={() => setCcSel(cc)}
                >
                  <Text style={[s.b3Txt, ccSel === cc && s.b3TxtActive]}>{cc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={s.cta} onPress={() => setScreen('resumen')}>
              <Text style={s.ctaTxt}>Guardar y escanear siguiente</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {screen === 'resumen' && (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {/* Stats row */}
            <View style={s.statsRow}>
              <View style={s.statCard}><Text style={[s.statVal, { color: '#1e3a2f' }]}>42</Text><Text style={s.statLbl}>Pesados</Text></View>
              <View style={s.statCard}><Text style={[s.statVal, { color: '#f39c12' }]}>68</Text><Text style={s.statLbl}>Pendientes</Text></View>
              <View style={s.statCard}><Text style={s.statVal}>342</Text><Text style={s.statLbl}>Último kg</Text></View>
            </View>

            {/* Estado sesión */}
            <View style={s.card}>
              <Text style={s.ct}>Estado sesión</Text>
              {[
                { label: 'Bastón XRS2i', val: 'Conectado ✓', ok: true },
                { label: 'Balanza Tru-Test', val: 'Conectada ✓', ok: true },
                { label: 'Señal campo', val: 'Sin señal', ok: false },
                { label: 'Datos guardados', val: 'Local · sync pendiente', ok: null },
              ].map((row, i, arr) => (
                <View key={i}>
                  {i > 0 && <View style={s.divider} />}
                  <View style={s.stateRow}>
                    <Text style={s.rl}>{row.label}</Text>
                    <Text style={[s.rv, row.ok === true ? { color: '#1e3a2f' } : row.ok === false ? { color: '#f39c12' } : {}]}>{row.val}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Últimos pesajes */}
            <View style={s.secHdr}>
              <Text style={s.sh}>Últimos pesajes</Text>
              <Text style={s.sl2}>Ver todos →</Text>
            </View>

            {PESAJES.map((p, i) => (
              <View key={i} style={s.animalRow}>
                <View>
                  <Text style={s.arDiio}>{p.diio}</Text>
                  <Text style={s.arInfo}>{p.peso} · {p.cc} · {p.hora}</Text>
                </View>
                <Text style={[s.gdp, !p.ok && { color: '#e74c3c' }]}>{p.gdp}</Text>
              </View>
            ))}

            <View style={{ height: 10 }} />
            <TouchableOpacity style={[s.cta, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0ddd8', marginBottom: 8 }]}>
              <Text style={[s.ctaTxt, { color: '#1a1a1a' }]}>Pausar sesión</Text>
            </TouchableOpacity>
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
  hdrTag: { fontFamily: F.medium, fontSize: 9, color: '#888' },
  title: { fontFamily: F.bold, fontSize: 15, color: '#1a1a1a' },
  sub: { fontFamily: F.regular, fontSize: 10, color: '#999' },

  btRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, marginTop: 6, marginBottom: 4 },
  btDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1e3a2f' },
  btTxt: { fontFamily: F.medium, fontSize: 10, color: '#1e3a2f' },

  hero: { backgroundColor: '#1e3a2f', borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 8 },
  hl: { fontFamily: F.bold, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 3 },
  hv: { fontFamily: F.bold, fontSize: 18, color: '#fff', marginBottom: 2 },
  hs: { fontFamily: F.regular, fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  hg: { flexDirection: 'row', gap: 4 },
  hi: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: 6 },
  hil: { fontFamily: F.regular, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 1 },
  hiv: { fontFamily: F.bold, fontSize: 12, color: '#fff' },

  diioBox: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 8 },
  diioLabel: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginBottom: 4 },
  diioVal: { fontFamily: F.bold, fontSize: 20, color: '#1a1a1a', letterSpacing: 1, marginBottom: 2 },
  diioSub: { fontFamily: F.regular, fontSize: 10, color: '#888' },

  pesoBox: { backgroundColor: '#1e3a2f', borderRadius: 14, padding: 13, marginHorizontal: 16, marginBottom: 8 },
  pesoLabel: { fontFamily: F.regular, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  pesoVal: { fontFamily: F.bold, fontSize: 32, color: '#fff', lineHeight: 36 },
  pesoSub: { fontFamily: F.regular, fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  btn3: { flexDirection: 'row', gap: 6, marginHorizontal: 16, marginBottom: 8 },
  b3: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#e0ddd8', backgroundColor: '#fff' },
  b3Active: { backgroundColor: '#1e3a2f', borderColor: '#1e3a2f' },
  b3Txt: { fontFamily: F.medium, fontSize: 10, color: '#888' },
  b3TxtActive: { color: '#fff' },

  cta: { backgroundColor: '#1e3a2f', borderRadius: 13, paddingVertical: 13, marginHorizontal: 16, alignItems: 'center', marginBottom: 6 },
  ctaTxt: { fontFamily: F.medium, fontSize: 12, color: '#fff' },

  statsRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 8, marginTop: 4 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 11, paddingVertical: 8, alignItems: 'center' },
  statVal: { fontFamily: F.bold, fontSize: 14, color: '#1a1a1a' },
  statLbl: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginTop: 1 },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 8 },
  ct: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a', marginBottom: 7 },
  divider: { height: 0.5, backgroundColor: '#f0ede8', marginVertical: 6 },
  stateRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rl: { fontFamily: F.regular, fontSize: 10, color: '#888' },
  rv: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },

  secHdr: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 6 },
  sh: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  sl2: { fontFamily: F.regular, fontSize: 10, color: '#1e3a2f' },

  animalRow: { backgroundColor: '#fff', borderRadius: 11, padding: 10, marginHorizontal: 16, marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  arDiio: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  arInfo: { fontFamily: F.regular, fontSize: 10, color: '#888' },
  gdp: { fontFamily: F.bold, fontSize: 11, color: '#1e3a2f' },
});
