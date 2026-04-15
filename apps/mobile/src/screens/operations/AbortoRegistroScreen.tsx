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

type MesGestacion = '1-2' | '3-4' | '5-6' | '7+';
type CausaAborto = 'Desconocida' | 'Traumática' | 'Infecciosa' | 'Nutricional';

const MESES: MesGestacion[] = ['1-2', '3-4', '5-6', '7+'];
const CAUSAS_1: CausaAborto[] = ['Desconocida', 'Traumática'];
const CAUSAS_2: CausaAborto[] = ['Infecciosa', 'Nutricional'];

export default function AbortoRegistroScreen() {
  const navigation = useNavigation<any>();
  const [mes, setMes] = useState<MesGestacion>('5-6');
  const [causa, setCausa] = useState<CausaAborto>('Desconocida');

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
            <Text style={[s.hdrTag, { color: '#c0392b' }]}>ABORTO</Text>
          </View>
          <Text style={s.title}>Registro aborto</Text>
          <Text style={s.sub}>Potrero Norte · 14 abr 2026</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* DIIO Madre */}
          <View style={s.card}>
            <Text style={s.fl}>DIIO MADRE</Text>
            <Text style={[s.fv, { color: '#1e3a2f', marginBottom: 4 }]}>276000204581172</Text>
            <View style={s.divider} />
            <View style={s.field}>
              <Text style={s.fl}>IDENTIFICADA COMO</Text>
              <Text style={s.fv}>Vaca · Angus · 5 años · Lote Norte</Text>
            </View>
            <View style={s.field}>
              <Text style={s.fl}>SERVICIO REGISTRADO</Text>
              <Text style={s.fv}>14 sep 2025 · IA · Dosis BRA-4521</Text>
            </View>
          </View>

          {/* Datos aborto */}
          <View style={s.card}>
            <Text style={s.ct}>Datos del aborto</Text>
            <View style={s.field}>
              <Text style={s.fl}>FECHA DETECCIÓN</Text>
              <Text style={s.fv}>14 abr 2026</Text>
            </View>
            <View style={s.divider} />

            <Text style={s.fl}>MES DE GESTACIÓN APROX.</Text>
            <View style={s.btnRow}>
              {MESES.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[s.btnSel, mes === m && s.btnSelActive]}
                  onPress={() => setMes(m)}
                >
                  <Text style={[s.btnSelTxt, mes === m && s.btnSelTxtActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.divider} />
            <Text style={s.ct}>Causa probable</Text>
            <View style={s.btnRow}>
              {CAUSAS_1.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[s.btnSel, causa === c && s.btnSelActive]}
                  onPress={() => setCausa(c)}
                >
                  <Text style={[s.btnSelTxt, causa === c && s.btnSelTxtActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.btnRow}>
              {CAUSAS_2.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[s.btnSel, causa === c && s.btnSelActive]}
                  onPress={() => setCausa(c)}
                >
                  <Text style={[s.btnSelTxt, causa === c && s.btnSelTxtActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Alerta vet */}
          <View style={[s.card, { backgroundColor: '#fde8e8' }]}>
            <Text style={s.alertTitle}>Alerta enviada al vet</Text>
            <Text style={s.alertSub}>Dr. Muñoz notificado · revisión pendiente</Text>
          </View>

          <TouchableOpacity style={s.cta}>
            <Text style={s.ctaTxt}>Guardar aborto</Text>
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

  btnRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  btnSel: {
    flex: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e0ddd8', backgroundColor: '#fff',
  },
  btnSelActive: { backgroundColor: '#1e3a2f', borderColor: '#1e3a2f' },
  btnSelTxt: { fontFamily: F.medium, fontSize: 11, color: '#888' },
  btnSelTxtActive: { color: '#fff' },

  alertTitle: { fontFamily: F.bold, fontSize: 10, color: '#c0392b', marginBottom: 2 },
  alertSub: { fontFamily: F.regular, fontSize: 9, color: '#c0392b' },

  cta: { backgroundColor: '#1e3a2f', borderRadius: 13, paddingVertical: 13, marginHorizontal: 16, alignItems: 'center', marginBottom: 6 },
  ctaTxt: { fontFamily: F.medium, fontSize: 12, color: '#fff' },
});
