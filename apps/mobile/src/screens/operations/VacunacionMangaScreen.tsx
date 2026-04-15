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

type TipoReg = 'Vacuna' | 'Antiparasitario' | 'Vitamina';
type Aplicador = 'Jaime' | 'Dr. Muñoz' | 'Otro';
type Screen = 'individual' | 'sesion';

const ANIMALES = [
  { diio: '...581234', info: 'Angus · 47 días · 5ml · 09:14', badge: 'OK', badgeOk: true },
  { diio: '...581228', info: 'Angus · 52 días · 5ml · 09:12', badge: 'OK', badgeOk: true },
  { diio: '...581219', info: 'Angus · 44 días · 5ml · 09:10', badge: 'Reacción', badgeOk: false },
  { diio: '...581207', info: 'Angus · 49 días · 5ml · 09:08', badge: 'OK', badgeOk: true },
];

export default function VacunacionMangaScreen() {
  const navigation = useNavigation<any>();
  const [screen, setScreen] = useState<Screen>('individual');
  const [tipo, setTipo] = useState<TipoReg>('Vacuna');
  const [aplicador, setAplicador] = useState<Aplicador>('Jaime');

  const TIPOS: TipoReg[] = ['Vacuna', 'Antiparasitario', 'Vitamina'];
  const APLICADORES: Aplicador[] = ['Jaime', 'Dr. Muñoz', 'Otro'];
  const pct = 61;

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>

        <View style={s.hdr}>
          <View style={s.hdrTop}>
            <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
              <ChevronLeft size={14} color="#444" />
            </TouchableOpacity>
            <Text style={s.hdrTag}>{screen === 'individual' ? 'VACUNACIÓN' : 'EN PROGRESO'}</Text>
          </View>
          <Text style={s.title}>{screen === 'individual' ? 'Registro sanitario' : 'Vacunación lote'}</Text>
          <Text style={s.sub}>{screen === 'individual' ? 'Lote Norte · 14 abr 2026' : 'Lote Norte · 110 Angus'}</Text>
        </View>

        {screen === 'individual' && (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {/* DIIO */}
            <View style={s.card}>
              <Text style={s.fl}>DIIO ESCANEADO</Text>
              <Text style={[s.fv, { color: '#1e3a2f', marginBottom: 5 }]}>276000204581234</Text>
              <View style={s.divider} />
              <View style={s.field}>
                <Text style={s.fl}>IDENTIFICADO COMO</Text>
                <Text style={s.fv}>Novillo · Angus · Lote Norte · 47 días</Text>
              </View>
            </View>

            {/* Tipo */}
            <View style={s.card}>
              <Text style={s.ct}>Tipo de registro</Text>
              <View style={s.btnRow}>
                {TIPOS.map((t) => (
                  <TouchableOpacity key={t} style={[s.btnSel, tipo === t && s.btnSelActive]} onPress={() => setTipo(t)}>
                    <Text style={[s.btnSelTxt, tipo === t && s.btnSelTxtActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.field}>
                <Text style={s.fl}>PRODUCTO</Text>
                <Text style={s.fv}>Bovilis Bovipast RSP</Text>
              </View>
              <View style={s.divider} />
              <View style={s.field}>
                <Text style={s.fl}>DOSIS</Text>
                <Text style={s.fv}>5 ml · Subcutánea</Text>
              </View>
              <View style={s.divider} />
              <View style={s.field}>
                <Text style={s.fl}>FECHA</Text>
                <Text style={s.fv}>14 abr 2026</Text>
              </View>
              <View style={s.divider} />
              <View style={s.field}>
                <Text style={s.fl}>PRÓXIMA DOSIS</Text>
                <Text style={s.fv}>14 may 2026 · 30 días</Text>
              </View>
            </View>

            {/* Aplicador */}
            <View style={s.card}>
              <Text style={s.ct}>Aplicado por</Text>
              <View style={s.btnRow}>
                {APLICADORES.map((a) => (
                  <TouchableOpacity key={a} style={[s.btnSel, aplicador === a && s.btnSelActive]} onPress={() => setAplicador(a)}>
                    <Text style={[s.btnSelTxt, aplicador === a && s.btnSelTxtActive]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={s.cta} onPress={() => setScreen('sesion')}>
              <Text style={s.ctaTxt}>Guardar y siguiente</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {screen === 'sesion' && (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {/* Hero */}
            <View style={s.hero}>
              <Text style={s.hl}>SESIÓN SANITARIA</Text>
              <Text style={s.hv}>Bovilis Bovipast RSP</Text>
              <Text style={s.hs}>14 abr · Jaime · 5ml subcutánea</Text>
              <View style={s.hg}>
                <View style={s.hi}><Text style={s.hil}>Aplicados</Text><Text style={[s.hiv, { color: '#7ecfa0' }]}>67</Text></View>
                <View style={s.hi}><Text style={s.hil}>Restantes</Text><Text style={s.hiv}>43</Text></View>
                <View style={s.hi}><Text style={s.hil}>Dosis usadas</Text><Text style={s.hiv}>335 ml</Text></View>
              </View>
            </View>

            {/* Progress */}
            <View style={s.progCard}>
              <View style={s.progHeader}>
                <Text style={s.progTitle}>Progreso</Text>
                <Text style={s.progPct}>{pct}%</Text>
              </View>
              <View style={s.progTrack}>
                <View style={[s.progFill, { width: `${pct}%` }]} />
              </View>
              <View style={s.progLabels}>
                <Text style={s.progLbl}>0 animales</Text>
                <Text style={s.progLbl}>110 total</Text>
              </View>
            </View>

            <View style={s.secHdr}>
              <Text style={s.sh}>Últimos aplicados</Text>
              <Text style={s.sl2}>Ver todos →</Text>
            </View>

            {ANIMALES.map((a, i) => (
              <View key={i} style={s.animalRow}>
                <View>
                  <Text style={s.arDiio}>{a.diio}</Text>
                  <Text style={s.arInfo}>{a.info}</Text>
                </View>
                <View style={[s.badge, a.badgeOk ? s.badgeOk : s.badgeWarn]}>
                  <Text style={[s.badgeTxt, { color: a.badgeOk ? '#1e3a2f' : '#9b5e1a' }]}>{a.badge}</Text>
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

  hero: { backgroundColor: '#1e3a2f', borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 8 },
  hl: { fontFamily: F.bold, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 3 },
  hv: { fontFamily: F.bold, fontSize: 16, color: '#fff', marginBottom: 2 },
  hs: { fontFamily: F.regular, fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  hg: { flexDirection: 'row', gap: 4 },
  hi: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: 6 },
  hil: { fontFamily: F.regular, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 1 },
  hiv: { fontFamily: F.bold, fontSize: 12, color: '#fff' },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 8 },
  ct: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a', marginBottom: 8 },
  fl: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginBottom: 3 },
  fv: { fontFamily: F.bold, fontSize: 13, color: '#1a1a1a' },
  divider: { height: 0.5, backgroundColor: '#f0ede8', marginVertical: 7 },
  field: { marginBottom: 7 },

  btnRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  btnSel: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1.5, borderColor: '#e0ddd8', backgroundColor: '#fff' },
  btnSelActive: { backgroundColor: '#1e3a2f', borderColor: '#1e3a2f' },
  btnSelTxt: { fontFamily: F.medium, fontSize: 10, color: '#888' },
  btnSelTxtActive: { color: '#fff' },

  cta: { backgroundColor: '#1e3a2f', borderRadius: 13, paddingVertical: 13, marginHorizontal: 16, alignItems: 'center', marginBottom: 6 },
  ctaTxt: { fontFamily: F.medium, fontSize: 12, color: '#fff' },

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
