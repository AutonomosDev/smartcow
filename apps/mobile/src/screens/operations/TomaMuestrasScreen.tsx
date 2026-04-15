import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_600SemiBold' };

type TipoMuestra = 'Sangre' | 'Heces' | 'Orina' | 'Hisopo';
type Destino = 'Lab local' | 'SAG' | 'U. Chile' | 'Otro';

const TIPOS_ROW1: TipoMuestra[] = ['Sangre', 'Heces'];
const TIPOS_ROW2: TipoMuestra[] = ['Orina', 'Hisopo'];
const DESTINOS: Destino[] = ['Lab local', 'SAG', 'U. Chile', 'Otro'];

const ULTIMAS = [
  { diio: '...581234', info: 'Sangre · Lab local · 08:41', estado: 'Registrada' },
  { diio: '...581198', info: 'Heces · SAG · 08:35', estado: 'Registrada' },
];

export default function TomaMuestrasScreen() {
  const navigation = useNavigation<any>();
  const [tipo, setTipo] = useState<TipoMuestra>('Sangre');
  const [destino, setDestino] = useState<Destino>('Lab local');

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>

        <View style={s.hdr}>
          <View style={s.hdrTop}>
            <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
              <ChevronLeft size={14} color="#444" />
            </TouchableOpacity>
            <Text style={s.hdrTag}>MUESTRAS</Text>
          </View>
          <Text style={s.title}>Toma de muestras</Text>
          <Text style={s.sub}>Manga · 14 abr 2026 · Dr. Muñoz</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <View style={s.hero}>
            <Text style={s.hl}>SESIÓN MUESTRAS</Text>
            <Text style={s.hv}>Manga Norte</Text>
            <Text style={s.hs}>14 abr · 08:00 AM · Dr. Muñoz</Text>
            <View style={s.hg}>
              <View style={s.hi}><Text style={s.hil}>Tomadas</Text><Text style={[s.hiv, { color: '#7ecfa0' }]}>12</Text></View>
              <View style={s.hi}><Text style={s.hil}>Pendientes</Text><Text style={s.hiv}>8</Text></View>
              <View style={s.hi}><Text style={s.hil}>Lote</Text><Text style={s.hiv}>Norte</Text></View>
            </View>
          </View>

          {/* DIIO Card */}
          <View style={s.card}>
            <Text style={s.fl}>DIIO ESCANEADO</Text>
            <Text style={[s.fv, { color: '#1e3a2f', marginBottom: 4 }]}>276000204581228</Text>
            <View style={s.divider} />
            <View style={s.field}><Text style={s.fl}>IDENTIFICADO COMO</Text><Text style={s.fv}>Vaca · Angus · 4 años · Lote Norte</Text></View>
          </View>

          {/* Tipo de muestra */}
          <View style={s.card}>
            <Text style={s.ct}>Tipo de muestra</Text>
            <View style={s.btnRow}>
              {TIPOS_ROW1.map((t) => (
                <TouchableOpacity key={t} style={[s.btnSel, tipo === t && s.btnActive]} onPress={() => setTipo(t)}>
                  <Text style={[s.btnTxt, tipo === t && s.btnTxtActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.btnRow}>
              {TIPOS_ROW2.map((t) => (
                <TouchableOpacity key={t} style={[s.btnSel, tipo === t && s.btnActive]} onPress={() => setTipo(t)}>
                  <Text style={[s.btnTxt, tipo === t && s.btnTxtActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.divider} />
            <View style={s.field}><Text style={s.fl}>IDENTIFICADOR MUESTRA</Text><Text style={s.fv}>MUE-2026-{String(13).padStart(5, '0')}</Text></View>
            <View style={s.field}><Text style={s.fl}>FECHA Y HORA</Text><Text style={s.fv}>14 abr 2026 · 08:44 AM</Text></View>
          </View>

          {/* Destino */}
          <View style={s.card}>
            <Text style={s.ct}>Destino laboratorio</Text>
            <View style={s.btnRow}>
              {DESTINOS.map((d) => (
                <TouchableOpacity key={d} style={[s.btnSel, destino === d && s.btnActive]} onPress={() => setDestino(d)}>
                  <Text style={[s.btnTxt, destino === d && s.btnTxtActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Últimas muestras */}
          <View style={s.secHdr}>
            <Text style={s.secTitle}>Últimas registradas</Text>
            <Text style={s.secLink}>Ver todas →</Text>
          </View>
          {ULTIMAS.map((a, i) => (
            <View key={i} style={s.animalRow}>
              <View>
                <Text style={s.arDiio}>{a.diio}</Text>
                <Text style={s.arInfo}>{a.info}</Text>
              </View>
              <View style={s.badge}><Text style={s.badgeTxt}>{a.estado}</Text></View>
            </View>
          ))}

          <View style={{ height: 5 }} />
          <TouchableOpacity style={s.cta}><Text style={s.ctaTxt}>Guardar y siguiente</Text></TouchableOpacity>

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
  card: { backgroundColor: '#fff', borderRadius: 11, padding: 9, marginHorizontal: 10, marginBottom: 6 },
  ct: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a', marginBottom: 6 },
  fl: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginBottom: 2 },
  fv: { fontFamily: F.bold, fontSize: 12, color: '#1a1a1a' },
  divider: { height: 0.5, backgroundColor: '#f0ede8', marginVertical: 6 },
  field: { marginBottom: 6 },
  btnRow: { flexDirection: 'row', gap: 6, marginBottom: 5 },
  btnSel: { flex: 1, borderRadius: 9, paddingVertical: 8, alignItems: 'center', borderWidth: 1.5, borderColor: '#e0ddd8', backgroundColor: '#fff' },
  btnActive: { backgroundColor: '#1e3a2f', borderColor: '#1e3a2f' },
  btnTxt: { fontFamily: F.medium, fontSize: 10, color: '#888' },
  btnTxtActive: { color: '#fff' },
  secHdr: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 4 },
  secTitle: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  secLink: { fontFamily: F.regular, fontSize: 10, color: '#1e3a2f' },
  animalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 9, paddingVertical: 7, paddingHorizontal: 9, marginHorizontal: 10, marginBottom: 4 },
  arDiio: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  arInfo: { fontFamily: F.regular, fontSize: 10, color: '#888' },
  badge: { backgroundColor: '#e6f0f8', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 20 },
  badgeTxt: { fontFamily: F.bold, fontSize: 9, color: '#1a5276' },
  cta: { backgroundColor: '#1e3a2f', borderRadius: 10, padding: 10, marginHorizontal: 10, alignItems: 'center' },
  ctaTxt: { fontFamily: F.medium, fontSize: 12, color: '#fff' },
});
