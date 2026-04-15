import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';

const F = { r: 'DMSans_400Regular', m: 'DMSans_500Medium', b: 'DMSans_600SemiBold' };

type TareaEstado = 'urgente' | 'pendiente' | 'listo';

const TAREAS_HOY: Array<{
  id: string; titulo: string; sub: string;
  tiempo: string; lugar: string; estado: TareaEstado;
}> = [
  { id: '1', titulo: 'Revisar bebedero', sub: 'Potrero Sur · Vacío detectado por drone', tiempo: 'Ahora', lugar: 'Potrero Sur', estado: 'urgente' },
  { id: '2', titulo: 'Mover lote Norte',  sub: '110 novillos Angus · Revisar cerco',      tiempo: '10:00 AM', lugar: '→ Potrero Central', estado: 'pendiente' },
  { id: '3', titulo: 'Pesar lote 3',      sub: 'Manga principal · 45 animales',            tiempo: 'Ayer 14:00', lugar: 'Completado', estado: 'listo' },
];

const TAREAS_MANANA = [
  { id: '4', titulo: 'Cargar carro forrajero', sub: 'Lotes Norte y Sur', tiempo: '08:00 AM', lugar: 'Manga', estado: 'pendiente' as TareaEstado },
];

const BADGE: Record<TareaEstado, { bg: string; text: string; label: string }> = {
  urgente:  { bg: '#fde8e8', text: '#c0392b', label: 'Urgente' },
  pendiente: { bg: '#ebe9e3', text: '#666', label: '' },
  listo:    { bg: '#e6f3ec', text: '#1e3a2f', label: 'Listo ✓' },
};

export default function JaimeHomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        {/* Header saludo */}
        <View style={s.headerBlock}>
          <Text style={s.saludoSub}>Buenos días</Text>
          <Text style={s.saludo}>Jaime</Text>
          <Text style={s.saludoMeta}>Lunes 14 abril · Fundo San Pedro</Text>
        </View>

        {/* Stats urgente/pendiente/listo */}
        <View style={s.statsRow}>
          <View style={s.statCell}>
            <Text style={[s.statVal, { color: '#e74c3c' }]}>1</Text>
            <Text style={s.statLabel}>Urgente</Text>
          </View>
          <View style={s.statCell}>
            <Text style={s.statVal}>2</Text>
            <Text style={s.statLabel}>Pendientes</Text>
          </View>
          <View style={s.statCell}>
            <Text style={[s.statVal, { color: '#1e3a2f' }]}>3</Text>
            <Text style={s.statLabel}>Listas</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* HOY */}
          <Text style={s.secLabel}>HOY</Text>
          {TAREAS_HOY.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[s.card, t.estado === 'urgente' && s.cardUrgente]}
              onPress={() => navigation.navigate('TaskDetailQuick', { taskId: t.id })}
            >
              <View style={s.cardTop}>
                <Text style={s.cardTitle}>{t.titulo}</Text>
                {t.estado !== 'pendiente' ? (
                  <View style={[s.badge, { backgroundColor: BADGE[t.estado].bg }]}>
                    <Text style={[s.badgeText, { color: BADGE[t.estado].text }]}>{BADGE[t.estado].label}</Text>
                  </View>
                ) : (
                  <Text style={s.timeText}>{t.tiempo}</Text>
                )}
              </View>
              <Text style={s.cardSub}>{t.sub}</Text>
              <View style={s.cardFooter}>
                <Text style={s.footTime}>{t.tiempo}</Text>
                <Text style={s.footLugar}>{t.lugar}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* MAÑANA */}
          <Text style={[s.secLabel, { marginTop: 8 }]}>MAÑANA</Text>
          {TAREAS_MANANA.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={s.card}
              onPress={() => navigation.navigate('TaskDetailQuick', { taskId: t.id })}
            >
              <View style={s.cardTop}>
                <Text style={s.cardTitle}>{t.titulo}</Text>
                <Text style={s.timeText}>{t.tiempo}</Text>
              </View>
              <Text style={s.cardSub}>{t.sub}</Text>
            </TouchableOpacity>
          ))}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f1' },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  headerBlock: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  saludoSub: { fontFamily: F.r, fontSize: 13, color: '#888' },
  saludo:    { fontFamily: F.b, fontSize: 36, color: '#1a1a1a' },
  saludoMeta: { fontFamily: F.r, fontSize: 11, color: '#aaa' },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginVertical: 12, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 10 },
  statCell: { flex: 1, alignItems: 'center' },
  statVal:  { fontFamily: F.b, fontSize: 24, color: '#1a1a1a' },
  statLabel: { fontFamily: F.r, fontSize: 10, color: '#888', marginTop: 2 },
  secLabel: { fontFamily: F.b, fontSize: 10, color: '#aaa', letterSpacing: 1, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 },
  cardUrgente: { borderLeftWidth: 3, borderLeftColor: '#e74c3c' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  cardTitle: { fontFamily: F.b, fontSize: 13, color: '#1a1a1a', flex: 1, marginRight: 8 },
  cardSub:   { fontFamily: F.r, fontSize: 11, color: '#888', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  footTime:  { fontFamily: F.r, fontSize: 10, color: '#bbb' },
  footLugar: { fontFamily: F.r, fontSize: 10, color: '#bbb' },
  timeText: { fontFamily: F.m, fontSize: 11, color: '#888' },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 20 },
  badgeText: { fontFamily: F.b, fontSize: 10 },
});
