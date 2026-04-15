import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_600SemiBold' };

type Motivo = 'Enfermedad' | 'Clasificación' | 'Sobrepoblación' | 'Otro';
const MOTIVOS_ROW1: Motivo[] = ['Enfermedad', 'Clasificación'];
const MOTIVOS_ROW2: Motivo[] = ['Sobrepoblación', 'Otro'];

const ULTIMOS = [
  { diio: '...581198', info: 'Angus · C3 → C7 · Enfermedad' },
  { diio: '...581102', info: 'Angus · C3 → C7 · Enfermedad' },
];

export default function ReasignacionCorralScreen() {
  const navigation = useNavigation<any>();
  const [motivo, setMotivo] = useState<Motivo>('Enfermedad');

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>
        <View style={s.hdr}>
          <View style={s.hdrTop}>
            <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
              <ChevronLeft size={14} color="#444" />
            </TouchableOpacity>
            <Text style={s.hdrTag}>FEEDLOT</Text>
          </View>
          <Text style={s.title}>Reasignación corral</Text>
          <Text style={s.sub}>14 abr 2026 · Jaime</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* DIIO Card */}
          <View style={s.card}>
            <Text style={s.fl}>DIIO ESCANEADO</Text>
            <Text style={[s.fv, { color: '#1e3a2f', marginBottom: 4 }]}>276000204581234</Text>
            <View style={s.divider} />
            <View style={s.field}><Text style={s.fl}>IDENTIFICADO COMO</Text><Text style={s.fv}>Novillo · Angus · 342 kg</Text></View>
            <View style={s.field}><Text style={s.fl}>CORRAL ACTUAL</Text><Text style={s.fv}>Corral 3</Text></View>
          </View>

          {/* Arrow row origen → destino */}
          <View style={s.arrowRow}>
            <View style={s.arrowBox}>
              <Text style={s.arrowLbl}>ORIGEN</Text>
              <Text style={s.arrowVal}>Corral 3</Text>
            </View>
            <Text style={s.arrow}>→</Text>
            <View style={s.arrowBox}>
              <Text style={s.arrowLbl}>DESTINO</Text>
              <Text style={[s.arrowVal, { color: '#1e3a2f' }]}>Corral 7</Text>
            </View>
          </View>

          {/* Motivo */}
          <View style={s.card}>
            <Text style={s.ct}>Motivo</Text>
            <View style={s.btnRow}>
              {MOTIVOS_ROW1.map((m) => (
                <TouchableOpacity key={m} style={[s.btnSel, motivo === m && s.btnActive]} onPress={() => setMotivo(m)}>
                  <Text style={[s.btnTxt, motivo === m && s.btnTxtActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.btnRow}>
              {MOTIVOS_ROW2.map((m) => (
                <TouchableOpacity key={m} style={[s.btnSel, motivo === m && s.btnActive]} onPress={() => setMotivo(m)}>
                  <Text style={[s.btnTxt, motivo === m && s.btnTxtActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.divider} />
            <View style={s.field}><Text style={s.fl}>FECHA</Text><Text style={s.fv}>14 abr 2026</Text></View>
          </View>

          {/* Últimos movidos */}
          <View style={s.secHdr}>
            <Text style={s.secTitle}>Últimos movidos</Text>
            <Text style={s.secLink}>Ver todos →</Text>
          </View>
          {ULTIMOS.map((a, i) => (
            <View key={i} style={s.animalRow}>
              <View>
                <Text style={s.arDiio}>{a.diio}</Text>
                <Text style={s.arInfo}>{a.info}</Text>
              </View>
              <View style={s.badge}><Text style={s.badgeTxt}>OK</Text></View>
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
  card: { backgroundColor: '#fff', borderRadius: 11, padding: 9, marginHorizontal: 10, marginBottom: 6 },
  ct: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a', marginBottom: 6 },
  fl: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginBottom: 2 },
  fv: { fontFamily: F.bold, fontSize: 12, color: '#1a1a1a' },
  divider: { height: 0.5, backgroundColor: '#f0ede8', marginVertical: 6 },
  field: { marginBottom: 6 },
  arrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 10, marginBottom: 6 },
  arrowBox: { flex: 1, backgroundColor: '#fff', borderRadius: 9, paddingVertical: 7, paddingHorizontal: 9 },
  arrowLbl: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginBottom: 2 },
  arrowVal: { fontFamily: F.bold, fontSize: 12, color: '#1a1a1a' },
  arrow: { fontSize: 14, color: '#bbb' },
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
  badge: { backgroundColor: '#e6f3ec', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 20 },
  badgeTxt: { fontFamily: F.bold, fontSize: 9, color: '#1e3a2f' },
  cta: { backgroundColor: '#1e3a2f', borderRadius: 10, padding: 10, marginHorizontal: 10, alignItems: 'center' },
  ctaTxt: { fontFamily: F.medium, fontSize: 12, color: '#fff' },
});
