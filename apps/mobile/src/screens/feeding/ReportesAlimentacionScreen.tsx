import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', bold: 'DMSans_600SemiBold' };

export default function ReportesAlimentacionScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe}>
        <View style={s.hdr}>
          <View style={s.hdrTop}>
            <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
              <ChevronLeft size={13} color="#444" />
            </TouchableOpacity>
            <Text style={[s.tag, { color: '#1e3a2f' }]}>REPORTES</Text>
          </View>
          <Text style={s.title}>Reportes alimentación</Text>
          <Text style={s.sub}>Abril 2026 · Fundo San Pedro</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={s.hero}>
            <Text style={s.hl}>RESUMEN MES</Text>
            <Text style={s.hv}>Abril 2026</Text>
            <Text style={s.hs}>14 días · 440 animales · 11 corrales</Text>
            <View style={s.hg}>
              <View style={s.hi}><Text style={s.hil}>Costo total</Text><Text style={s.hiv}>$14.2M</Text></View>
              <View style={s.hi}><Text style={s.hil}>$/animal/día</Text><Text style={[s.hiv, { color: '#7ecfa0' }]}>$2.310</Text></View>
              <View style={s.hi}><Text style={s.hil}>Eficiencia</Text><Text style={[s.hiv, { color: '#7ecfa0' }]}>96%</Text></View>
            </View>
          </View>

          {/* KPIs */}
          <View style={s.card}>
            <Text style={s.ct}>KPIs clave</Text>

            <View style={s.field}>
              <Text style={s.fl}>MS CONSUMIDA REAL vs PLAN</Text>
              <Text style={s.fv}>
                12.1 kg / 12.4 kg · <Text style={{ color: '#f39c12' }}>–2.4%</Text>
              </Text>
            </View>
            <View style={s.divider} />

            <View style={s.field}>
              <Text style={s.fl}>SOBRAS PROMEDIO</Text>
              <Text style={s.fv}>
                3.8% <Text style={{ color: '#1e3a2f', fontSize: 11 }}>· dentro del rango</Text>
              </Text>
            </View>
            <View style={s.divider} />

            <View style={s.field}>
              <Text style={s.fl}>INGREDIENTE MÁS COSTOSO</Text>
              <Text style={s.fv}>Concentrado engorda · $1.8M mes</Text>
            </View>
            <View style={s.divider} />

            <View style={[s.field, { marginBottom: 0 }]}>
              <Text style={s.fl}>ERROR OPERADOR PROMEDIO</Text>
              <Text style={s.fv}>
                1.2% <Text style={{ color: '#1e3a2f', fontSize: 11 }}>· excelente</Text>
              </Text>
            </View>
          </View>

          {/* Botón secundario */}
          <TouchableOpacity style={s.ctaSecondary}>
            <Text style={s.ctaSecondaryTxt}>Exportar PDF / Excel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.cta}>
            <Text style={s.ctaTxt}>Ver detalle por corral</Text>
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
  tag: { fontFamily: F.medium, fontSize: 9 },
  title: { fontFamily: F.bold, fontSize: 15, color: '#1a1a1a' },
  sub: { fontFamily: F.regular, fontSize: 10, color: '#999' },
  hero: { backgroundColor: '#1e3a2f', borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 8 },
  hl: { fontFamily: F.bold, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  hv: { fontFamily: F.bold, fontSize: 15, color: '#fff', marginBottom: 1 },
  hs: { fontFamily: F.regular, fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 8 },
  hg: { flexDirection: 'row', gap: 4 },
  hi: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: 6 },
  hil: { fontFamily: F.regular, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 1 },
  hiv: { fontFamily: F.bold, fontSize: 11, color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginHorizontal: 16, marginBottom: 8 },
  ct: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a', marginBottom: 8 },
  fl: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginBottom: 3 },
  fv: { fontFamily: F.bold, fontSize: 13, color: '#1a1a1a' },
  divider: { height: 0.5, backgroundColor: '#f0ede8', marginVertical: 8 },
  field: { marginBottom: 6 },
  ctaSecondary: {
    backgroundColor: '#fff', borderRadius: 13, paddingVertical: 12,
    marginHorizontal: 16, alignItems: 'center', marginBottom: 6,
    borderWidth: 1, borderColor: '#e0ddd8',
  },
  ctaSecondaryTxt: { fontFamily: F.medium, fontSize: 12, color: '#1a1a1a' },
  cta: { backgroundColor: '#1e3a2f', borderRadius: 13, paddingVertical: 13, marginHorizontal: 16, alignItems: 'center' },
  ctaTxt: { fontFamily: F.medium, fontSize: 12, color: '#fff' },
});
