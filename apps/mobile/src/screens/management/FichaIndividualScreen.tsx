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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../../App';

type FichaRoute = RouteProp<RootStackParamList, 'FichaIndividual'>;

const F = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_600SemiBold',
};

const TABS = ['Datos', 'Pesajes', 'Sanidad', 'Eventos'] as const;
type Tab = typeof TABS[number];

const EVENTOS = [
  { tipo: 'pesaje', titulo: 'Pesaje — 387 kg', meta: 'GDP 1.8 kg/d · CC 3 · Jaime', fecha: '14 abr', color: '#1e3a2f' },
  { tipo: 'vacuna', titulo: 'Vacuna — Bovilis RSP', meta: '5ml subcutánea · Dr. Muñoz', fecha: '10 abr', color: '#1a5276' },
  { tipo: 'pesaje', titulo: 'Pesaje — 362 kg', meta: 'GDP 1.6 kg/d · CC 3 · Jaime', fecha: '27 mar', color: '#1e3a2f' },
  { tipo: 'movimiento', titulo: 'Movimiento potrero', meta: 'Sur → Norte · Jaime', fecha: '20 mar', color: '#f39c12' },
  { tipo: 'tratamiento', titulo: 'Tratamiento — Oxitetraciclina', meta: 'Neumonía leve · Dr. Muñoz · 7 días', fecha: '12 mar', color: '#e74c3c' },
  { tipo: 'pesaje', titulo: 'Pesaje — 318 kg', meta: 'GDP 1.4 kg/d · CC 2 · Jaime', fecha: '28 feb', color: '#1e3a2f' },
  { tipo: 'ingreso', titulo: 'Ingreso al predio', meta: 'Agropecuaria González · 298 kg', fecha: '15 feb', color: '#9b5e1a' },
];

