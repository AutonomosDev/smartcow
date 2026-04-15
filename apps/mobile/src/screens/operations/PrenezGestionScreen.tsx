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

type TipoServicio = 'Inseminación IA' | 'Monta natural';
type Protocolo = 'IATF' | 'Celo natural' | 'Repaso toro';
type Screen = 'servicio' | 'diagnostico';

const REVISADAS = [
  { diio: '...581198', info: 'Angus · 4 años · Serv. 14 abr', badge: 'Preñada', ok: true },
  { diio: '...581187', info: 'Angus · 3 años · Serv. 14 abr', badge: 'Preñada', ok: true },
  { diio: '...581172', info: 'Angus · 5 años · Serv. 14 abr', badge: 'Vacía', ok: false },
  { diio: '...581165', info: 'Angus · 3 años · Serv. 14 abr', badge: 'Preñada', ok: true },
];

export default function PrenezGestionScreen() {
  const navigation = useNavigation<any>();
  const [screen, setScreen] = useState<Screen>('servicio');
  const [tipo, setTipo] = useState<TipoServicio>('Inseminación IA');
  const [protocolo, setProtocolo] = useState<Protocolo>('IATF');

  const TIPOS: TipoServicio[] = ['Inseminación IA', 'Monta natural'];
  const PROTOCOLOS: Protocolo[] = ['IATF', 'Celo natural', 'Repaso toro'];

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>

        <View style={s.hdr}>
          <View style={s.hdrTop}>
            <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
              <ChevronLeft size={14} color="#444" />
            </TouchableOpacity>
            <Text style={s.hdrTag}>{screen === 'servicio' ? 'SERVICIO' : 'DIAGNÓSTICO'}</Text>
          </View>
          <Text style={s.title}>{screen === 'servicio' ? 'Registro servicio' : 'Diagnóstico preñez'}</Text>
          <Text style={s.sub}>{screen === 'servicio' ? 'Lote Sur · 14 abr 2026' : 'Lote Sur · 45 días post servicio'}</Text>
        </View>

        {screen === 'servicio' && (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {/* DIIO Hembra */}
            <View style={s.card}>
              <Text style={s.fl}>DIIO HEMBRA</Text>
              <Text style={[s.fv, { color: '#1e3a2f', marginBottom: 5 }]}>276000204581198</Text>
              <View style={s.divider} />
              <View style={s.field}>
                <Text style={s.fl}>IDENTIFICADA COMO</Text>
                <Text style={s.fv}>Vaca · Angus · Lote Sur · 4 años</Text>
              </View>
            </View>

            {/* Tipo servicio + detalle */}
            <View style={s.card}>
              <Text style={s.ct}>Tipo de servicio</Text>
              <View style={s.btnRow}>
                {TIPOS.map((t) => (
                  <TouchableOpacity key={t} style={[s.btnSel, tipo === t && s.btnSelActive]} onPress={() => setTipo(t)}>
                    <Text style={[s.btnSelTxt, tipo === t && s.btnSelTxtActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={s.field}>
                <Text style={s.fl}>TORO / DOSIS IA</Text>
                <Text style={s.fv}>Dosis: Angus-4521-BRA · Lote 03</Text>
              </View>
              <View style={s.divider} />
              <View style={s.field}>
                <Text style={s.fl}>FECHA SERVICIO</Text>
                <Text style={s.fv}>14 abr 2026</Text>
              </View>
              <View style={s.divider} />
              <View style={s.field}>
                <Text style={s.fl}>PARTO ESPERADO</Text>
                <Text style={s.fv}>21 ene 2027 · ~283 días</Text>
              </View>
            </View>

            {/* Protocolo */}
            <View style={s.card}>
              <Text style={s.ct}>Protocolo</Text>
              <View style={s.btnRow}>
                {PROTOCOLOS.map((p) => (
                  <TouchableOpacity key={p} style={[s.btnSel, protocolo === p && s.btnSelActive]} onPress={() => setProtocolo(p)}>
                    <Text style={[s.btnSelTxt, protocolo === p && s.btnSelTxtActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={s.cta} onPress={() => setScreen('diagnostico')}>
              <Text style={s.ctaTxt}>Guardar servicio</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {screen === 'diagnostico' && (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {/* Hero */}
            <View style={s.hero}>
              <Text style={s.hl}>SESIÓN DIAGNÓSTICO</Text>
              <Text style={s.hv}>Lote Sur — IATF abr 2026</Text>
              <Text style={s.hs}>45 días post servicio · Dr. Muñoz</Text>
              <View style={s.hg}>
                <View style={s.hi}><Text style={s.hil}>Preñadas</Text><Text style={[s.hiv, { color: '#7ecfa0' }]}>31</Text></View>
                <View style={s.hi}><Text style={s.hil}>Vacías</Text><Text style={[s.hiv, { color: '#f39c12' }]}>8</Text></View>
                <View style={s.hi}><Text style={s.hil}>Pendientes</Text><Text style={s.hiv}>14</Text></View>
              </View>
            </View>

            {/* Stats */}
            <View style={s.statsRow}>
              <View style={s.statCard}><Text style={[s.statVal, { color: '#1e3a2f' }]}>74%</Text><Text style={s.statLbl}>Preñez</Text></View>
              <View style={s.statCard}><Text style={[s.statVal, { color: '#e74c3c' }]}>19%</Text><Text style={s.statLbl}>Vacías</Text></View>
              <View style={s.statCard}><Text style={s.statVal}>33%</Text><Text style={s.statLbl}>Revisadas</Text></View>
            </View>

            <View style={s.secHdr}>
              <Text style={s.sh}>Últimas revisadas</Text>
              <Text style={s.sl2}>Ver todas →</Text>
            </View>

            {REVISADAS.map((r, i) => (
              <View key={i} style={s.animalRow}>
                <View>
                  <Text style={s.arDiio}>{r.diio}</Text>
                  <Text style={s.arInfo}>{r.info}</Text>
                </View>
                <View style={[s.badge, r.ok ? s.badgeOk : s.badgeRed]}>
                  <Text style={[s.badgeTxt, { color: r.ok ? '#1e3a2f' : '#c0392b' }]}>{r.badge}</Text>
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
  ct: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a', marginBottom: 8 },
  fl: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginBottom: 3 },
  fv: { fontFamily: F.bold, fontSize: 13, color: '#1a1a1a' },
  divider: { height: 0.5, backgroundColor: '#f0ede8', marginVertical: 7 },
  field: { marginBottom: 7 },

  btnRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  btnSel: { flex: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center', borderWidth: 1.5, borderColor: '#e0ddd8', backgroundColor: '#fff' },
  btnSelActive: { backgroundColor: '#1e3a2f', borderColor: '#1e3a2f' },
  btnSelTxt: { fontFamily: F.medium, fontSize: 10, color: '#888' },
  btnSelTxtActive: { color: '#fff' },

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

  statsRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 11, paddingVertical: 8, alignItems: 'center' },
  statVal: { fontFamily: F.bold, fontSize: 13, color: '#1a1a1a' },
  statLbl: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginTop: 1 },

  secHdr: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 6 },
  sh: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  sl2: { fontFamily: F.regular, fontSize: 10, color: '#1e3a2f' },

  animalRow: { backgroundColor: '#fff', borderRadius: 11, padding: 10, marginHorizontal: 16, marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  arDiio: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  arInfo: { fontFamily: F.regular, fontSize: 10, color: '#888' },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20 },
  badgeOk: { backgroundColor: '#e6f3ec' },
  badgeRed: { backgroundColor: '#fde8e8' },
  badgeTxt: { fontFamily: F.bold, fontSize: 9 },
});
