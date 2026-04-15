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

type CC = 1 | 2 | 3 | 4 | 5;

const EVALUADOS = [
  { diio: '...581234', info: 'Angus · CC 3 · 09:14', ok: true },
  { diio: '...581228', info: 'Angus · CC 2 · 09:12', ok: false },
  { diio: '...581219', info: 'Angus · CC 3 · 09:10', ok: true },
  { diio: '...581207', info: 'Angus · CC 4 · 09:08', ok: true },
];

export default function CondicionCorporalScreen() {
  const navigation = useNavigation<any>();
  const [cc, setCc] = useState<CC>(3);

  const evaluados = 34;
  const restantes = 21;
  const ccProm = 2.8;

  const CC_OPTS: CC[] = [1, 2, 3, 4, 5];

  // Badge OK si CC >= 3, Bajo si CC <= 2
  const getBadge = (ccVal: number): { label: string; ok: boolean } =>
    ccVal <= 2 ? { label: 'Bajo', ok: false } : { label: 'OK', ok: true };

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
            <Text style={[s.hdrTag, { color: '#1e3a2f' }]}>CC</Text>
          </View>
          <Text style={s.title}>Condición corporal</Text>
          <Text style={s.sub}>Lote Sur · 14 abr 2026 · Jaime</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <View style={s.hero}>
            <Text style={s.hl}>SESIÓN CC</Text>
            <Text style={s.hv}>Lote Sur</Text>
            <Text style={s.hs}>Sin balanza · solo bastón + CC</Text>
            <View style={s.hg}>
              <View style={s.hi}><Text style={s.hil}>Evaluados</Text><Text style={[s.hiv, { color: '#7ecfa0' }]}>{evaluados}</Text></View>
              <View style={s.hi}><Text style={s.hil}>Restantes</Text><Text style={s.hiv}>{restantes}</Text></View>
              <View style={s.hi}><Text style={s.hil}>CC prom.</Text><Text style={s.hiv}>{ccProm}</Text></View>
            </View>
          </View>

          {/* DIIO Card */}
          <View style={s.card}>
            <Text style={s.fl}>DIIO ESCANEADO</Text>
            <Text style={[s.fv, { color: '#1e3a2f', marginBottom: 4 }]}>276000204581234</Text>
            <View style={s.divider} />
            <View style={s.field}>
              <Text style={s.fl}>IDENTIFICADO COMO</Text>
              <Text style={s.fv}>Vaca · Angus · Lote Sur</Text>
            </View>
          </View>

          {/* CC Big Number */}
          <Text style={s.ccBig}>{cc}</Text>
          <Text style={s.ccSub}>Condición corporal — escala 1 a 5</Text>

          {/* CC Buttons */}
          <View style={s.ccRow}>
            {CC_OPTS.map((val) => (
              <TouchableOpacity
                key={val}
                style={[s.ccBtn, cc === val && s.ccBtnActive]}
                onPress={() => setCc(val)}
              >
                <Text style={[s.ccBtnTxt, cc === val && s.ccBtnTxtActive]}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Últimos evaluados */}
          <View style={[s.secHdr, { marginTop: 10 }]}>
            <Text style={s.sh}>Últimos evaluados</Text>
            <Text style={s.sl2}>Ver todos →</Text>
          </View>

          {EVALUADOS.map((a, i) => {
            const ccNum = parseInt(a.info.split('CC ')[1].split(' ')[0]);
            const badge = getBadge(ccNum);
            return (
              <View key={i} style={s.animalRow}>
                <View>
                  <Text style={s.arDiio}>{a.diio}</Text>
                  <Text style={s.arInfo}>{a.info}</Text>
                </View>
                <View style={[s.badge, badge.ok ? s.badgeOk : s.badgeWarn]}>
                  <Text style={[s.badgeTxt, { color: badge.ok ? '#1e3a2f' : '#9b5e1a' }]}>{badge.label}</Text>
                </View>
              </View>
            );
          })}

          <View style={{ height: 10 }} />
          <TouchableOpacity style={s.cta}>
            <Text style={s.ctaTxt}>Guardar y siguiente</Text>
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

  hero: { backgroundColor: '#1e3a2f', borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 8 },
  hl: { fontFamily: F.bold, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 3 },
  hv: { fontFamily: F.bold, fontSize: 16, color: '#fff', marginBottom: 2 },
  hs: { fontFamily: F.regular, fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  hg: { flexDirection: 'row', gap: 4 },
  hi: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: 6 },
  hil: { fontFamily: F.regular, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 1 },
  hiv: { fontFamily: F.bold, fontSize: 12, color: '#fff' },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 8 },
  fl: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginBottom: 3 },
  fv: { fontFamily: F.bold, fontSize: 13, color: '#1a1a1a' },
  divider: { height: 0.5, backgroundColor: '#f0ede8', marginVertical: 7 },
  field: { marginBottom: 7 },

  // CC Big number — elemento más prominente (48pt como mockup)
  ccBig: {
    fontFamily: F.bold,
    fontSize: 48,
    color: '#1e3a2f',
    textAlign: 'center',
    lineHeight: 52,
    marginTop: 8,
    marginBottom: 4,
  },
  ccSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    marginBottom: 10,
  },

  // CC 5-button row
  ccRow: { flexDirection: 'row', gap: 6, marginHorizontal: 16, marginBottom: 4 },
  ccBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0ddd8',
    backgroundColor: '#fff',
  },
  ccBtnActive: { backgroundColor: '#1e3a2f', borderColor: '#1e3a2f' },
  ccBtnTxt: { fontFamily: F.bold, fontSize: 14, color: '#888' },
  ccBtnTxtActive: { color: '#fff' },

  secHdr: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 6 },
  sh: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  sl2: { fontFamily: F.regular, fontSize: 10, color: '#1e3a2f' },

  animalRow: {
    backgroundColor: '#fff', borderRadius: 11, padding: 10, marginHorizontal: 16,
    marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  arDiio: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  arInfo: { fontFamily: F.regular, fontSize: 10, color: '#888' },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20 },
  badgeOk: { backgroundColor: '#e6f3ec' },
  badgeWarn: { backgroundColor: '#fdf0e6' },
  badgeTxt: { fontFamily: F.bold, fontSize: 9 },

  cta: { backgroundColor: '#1e3a2f', borderRadius: 13, paddingVertical: 13, marginHorizontal: 16, alignItems: 'center', marginBottom: 6 },
  ctaTxt: { fontFamily: F.medium, fontSize: 12, color: '#fff' },
});