export default function FichaIndividualScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<FichaRoute>();
  const diio = route.params?.diio ?? '276000204581234';
  const [activeTab, setActiveTab] = useState<Tab>('Datos');

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
            <Text style={s.hdrTag}>DIIO</Text>
          </View>
          <Text style={s.title}>Ficha animal</Text>
          <Text style={s.sub}>Lote Norte · Fundo San Pedro</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={s.hero}>
            <Text style={s.hl}>IDENTIFICACIÓN</Text>
            <Text style={s.hv}>{diio}</Text>
            <Text style={s.hs}>Novillo · Angus · Macho · 4 años</Text>
            <View style={s.hg}>
              <View style={s.hi}>
                <Text style={s.hil}>Peso actual</Text>
                <Text style={[s.hiv, { color: '#7ecfa0' }]}>387 kg</Text>
              </View>
              <View style={s.hi}>
                <Text style={s.hil}>GDP</Text>
                <Text style={[s.hiv, { color: '#7ecfa0' }]}>1.8 kg/d</Text>
              </View>
              <View style={s.hi}>
                <Text style={s.hil}>Estado</Text>
                <Text style={s.hiv}>Activo</Text>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View style={s.tabs}>
            {TABS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[s.tab, activeTab === t ? s.tabActive : s.tabInactive]}
                onPress={() => setActiveTab(t)}
              >
                <Text style={[s.tabTxt, activeTab === t ? s.tabTxtActive : s.tabTxtInactive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'Datos' && (
            <View style={s.card}>
              <Text style={s.ct}>Información general</Text>
              <View style={s.grid2}>
                <View style={s.field}><Text style={s.fl}>RAZA</Text><Text style={s.fv}>Angus negro</Text></View>
                <View style={s.field}><Text style={s.fl}>SEXO</Text><Text style={s.fv}>Macho</Text></View>
                <View style={s.field}><Text style={s.fl}>FECHA NACIMIENTO</Text><Text style={s.fv}>12 mar 2022</Text></View>
                <View style={s.field}><Text style={s.fl}>EDAD</Text><Text style={s.fv}>4 años 1 mes</Text></View>
                <View style={s.field}><Text style={s.fl}>MADRE</Text><Text style={s.fv}>...581198</Text></View>
                <View style={s.field}><Text style={s.fl}>POTRERO ACTUAL</Text><Text style={s.fv}>Norte</Text></View>
              </View>
              <View style={s.divider} />
              <View style={s.field}>
                <Text style={s.fl}>PREDIO ORIGEN</Text>
                <Text style={s.fv}>Agropecuaria González · Ingreso 15 feb 2026</Text>
              </View>
              <View style={s.divider} />
              <View style={s.field}>
                <Text style={s.fl}>DÍAS EN ENGORDA</Text>
                <Text style={s.fv}>58 días · Obj. faena: 420 kg</Text>
              </View>
            </View>
          )}

          {activeTab === 'Pesajes' && (
            <View style={s.card}>
              <Text style={s.ct}>Historial de pesajes</Text>
              {[
                { fecha: '14 abr', peso: '387 kg', gdp: '+1.8 kg/d', cc: 'CC 3' },
                { fecha: '27 mar', peso: '362 kg', gdp: '+1.6 kg/d', cc: 'CC 3' },
                { fecha: '28 feb', peso: '318 kg', gdp: '+1.4 kg/d', cc: 'CC 2' },
                { fecha: '15 feb', peso: '298 kg', gdp: '—', cc: 'Ingreso' },
              ].map((p, i) => (
                <View key={i}>
                  {i > 0 && <View style={s.divider} />}
                  <View style={s.pesajeRow}>
                    <View>
                      <Text style={s.fv}>{p.peso}</Text>
                      <Text style={s.fl}>{p.fecha} · {p.cc}</Text>
                    </View>
                    <Text style={[s.fv, { color: '#1e3a2f' }]}>{p.gdp}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'Sanidad' && (
            <View style={s.card}>
              <Text style={s.ct}>Registro sanitario</Text>
              {[
                { tipo: 'Vacuna', prod: 'Bovilis Bovipast RSP', fecha: '10 abr 2026', prox: '10 may 2026' },
                { tipo: 'Tratamiento', prod: 'Oxitetraciclina', fecha: '12 mar 2026', prox: '19 mar 2026' },
              ].map((item, i) => (
                <View key={i}>
                  {i > 0 && <View style={s.divider} />}
                  <View style={s.field}>
                    <Text style={s.fl}>{item.tipo.toUpperCase()}</Text>
                    <Text style={s.fv}>{item.prod}</Text>
                    <Text style={[s.fl, { marginTop: 2 }]}>{item.fecha} · Próx: {item.prox}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'Eventos' && (
            <>
              <View style={s.secHdr}>
                <Text style={s.sh}>Historial completo</Text>
                <Text style={s.sl2}>14 eventos</Text>
              </View>
              {EVENTOS.map((ev, i) => (
                <View key={i} style={s.eventRow}>
                  <View style={[s.evDot, { backgroundColor: ev.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.evTitle}>{ev.titulo}</Text>
                    <Text style={s.evMeta}>{ev.meta}</Text>
                  </View>
                  <Text style={s.evDate}>{ev.fecha}</Text>
                </View>
              ))}
            </>
          )}
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
  hdrTag: { fontFamily: F.medium, fontSize: 9, color: '#888' },
  title: { fontFamily: F.bold, fontSize: 15, color: '#1a1a1a' },
  sub: { fontFamily: F.regular, fontSize: 10, color: '#999' },

  hero: { backgroundColor: '#1e3a2f', borderRadius: 14, padding: 12, marginHorizontal: 16, marginTop: 8, marginBottom: 8 },
  hl: { fontFamily: F.bold, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 3 },
  hv: { fontFamily: F.bold, fontSize: 16, color: '#fff', marginBottom: 2, letterSpacing: 0.5 },
  hs: { fontFamily: F.regular, fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  hg: { flexDirection: 'row', gap: 4 },
  hi: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: 6 },
  hil: { fontFamily: F.regular, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 1 },
  hiv: { fontFamily: F.bold, fontSize: 12, color: '#fff' },

  tabs: { flexDirection: 'row', gap: 6, marginHorizontal: 16, marginBottom: 8 },
  tab: { flex: 1, borderRadius: 8, paddingVertical: 7, alignItems: 'center' },
  tabActive: { backgroundColor: '#1e3a2f' },
  tabInactive: { backgroundColor: '#fff' },
  tabTxt: { fontFamily: F.medium, fontSize: 10 },
  tabTxtActive: { color: '#fff' },
  tabTxtInactive: { color: '#888' },

  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 8 },
  ct: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a', marginBottom: 8 },
  fl: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginBottom: 2 },
  fv: { fontFamily: F.bold, fontSize: 12, color: '#1a1a1a' },
  divider: { height: 0.5, backgroundColor: '#f0ede8', marginVertical: 6 },
  field: { marginBottom: 6 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  pesajeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  secHdr: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 6 },
  sh: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  sl2: { fontFamily: F.regular, fontSize: 10, color: '#1e3a2f' },

  eventRow: {
    backgroundColor: '#fff', borderRadius: 12, padding: 10, marginHorizontal: 16, marginBottom: 6,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  evDot: { width: 8, height: 8, borderRadius: 4 },
  evTitle: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a' },
  evMeta: { fontFamily: F.regular, fontSize: 10, color: '#888' },
  evDate: { fontFamily: F.regular, fontSize: 10, color: '#bbb' },
});
