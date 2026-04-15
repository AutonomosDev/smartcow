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

type Categoria = 'Novillo' | 'Vaquilla' | 'Vaca' | 'Toro' | 'Ternero' | 'Otro';
type Destino = 'Engorda' | 'Cría' | 'Descarte' | 'Venta';

const CATS_ROW1: Categoria[] = ['Novillo', 'Vaquilla', 'Vaca'];
const CATS_ROW2: Categoria[] = ['Toro', 'Ternero', 'Otro'];
const DESTINOS_ROW1: Destino[] = ['Engorda', 'Cría'];
const DESTINOS_ROW2: Destino[] = ['Descarte', 'Venta'];

export default function MarcajeClasificacionScreen() {
  const navigation = useNavigation<any>();
  const [cat, setCat] = useState<Categoria>('Novillo');
  const [destino, setDestino] = useState<Destino>('Engorda');

  const clasificados = 67;
  const restantes = 43;
  const engorda = 52;

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
            <Text style={[s.hdrTag, { color: '#1e3a2f' }]}>CLASIFICACIÓN</Text>
          </View>
          <Text style={s.title}>Marcaje y clasificación</Text>
          <Text style={s.sub}>Manga · 14 abr 2026 · Jaime</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Hero */}
          <View style={s.hero}>
            <Text style={s.hl}>SESIÓN CLASIFICACIÓN</Text>
            <Text style={s.hv}>Manga Norte</Text>
            <Text style={s.hs}>14 abr · Jaime · 110 animales</Text>
            <View style={s.hg}>
              <View style={s.hi}><Text style={s.hil}>Clasificados</Text><Text style={[s.hiv, { color: '#7ecfa0' }]}>{clasificados}</Text></View>
              <View style={s.hi}><Text style={s.hil}>Restantes</Text><Text style={s.hiv}>{restantes}</Text></View>
              <View style={s.hi}><Text style={s.hil}>Engorda</Text><Text style={s.hiv}>{engorda}</Text></View>
            </View>
          </View>

          {/* DIIO Card */}
          <View style={s.card}>
            <Text style={s.fl}>DIIO ESCANEADO</Text>
            <Text style={[s.fv, { color: '#1e3a2f', marginBottom: 4 }]}>276000204581234</Text>
            <View style={s.divider} />
            <View style={s.field}>
              <Text style={s.fl}>IDENTIFICADO COMO</Text>
              <Text style={s.fv}>Angus · Macho · 18 meses · 310 kg</Text>
            </View>
          </View>

          {/* Categoría */}
          <View style={s.card}>
            <Text style={s.ct}>Categoría</Text>
            <View style={s.btnRow}>
              {CATS_ROW1.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[s.btnSel, cat === c && s.btnSelActive]}
                  onPress={() => setCat(c)}
                >
                  <Text style={[s.btnSelTxt, cat === c && s.btnSelTxtActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.btnRow}>
              {CATS_ROW2.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[s.btnSel, cat === c && s.btnSelActive]}
                  onPress={() => setCat(c)}
                >
                  <Text style={[s.btnSelTxt, cat === c && s.btnSelTxtActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.divider} />
            <Text style={s.ct}>Destino</Text>
            <View style={s.btnRow}>
              {DESTINOS_ROW1.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[s.btnSel, destino === d && s.btnSelActive]}
                  onPress={() => setDestino(d)}
                >
                  <Text style={[s.btnSelTxt, destino === d && s.btnSelTxtActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.btnRow}>
              {DESTINOS_ROW2.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    s.btnSel,
                    d === 'Venta' ? s.btnSelVenta : destino === d && s.btnSelActive,
                  ]}
                  onPress={() => setDestino(d)}
                >
                  <Text
                    style={[
                      s.btnSelTxt,
                      d === 'Venta' ? { color: '#c0392b' } : destino === d && s.btnSelTxtActive,
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: 4 }} />
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
  ct: { fontFamily: F.bold, fontSize: 11, color: '#1a1a1a', marginBottom: 8 },
  fl: { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginBottom: 3 },
  fv: { fontFamily: F.bold, fontSize: 13, color: '#1a1a1a' },
  divider: { height: 0.5, backgroundColor: '#f0ede8', marginVertical: 8 },
  field: { marginBottom: 7 },

  btnRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  btnSel: {
    flex: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e0ddd8', backgroundColor: '#fff',
  },
  btnSelActive: { backgroundColor: '#1e3a2f', borderColor: '#1e3a2f' },
  btnSelVenta: { backgroundColor: '#fde8e8', borderColor: '#fde8e8' },
  btnSelTxt: { fontFamily: F.medium, fontSize: 11, color: '#888' },
  btnSelTxtActive: { color: '#fff' },

  cta: { backgroundColor: '#1e3a2f', borderRadius: 13, paddingVertical: 13, marginHorizontal: 16, alignItems: 'center', marginBottom: 6 },
  ctaTxt: { fontFamily: F.medium, fontSize: 12, color: '#fff' },
});
