import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const F = { r: 'DMSans_400Regular', m: 'DMSans_500Medium', b: 'DMSans_600SemiBold' };

const MEDS = [
  { nombre: 'Oxitetraciclina',   dosis: '20 mg/kg', hora: 'Hoy 14:00' },
  { nombre: 'Flunixin meglumina', dosis: '2.2 mg/kg', hora: 'Hoy 14:00' },
  { nombre: 'Vitamina C',         dosis: '10 ml IM',  hora: 'Mañana' },
];

export default function ActiveTreatmentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { treatmentId } = route.params || {};

  // Progreso: día 3 de 7
  const progress = 3 / 7;

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} color="#444" />
          </TouchableOpacity>
          <Text style={s.hdrStatus}>DÍA 3 DE 7</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Título */}
          <Text style={s.title}>Tratamiento activo</Text>
          <Text style={s.subtitle}>134.2.980.114.422 · Potrero Sur</Text>

          {/* Diagnóstico — card salmon */}
          <View style={s.diagCard}>
            <Text style={s.diagLabel}>DIAGNÓSTICO</Text>
            <Text style={s.diagTitulo}>Neumonía bacteriana</Text>
            <Text style={s.diagDesc}>
              Fiebre 40.2°C, disnea leve, secreción nasal serosa. Inicio 9 abril. Respuesta al tratamiento: favorable.
            </Text>
          </View>

          {/* Progreso del tratamiento */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Progreso del tratamiento</Text>
            <View style={s.progTrack}>
              <View style={[s.progFill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={s.progLabels}>
              <Text style={s.progLabelText}>Inicio{'\n'}9 abr</Text>
              <Text style={[s.progLabelText, { textAlign: 'center' }]}>Día 3 de 7</Text>
              <Text style={[s.progLabelText, { textAlign: 'right' }]}>Alta{'\n'}16 abr</Text>
            </View>

            <View style={s.divider} />

            {/* Vitales 2x2 */}
            <View style={s.vitalesGrid}>
              <View style={s.vitalesCell}>
                <Text style={s.vitalesLabel}>Temperatura hoy</Text>
                <Text style={s.vitalesVal}>39.1°</Text>
              </View>
              <View style={s.vitalesCell}>
                <Text style={s.vitalesLabel}>Temperatura inicio</Text>
                <Text style={[s.vitalesVal, { color: '#e74c3c' }]}>40.2°</Text>
              </View>
              <View style={s.vitalesCell}>
                <Text style={s.vitalesLabel}>Apetito</Text>
                <Text style={s.vitalesVal}>Normal</Text>
              </View>
              <View style={s.vitalesCell}>
                <Text style={s.vitalesLabel}>Retiro faena</Text>
                <Text style={s.vitalesVal}>30 días</Text>
              </View>
            </View>
          </View>

          {/* Medicamentos */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Medicamentos</Text>
            <View style={s.divider} />
            {MEDS.map((med, i) => (
              <View key={i} style={[s.medRow, i < MEDS.length - 1 && s.medRowBorder]}>
                <Text style={s.medNombre}>{med.nombre}</Text>
                <Text style={s.medDosis}>{med.dosis}</Text>
                <Text style={s.medHora}>{med.hora}</Text>
              </View>
            ))}
          </View>

          {/* CTA principal */}
          <TouchableOpacity style={s.cta} onPress={() => navigation.goBack()}>
            <Check size={15} color="#fff" />
            <Text style={s.ctaText}>Registrar aplicación de hoy</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f1' },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#ebe9e3', justifyContent: 'center', alignItems: 'center' },
  hdrStatus: { fontFamily: F.b, fontSize: 11, color: '#f39c12', letterSpacing: 0.5 },

  title:    { fontFamily: F.b, fontSize: 24, color: '#1a1a1a', marginTop: 4, marginBottom: 2 },
  subtitle: { fontFamily: F.r, fontSize: 11, color: '#888', marginBottom: 12 },

  // Card diagnóstico — salmon DS
  diagCard: {
    backgroundColor: '#fde8e8', borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10,
  },
  diagLabel:  { fontFamily: F.b, fontSize: 9, color: '#c0392b', letterSpacing: 1, marginBottom: 4 },
  diagTitulo: { fontFamily: F.b, fontSize: 16, color: '#1a1a1a', marginBottom: 6 },
  diagDesc:   { fontFamily: F.r, fontSize: 12, color: '#555', lineHeight: 17 },

  // Cards
  card: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  cardTitle: { fontFamily: F.b, fontSize: 13, color: '#1a1a1a', marginBottom: 8 },
  divider: { height: 0.5, backgroundColor: '#f0ede8', marginVertical: 8 },

  // Progress bar
  progTrack: { height: 8, backgroundColor: '#f0ede8', borderRadius: 4, marginBottom: 6 },
  progFill:  { height: 8, backgroundColor: '#1e3a2f', borderRadius: 4 },
  progLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progLabelText: { fontFamily: F.r, fontSize: 9, color: '#bbb', lineHeight: 14 },

  // Vitales grid 2x2
  vitalesGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  vitalesCell: { width: '50%', paddingTop: 6 },
  vitalesLabel: { fontFamily: F.r, fontSize: 9, color: '#bbb', marginBottom: 1 },
  vitalesVal:   { fontFamily: F.b, fontSize: 14, color: '#1a1a1a' },

  // Meds table
  medRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  medRowBorder: { borderBottomWidth: 0.5, borderBottomColor: '#f0ede8' },
  medNombre: { fontFamily: F.r, fontSize: 12, color: '#1a1a1a', flex: 1 },
  medDosis:  { fontFamily: F.r, fontSize: 11, color: '#888', width: 70 },
  medHora:   { fontFamily: F.r, fontSize: 11, color: '#888', width: 70, textAlign: 'right' },

  cta: {
    backgroundColor: '#1e3a2f', borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13,
  },
  ctaText: { fontFamily: F.m, fontSize: 13, color: '#fff' },
});
