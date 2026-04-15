import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, MapPin, User } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const F = { r: 'DMSans_400Regular', m: 'DMSans_500Medium', b: 'DMSans_600SemiBold' };

const MOCK_ALERTS: Record<string, any> = {
  '1': {
    tipo: 'BEBEDERO VACÍO',
    titulo: 'Potrero Sur sin agua',
    desc: 'Drone detectó bebedero completamente seco durante vuelo matutino. 78 animales Wagyu sin acceso a agua desde las 08:14 AM.',
    potrero: 'Sur',
    animales: '78 Wagyu',
    detectado: '08:14 AM',
    fuente: 'Drone M3E',
    urgencia: 'URGENTE',
    historial: [
      'Bebedero vacío detectado por drone',
      'Alerta enviada a JP vía push',
      'Revisión programada para 09:00',
    ],
  },
  '2': {
    tipo: 'DÉFICIT ENERGÉTICO',
    titulo: 'Lote Norte bajo objetivo',
    desc: 'GD 1.4 kg/día vs objetivo 1.8 kg. Déficit 17% acumulado en 3 días. Revisar formulación de ración.',
    potrero: 'Norte',
    animales: '110 Angus',
    detectado: '07:00 AM',
    fuente: 'AgroBrain',
    urgencia: 'ATENCIÓN',
    historial: [
      'Deficit detectado por AgroBrain',
      'Notificación enviada a asesor',
    ],
  },
};

export default function AlertDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { alertId } = route.params || { alertId: '1' };
  const alert = MOCK_ALERTS[alertId] || MOCK_ALERTS['1'];

  const isUrgent = alert.urgencia === 'URGENTE';

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} color="#444" />
          </TouchableOpacity>
          <Text style={[s.hdrBadge, { color: isUrgent ? '#c0392b' : '#9b5e1a' }]}>
            {alert.urgencia}
          </Text>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Título */}
          <Text style={s.title}>Detalle alerta</Text>
          <Text style={s.subtitle}>Hoy 08:14 · Drone M3E</Text>

          {/* Hero card alerta — borde izquierdo rojo */}
          <View style={[s.alertHero, { borderLeftColor: isUrgent ? '#c0392b' : '#f39c12' }]}>
            <Text style={[s.alertTipo, { color: isUrgent ? '#c0392b' : '#9b5e1a' }]}>
              {alert.tipo}
            </Text>
            <Text style={s.alertTitulo}>{alert.titulo}</Text>
            <Text style={s.alertDesc}>{alert.desc}</Text>
          </View>

          {/* Info grid */}
          <View style={s.infoCard}>
            {[
              { label: 'Potrero',   val: alert.potrero },
              { label: 'Animales',  val: alert.animales },
              { label: 'Detectado', val: alert.detectado },
              { label: 'Fuente',    val: alert.fuente },
            ].map((item, i) => (
              <View key={i} style={[s.infoCell, i % 2 === 0 && s.infoCellBorder]}>
                <Text style={s.infoLabel}>{item.label}</Text>
                <Text style={s.infoVal}>{item.val}</Text>
              </View>
            ))}
          </View>

          {/* Acciones rápidas */}
          <Text style={s.secLabel}>Acciones rápidas</Text>

          <TouchableOpacity
            style={s.ctaPrimary}
            onPress={() => navigation.navigate('JaimeHome')}
          >
            <User size={15} color="#fff" />
            <Text style={s.ctaPrimaryText}>Asignar a Jaime ahora</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.ctaSecondary}
            onPress={() => navigation.navigate('MapaPredio')}
          >
            <MapPin size={15} color="#1a1a1a" />
            <Text style={s.ctaSecondaryText}>Ver en mapa</Text>
          </TouchableOpacity>

          {/* Historial */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Historial</Text>
            <View style={s.divider} />
            {alert.historial.map((item: string, i: number) => (
              <View key={i} style={s.histRow}>
                <View style={s.histDot} />
                <Text style={s.histText}>{item}</Text>
              </View>
            ))}
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
  hdrBadge: { fontFamily: F.b, fontSize: 11, letterSpacing: 0.5 },

  title:    { fontFamily: F.b, fontSize: 24, color: '#1a1a1a', marginTop: 4, marginBottom: 2 },
  subtitle: { fontFamily: F.r, fontSize: 11, color: '#888', marginBottom: 12 },

  // Hero alert card
  alertHero: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 14,
    borderLeftWidth: 4, marginBottom: 8,
  },
  alertTipo:   { fontFamily: F.b, fontSize: 9, letterSpacing: 1, marginBottom: 4 },
  alertTitulo: { fontFamily: F.b, fontSize: 18, color: '#1a1a1a', marginBottom: 6 },
  alertDesc:   { fontFamily: F.r, fontSize: 12, color: '#888', lineHeight: 17 },

  // Info grid
  infoCard: { backgroundColor: '#fff', borderRadius: 14, flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  infoCell: { width: '50%', paddingVertical: 10, paddingHorizontal: 14 },
  infoCellBorder: { borderRightWidth: 0.5, borderRightColor: '#f0ede8' },
  infoLabel: { fontFamily: F.r, fontSize: 9, color: '#bbb', marginBottom: 2 },
  infoVal:   { fontFamily: F.b, fontSize: 13, color: '#1a1a1a' },

  secLabel: { fontFamily: F.b, fontSize: 12, color: '#1a1a1a', marginBottom: 8 },

  ctaPrimary: {
    backgroundColor: '#1e3a2f', borderRadius: 12, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, marginBottom: 8,
  },
  ctaPrimaryText: { fontFamily: F.m, fontSize: 13, color: '#fff' },

  ctaSecondary: {
    backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, marginBottom: 12,
  },
  ctaSecondaryText: { fontFamily: F.m, fontSize: 13, color: '#1a1a1a' },

  card: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  cardTitle: { fontFamily: F.b, fontSize: 13, color: '#1a1a1a', marginBottom: 8 },
  divider: { height: 0.5, backgroundColor: '#f0ede8', marginBottom: 8 },
  histRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 7 },
  histDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#e74c3c', marginTop: 4 },
  histText: { fontFamily: F.r, fontSize: 12, color: '#444', flex: 1 },
});
