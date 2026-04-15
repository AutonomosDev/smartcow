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

type Intensidad = 'Celo claro' | 'Celo dudoso';
type Obs = 'Monta activa · inquieta' | 'Inquieta sola' | 'Sin signos claros';

export default function CeloRegistroScreen() {
  const navigation = useNavigation<any>();
  const [intensidad, setIntensidad] = useState<Intensidad>('Celo claro');
  const [obs, setObs] = useState<Obs>('Monta activa · inquieta');

  const INTENSIDADES: Intensidad[] = ['Celo claro', 'Celo dudoso'];
  const OBS_LIST: Obs[] = ['Monta activa · inquieta', 'Inquieta sola', 'Sin signos claros'];

  // Cálculo de ventana IA (+12h y +18h de 07:30 AM = 19:30–01:30)
  const ventanaIA = '14 abr · 19:30 – 01:30 hrs';

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
            <Text style={[s.hdrTag, { color: '#f39c12' }]}>CELO</Text>
          </View>
          <Text style={s.title}>Registro celo</Text>
          <Text style={s.sub}>Potrero Sur · 14 abr 2026</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* DIIO Card */}
          <View style={s.card}>
            <Text style={s.fl}>DIIO ESCANEADO</Text>
            <Text style={[s.fv, { color: '#1e3a2f', marginBottom: 4 }]}>276000204581198</Text>
            <View style={s.divider} />
            <View style={s.field}>
              <Text style={s.fl}>IDENTIFICADA COMO</Text>
              <Text style={s.fv}>Vaca · Angus · 4 años · Lote Sur</Text>
            </View>
            <View style={s.field}>
              <Text style={s.fl}>ÚLTIMO SERVICIO</Text>
              <Text style={s.fv}>Sin registro previo</Text>
            </View>
          </View>

          {/* Intensidad */}
          <View style={s.card}>
            <Text style={s.ct}>Intensidad del celo</Text>
            <View style={s.btnRow}>
              {INTENSIDADES.map((i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.btnSel, intensidad === i && s.btnSelActive]}
                  onPress={() => setIntensidad(i)}
                >
                  <Text style={[s.btnSelTxt, intensidad === i && s.btnSelTxtActive]}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.divider} />
            <View style={s.field}>
              <Text style={s.fl}>FECHA Y HORA DETECCIÓN</Text>
              <Text style={s.fv}>14 abr 2026 · 07:30 AM</Text>
            </View>
            <View style={s.divider} />
            <Text style={[s.fl, { marginBottom: 5 }]}>OBSERVACIÓN</Text>
            <View style={s.btnCol}>
              {OBS_LIST.map((o) => (
                <TouchableOpacity
                  key={o}
                  style={[s.btnSel, { marginBottom: 4 }, obs === o && s.btnSelActive]}
                  onPress={() => setObs(o)}
                >
                  <Text style={[s.btnSelTxt, obs === o && s.btnSelTxtActive]}>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Ventana IA sugerida */}
          <View style={[s.card, { backgroundColor: '#fdf0e6' }]}>
            <Text style={s.iaTitle}>IA sugerida: {ventanaIA}</Text>
            <Text style={s.iaSub}>Inseminar 12–18 hrs después de detección</Text>
          </View>

          <TouchableOpacity style={s.cta}>
            <Text style={s.ctaTxt}>Guardar celo</Text>
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
  hdrTag: { fontFamily: F.medium, fontSize: 9 },
  title: { fontFamily: F.bold, fontSize: 15, color: '#1a1a1a' },
  sub: { fontFamily: F.regular, fontSize: 10, color: '#999' },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 8 },
  ct: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a', marginBottom: 8 },
  fl: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginBottom: 3 },
  fv: { fontFamily: F.bold, fontSize: 13, color: '#1a1a1a' },
  divider: { height: 0.5, backgroundColor: '#f0ede8', marginVertical: 7 },
  field: { marginBottom: 7 },

  btnRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  btnCol: { gap: 4 },
  btnSel: {
    flex: 1, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#e0ddd8', backgroundColor: '#fff',
  },
  btnSelActive: { backgroundColor: '#1e3a2f', borderColor: '#1e3a2f' },
  btnSelTxt: { fontFamily: F.medium, fontSize: 11, color: '#888' },
  btnSelTxtActive: { color: '#fff' },

  iaTitle: { fontFamily: F.bold, fontSize: 10, color: '#9b5e1a', marginBottom: 2 },
  iaSub: { fontFamily: F.regular, fontSize: 9, color: '#9b5e1a' },

  cta: { backgroundColor: '#1e3a2f', borderRadius: 13, paddingVertical: 13, marginHorizontal: 16, alignItems: 'center', marginBottom: 6 },
  ctaTxt: { fontFamily: F.medium, fontSize: 12, color: '#fff' },
});
