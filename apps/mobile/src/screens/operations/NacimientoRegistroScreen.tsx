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

type Sexo = 'Macho' | 'Hembra';
type TipoParto = 'Normal' | 'Distócico' | 'C. Asistido';
type EstadoCria = 'Vivo normal' | 'Vivo débil' | 'Mortinato' | 'Gemelar';
type Obs = 'Sin novedad' | 'Ayuda mamada' | 'Avisar vet';
type Screen = 'registro' | 'condicion';

export default function NacimientoRegistroScreen() {
  const navigation = useNavigation<any>();
  const [screen, setScreen] = useState<Screen>('registro');
  const [sexo, setSexo] = useState<Sexo>('Macho');
  const [tipoParto, setTipoParto] = useState<TipoParto>('Normal');
  const [estadoCria, setEstadoCria] = useState<EstadoCria>('Vivo normal');
  const [obs, setObs] = useState<Obs | null>(null);

  const TIPOS_PARTO: TipoParto[] = ['Normal', 'Distócico', 'C. Asistido'];
  const ESTADOS: EstadoCria[] = ['Vivo normal', 'Vivo débil', 'Mortinato', 'Gemelar'];
  const OBS_LIST: Obs[] = ['Sin novedad', 'Ayuda mamada', 'Avisar vet'];

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>

        <View style={s.hdr}>
          <View style={s.hdrTop}>
            <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
              <ChevronLeft size={14} color="#444" />
            </TouchableOpacity>
            <Text style={s.hdrTag}>{screen === 'registro' ? 'NUEVO PARTO' : 'PASO 2 DE 2'}</Text>
          </View>
          <Text style={s.title}>{screen === 'registro' ? 'Registro nacimiento' : 'Condición del parto'}</Text>
          <Text style={s.sub}>{screen === 'registro' ? 'Lunes 14 abr · 06:30 AM · Jaime' : '276000204581198 · Angus macho · 38 kg'}</Text>
        </View>

        {screen === 'registro' && (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {/* Madre */}
            <View style={s.card}>
              <Text style={s.ct}>Madre</Text>
              <View style={s.scanBtn}>
                <Text style={{ fontSize: 16 }}>📡</Text>
                <View>
                  <Text style={s.scanTxt}>Escanear DIIO madre</Text>
                  <Text style={s.scanSub}>Acercar bastón XRS2i al arete</Text>
                </View>
              </View>
              <View style={s.field}>
                <Text style={s.fl}>DIIO ESCANEADO</Text>
                <Text style={[s.fv, { color: '#1e3a2f' }]}>276000204581198</Text>
              </View>
              <View style={s.divider} />
              <View style={s.field}>
                <Text style={s.fl}>IDENTIFICADA COMO</Text>
                <Text style={s.fv}>Vaca · Angus · Lote Sur · Ing. 10 ene 2024</Text>
              </View>
            </View>

            {/* Cría */}
            <View style={s.card}>
              <Text style={s.ct}>Cría</Text>
              <View style={s.field}>
                <Text style={s.fl}>FECHA Y HORA PARTO</Text>
                <Text style={s.fv}>14 abr 2026 · 06:30 AM</Text>
              </View>
              <View style={s.divider} />
              <Text style={[s.fl, { marginBottom: 6 }]}>SEXO</Text>
              <View style={s.btnRow}>
                <TouchableOpacity style={[s.btnSel, sexo === 'Macho' && s.btnSelActive]} onPress={() => setSexo('Macho')}>
                  <Text style={[s.btnSelTxt, sexo === 'Macho' && s.btnSelTxtActive]}>Macho</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btnSel, sexo === 'Hembra' && s.btnSelFemale]} onPress={() => setSexo('Hembra')}>
                  <Text style={[s.btnSelTxt, sexo === 'Hembra' && { color: '#9b5e1a' }]}>Hembra</Text>
                </TouchableOpacity>
              </View>
              <View style={s.field}>
                <Text style={s.fl}>DIIO CRÍA (arete nuevo)</Text>
                <Text style={[s.fv, { color: '#ddd', fontFamily: F.regular, fontSize: 12 }]}>Escanear cuando esté colocado...</Text>
              </View>
            </View>

            {/* Peso + Raza */}
            <View style={s.pesoRow}>
              <View style={s.pesoBox}>
                <Text style={s.pesoLabel}>PESO AL NACER</Text>
                <Text style={s.pesoVal}>38 <Text style={s.pesoUnit}>kg</Text></Text>
              </View>
              <View style={s.pesoBox}>
                <Text style={s.pesoLabel}>RAZA</Text>
                <Text style={[s.fv, { marginTop: 2 }]}>Angus</Text>
              </View>
            </View>

            <TouchableOpacity style={s.cta} onPress={() => setScreen('condicion')}>
              <Text style={s.ctaTxt}>Guardar nacimiento</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {screen === 'condicion' && (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
            {/* Hero */}
            <View style={s.hero}>
              <Text style={s.hl}>PARTO REGISTRADO</Text>
              <Text style={s.hv}>Angus macho · 38 kg</Text>
              <Text style={s.hs}>Madre ...581198 · 14 abr 06:30 AM</Text>
              <View style={s.hg}>
                <View style={s.hi}><Text style={s.hil}>Madre</Text><Text style={[s.hiv, { color: '#7ecfa0' }]}>OK</Text></View>
                <View style={s.hi}><Text style={s.hil}>Cría</Text><Text style={[s.hiv, { color: '#7ecfa0' }]}>Vivo</Text></View>
                <View style={s.hi}><Text style={s.hil}>Parto</Text><Text style={s.hiv}>Normal</Text></View>
              </View>
            </View>

            {/* Tipo parto */}
            <View style={s.card}>
              <Text style={s.ct}>Tipo de parto</Text>
              <View style={s.btnRow}>
                {TIPOS_PARTO.map((t) => (
                  <TouchableOpacity key={t} style={[s.btnSel, tipoParto === t && s.btnSelActive]} onPress={() => setTipoParto(t)}>
                    <Text style={[s.btnSelTxt, { fontSize: 10 }, tipoParto === t && s.btnSelTxtActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Estado cría */}
            <View style={s.card}>
              <Text style={s.ct}>Estado de la cría</Text>
              <View style={s.btnRow}>
                {ESTADOS.slice(0, 2).map((e) => (
                  <TouchableOpacity key={e} style={[s.btnSel, estadoCria === e && s.btnSelActive]} onPress={() => setEstadoCria(e)}>
                    <Text style={[s.btnSelTxt, { fontSize: 10 }, estadoCria === e && s.btnSelTxtActive]}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={s.btnRow}>
                {ESTADOS.slice(2).map((e) => (
                  <TouchableOpacity key={e} style={[s.btnSel, estadoCria === e && s.btnSelActive]} onPress={() => setEstadoCria(e)}>
                    <Text style={[s.btnSelTxt, { fontSize: 10 }, estadoCria === e && s.btnSelTxtActive]}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Observaciones */}
            <View style={s.card}>
              <Text style={s.ct}>Observaciones</Text>
              <View style={s.btnRow}>
                {OBS_LIST.map((o) => (
                  <TouchableOpacity
                    key={o}
                    style={[s.obsBtn, obs === o && s.obsBtnActive]}
                    onPress={() => setObs(obs === o ? null : o)}
                  >
                    <Text style={[s.obsBtnTxt, obs === o && { color: '#c0392b' }]}>{o}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ height: 6 }} />
            <TouchableOpacity style={s.cta}>
              <Text style={s.ctaTxt}>Confirmar y guardar</Text>
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

  scanBtn: { flexDirection: 'row', gap: 10, backgroundColor: '#e6f3ec', borderRadius: 10, padding: 10, marginBottom: 10, alignItems: 'center' },
  scanTxt: { fontFamily: F.bold, fontSize: 11, color: '#1e3a2f' },
  scanSub: { fontFamily: F.regular, fontSize: 10, color: '#5a8a6a' },

  btnRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  btnSel: { flex: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center', borderWidth: 1.5, borderColor: '#e0ddd8', backgroundColor: '#fff' },
  btnSelActive: { backgroundColor: '#1e3a2f', borderColor: '#1e3a2f' },
  btnSelFemale: { backgroundColor: '#fdf0e6', borderColor: '#fdf0e6' },
  btnSelTxt: { fontFamily: F.medium, fontSize: 11, color: '#888' },
  btnSelTxtActive: { color: '#fff' },

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

  obsBtn: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1.5, borderColor: '#e0ddd8', backgroundColor: '#fff' },
  obsBtnActive: { backgroundColor: '#fde8e8', borderColor: '#fde8e8' },
  obsBtnTxt: { fontFamily: F.medium, fontSize: 10, color: '#888' },
});
