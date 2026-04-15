import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Droplets, AlertTriangle, Wind, CheckCircle2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { r: 'DMSans_400Regular', m: 'DMSans_500Medium', b: 'DMSans_600SemiBold' };

type AlertType = 'urgente' | 'atencion' | 'info' | 'ok';

const BADGE: Record<AlertType, { bg: string; text: string; label: string }> = {
  urgente:  { bg: '#fde8e8', text: '#c0392b', label: 'Urgente' },
  atencion: { bg: '#fdf0e6', text: '#9b5e1a', label: 'Atención' },
  info:     { bg: '#e8f4fd', text: '#1a6aa0', label: 'Info' },
  ok:       { bg: '#e6f3ec', text: '#1e3a2f', label: 'Listo' },
};

const ALERTS = [
  {
    id: '1', type: 'urgente' as AlertType,
    title: 'Bebedero vacío — Potrero Sur',
    desc: 'Drone detectó bebedero sin agua. 78 Wagyu sin acceso.',
    time: 'Hoy 08:14', Icon: Droplets, iconColor: '#c0392b',
  },
  {
    id: '2', type: 'atencion' as AlertType,
    title: 'Déficit energético lote Norte',
    desc: 'GD 1.4 kg/día vs objetivo 1.8 kg. Déficit 17%.',
    time: 'Hoy 07:00', Icon: AlertTriangle, iconColor: '#9b5e1a',
  },
  {
    id: '3', type: 'info' as AlertType,
    title: 'Vuelo drone cancelado',
    desc: 'Viento 31 km/h. Próxima ventana: sábado 08:00.',
    time: 'Hoy 06:30', Icon: Wind, iconColor: '#1a6aa0',
  },
  {
    id: '4', type: 'ok' as AlertType,
    title: 'Reunión procesada',
    desc: '3 acuerdos registrados en Linear. Ayer 15:32.',
    time: 'Ayer 16:02', Icon: CheckCircle2, iconColor: '#1e3a2f',
  },
];

export default function AlertsCenterScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<'activas' | 'historial'>('activas');

  const urgentes     = ALERTS.filter(a => a.type === 'urgente' || a.type === 'atencion');
  const informativas = ALERTS.filter(a => a.type === 'info' || a.type === 'ok');

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} color="#444" />
          </TouchableOpacity>
          <View style={s.countBadge}>
            <Text style={s.countText}>3</Text>
          </View>
        </View>

        {/* Título */}
        <View style={s.titleBlock}>
          <Text style={s.title}>Alertas</Text>
          <Text style={s.subtitle}>Fundo San Pedro · Hoy</Text>
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          {(['activas', 'historial'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[s.tabBtn, tab === t && s.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* URGENTES */}
          <Text style={s.secLabel}>URGENTES</Text>
          {urgentes.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={s.alertCard}
              onPress={() => navigation.navigate('AlertDetail', { alertId: a.id })}
            >
              <View style={[s.iconBox, { backgroundColor: BADGE[a.type].bg }]}>
                <a.Icon size={18} color={a.iconColor} />
              </View>
              <View style={s.alertBody}>
                <View style={s.alertTop}>
                  <Text style={s.alertTitle} numberOfLines={2}>{a.title}</Text>
                  <View style={[s.badge, { backgroundColor: BADGE[a.type].bg }]}>
                    <Text style={[s.badgeText, { color: BADGE[a.type].text }]}>{BADGE[a.type].label}</Text>
                  </View>
                </View>
                <Text style={s.alertDesc}>{a.desc}</Text>
                <Text style={s.alertTime}>{a.time}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* INFORMATIVAS */}
          <Text style={[s.secLabel, { marginTop: 16 }]}>INFORMATIVAS</Text>
          {informativas.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={s.alertCard}
              onPress={() => navigation.navigate('AlertDetail', { alertId: a.id })}
            >
              <View style={[s.iconBox, { backgroundColor: BADGE[a.type].bg }]}>
                <a.Icon size={18} color={a.iconColor} />
              </View>
              <View style={s.alertBody}>
                <View style={s.alertTop}>
                  <Text style={s.alertTitle} numberOfLines={2}>{a.title}</Text>
                  <View style={[s.badge, { backgroundColor: BADGE[a.type].bg }]}>
                    <Text style={[s.badgeText, { color: BADGE[a.type].text }]}>{BADGE[a.type].label}</Text>
                  </View>
                </View>
                <Text style={s.alertDesc}>{a.desc}</Text>
                <Text style={s.alertTime}>{a.time}</Text>
              </View>
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

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#ebe9e3', justifyContent: 'center', alignItems: 'center' },
  countBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#e74c3c', justifyContent: 'center', alignItems: 'center' },
  countText: { fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: '#fff' },

  titleBlock: { paddingHorizontal: 16, marginBottom: 10 },
  title:    { fontFamily: 'DMSans_600SemiBold', fontSize: 28, color: '#1a1a1a' },
  subtitle: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#888' },

  tabs: { flexDirection: 'row', backgroundColor: '#ebe9e3', borderRadius: 12, padding: 3, marginHorizontal: 16, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: '#888' },
  tabTextActive: { color: '#1a1a1a' },

  secLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 10, color: '#aaa', letterSpacing: 1, marginBottom: 8 },

  alertCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 8 },
  iconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  alertBody: { flex: 1 },
  alertTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 },
  alertTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#1a1a1a', flex: 1, marginRight: 6 },
  badge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20 },
  badgeText: { fontFamily: 'DMSans_600SemiBold', fontSize: 9 },
  alertDesc: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: '#888', lineHeight: 15, marginBottom: 4 },
  alertTime: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: '#bbb' },
});
