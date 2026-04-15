import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const F = { r: 'DMSans_400Regular', m: 'DMSans_500Medium', b: 'DMSans_600SemiBold' };

type Estado = 'en_camino' | 'listo' | 'problema';

export default function TaskDetailQuickScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { taskId } = route.params || { taskId: '1' };

  const [estado, setEstado] = useState<Estado>('listo');

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} color="#444" />
          </TouchableOpacity>
          <Text style={s.hdrUrgente}>URGENTE</Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>Detalle tarea</Text>
          <Text style={s.subtitle}>Asignada por JP · Ahora</Text>

          {/* Hero card — borde izquierdo rojo */}
          <View style={s.tareaCard}>
            <Text style={s.tareaCategory}>BEBEDERO VACÍO</Text>
            <Text style={s.tareaTitulo}>Revisar bebedero Potrero Sur</Text>
            <Text style={s.tareaDesc}>
              Drone detectó el bebedero vacío a las 06:45. 78 animales Wagyu sin agua. Revisar válvula flotante primero.
            </Text>
          </View>

          {/* Info grid 2x2 */}
          <View style={s.infoCard}>
            {[
              { label: 'Potrero',   val: 'Sur' },
              { label: 'Animales',  val: '78 Wagyu' },
              { label: 'Detectado', val: '06:45 AM' },
              { label: 'Prioridad', val: 'Urgente', red: true },
            ].map((item, i) => (
              <View key={i} style={[s.infoCell, i % 2 === 0 && s.infoCellBorder]}>
                <Text style={s.infoLabel}>{item.label}</Text>
                <Text style={[s.infoVal, (item as any).red && { color: '#c0392b' }]}>{item.val}</Text>
              </View>
            ))}
          </View>

          {/* ¿Cómo está la tarea? */}
          <Text style={s.secLabel}>¿Cómo está la tarea?</Text>
          <View style={s.estadoRow}>
            {([
              { key: 'en_camino', emoji: '🚗', label: 'En\ncamino' },
              { key: 'listo',     emoji: '✓',  label: 'Listo' },
              { key: 'problema',  emoji: '⚠',  label: 'Problema' },
            ] as const).map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  s.estadoBtn,
                  estado === opt.key && opt.key === 'listo'    && s.estadoBtnListo,
                  estado === opt.key && opt.key === 'problema' && s.estadoBtnProblema,
                  estado === opt.key && opt.key === 'en_camino' && s.estadoBtnActive,
                ]}
                onPress={() => setEstado(opt.key)}
              >
                <Text style={s.estadoEmoji}>{opt.emoji}</Text>
                <Text style={[
                  s.estadoLabel,
                  estado === opt.key && opt.key === 'listo' && { color: '#fff' },
                  estado === opt.key && opt.key === 'problema' && { color: '#c0392b' },
                ]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nota de JP */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Nota de JP</Text>
            <View style={s.divider} />
            <Text style={s.noteBody}>
              Si la válvula no funciona, avisa con el botón Problema. No pierdas tiempo buscando herramientas — llama a Rodrigo si necesitas apoyo.
            </Text>
          </View>

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
  hdrUrgente: { fontFamily: F.b, fontSize: 11, color: '#c0392b', letterSpacing: 0.5 },
  title:    { fontFamily: F.b, fontSize: 24, color: '#1a1a1a', marginTop: 4, marginBottom: 2 },
  subtitle: { fontFamily: F.r, fontSize: 11, color: '#888', marginBottom: 12 },
  tareaCard: { backgroundColor: '#fff', borderRadius: 14, borderLeftWidth: 4, borderLeftColor: '#e74c3c', paddingVertical: 14, paddingHorizontal: 14, marginBottom: 8 },
  tareaCategory: { fontFamily: F.b, fontSize: 9, color: '#c0392b', letterSpacing: 1, marginBottom: 4 },
  tareaTitulo:   { fontFamily: F.b, fontSize: 17, color: '#1a1a1a', marginBottom: 6 },
  tareaDesc:     { fontFamily: F.r, fontSize: 12, color: '#888', lineHeight: 17 },
  infoCard: { backgroundColor: '#fff', borderRadius: 14, flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  infoCell: { width: '50%', paddingVertical: 10, paddingHorizontal: 14 },
  infoCellBorder: { borderRightWidth: 0.5, borderRightColor: '#f0ede8' },
  infoLabel: { fontFamily: F.r, fontSize: 9, color: '#bbb', marginBottom: 2 },
  infoVal:   { fontFamily: F.b, fontSize: 13, color: '#1a1a1a' },
  secLabel: { fontFamily: F.b, fontSize: 12, color: '#1a1a1a', marginBottom: 8 },
  estadoRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  estadoBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  estadoBtnActive:  { borderColor: '#ebe9e3' },
  estadoBtnListo:   { backgroundColor: '#1e3a2f', borderColor: '#1e3a2f' },
  estadoBtnProblema: { backgroundColor: '#fde8e8', borderColor: '#fde8e8' },
  estadoEmoji: { fontSize: 22, marginBottom: 4 },
  estadoLabel: { fontFamily: F.m, fontSize: 11, color: '#444', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  cardTitle: { fontFamily: F.b, fontSize: 13, color: '#1a1a1a', marginBottom: 8 },
  divider:   { height: 0.5, backgroundColor: '#f0ede8', marginBottom: 8 },
  noteBody:  { fontFamily: F.r, fontSize: 12, color: '#555', lineHeight: 17 },
});
