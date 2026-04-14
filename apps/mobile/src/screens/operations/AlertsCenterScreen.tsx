import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };
const badges: Record<string, { bg: string; text: string }> = {
  clima: { bg: '#e3f0fb', text: '#1a6aa0' },
  agua: { bg: '#e3f5fb', text: '#1a7aa0' },
  viento: { bg: '#eae8fb', text: '#5a3aa0' },
  info: { bg: '#e6f3ec', text: '#1E3A2F' },
  warning: { bg: '#fdf3e3', text: '#a06a1a' },
  danger: { bg: '#fde8e8', text: '#a01a1a' },
};
import { ChevronLeft, Info, AlertTriangle, Droplets, Wind, CheckCircle2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const ALERTS = [
  {
    id: '1',
    title: 'Bebedero vacío — Potrero Sur',
    desc: 'Drone detectó bebedero sin agua. 78 Wagyu sin acceso.',
    time: 'Hoy 08:14',
    type: 'urgente',
    icon: Droplets,
    iconColor: '#e74c3c',
  },
  {
    id: '2',
    title: 'Déficit energético lote Norte',
    desc: 'GD 1.4 kg/día vs objetivo 1.8 kg. Déficit 17%.',
    time: 'Hoy 07:00',
    type: 'atencion',
    icon: AlertTriangle,
    iconColor: '#f39c12',
  },
  {
    id: '3',
    title: 'Vuelo drone cancelado',
    desc: 'Viento 31 km/h. Próxima ventana: sábado 08:00.',
    time: 'Hoy 06:30',
    type: 'info',
    icon: Wind,
    iconColor: '#1a5276',
  },
  {
    id: '4',
    title: 'Reunión procesada',
    desc: '3 acuerdos registrados en Linear. Ayer 15:32.',
    time: 'Ayer 16:02',
    type: 'ok',
    icon: CheckCircle2,
    iconColor: '#1e3a2f',
  }
];

export default function AlertsCenterScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<'activas' | 'historial'>('activas');

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerIcon} 
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color={T.color.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Alertas</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>3</Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, tab === 'activas' && styles.activeTab]} 
            onPress={() => setTab('activas')}
          >
            <Text style={[styles.tabText, tab === 'activas' && styles.activeTabText]}>Activas</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, tab === 'historial' && styles.activeTab]} 
            onPress={() => setTab('historial')}
          >
            <Text style={[styles.tabText, tab === 'historial' && styles.activeTabText]}>Historial</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>URGENTES</Text>
          {ALERTS.filter(a => a.type === 'urgente' || a.type === 'atencion').map(alert => (
            <TouchableOpacity 
              key={alert.id} 
              style={styles.alertCard}
              onPress={() => navigation.navigate('AlertDetail', { alertId: alert.id })}
            >
              <View style={[styles.iconContainer, { backgroundColor: (badges as any)[alert.type].bg }]}>
                <alert.icon size={20} color={(badges as any)[alert.type].text} />
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: (badges as any)[alert.type].bg }]}>
                    <Text style={[styles.typeBadgeText, { color: (badges as any)[alert.type].text }]}>
                      {alert.type.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.alertDesc}>{alert.desc}</Text>
                <Text style={styles.alertTime}>{alert.time}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>INFORMATIVAS</Text>
          {ALERTS.filter(a => a.type === 'info' || a.type === 'ok').map(alert => (
            <TouchableOpacity 
              key={alert.id} 
              style={styles.alertCard}
              onPress={() => navigation.navigate('AlertDetail', { alertId: alert.id })}
            >
              <View style={[styles.iconContainer, { backgroundColor: (badges as any)[alert.type].bg }]}>
                <alert.icon size={20} color={(badges as any)[alert.type].text} />
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: (badges as any)[alert.type].bg }]}>
                    <Text style={[styles.typeBadgeText, { color: (badges as any)[alert.type].text }]}>
                      {alert.type === 'ok' ? 'LISTO' : alert.type.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.alertDesc}>{alert.desc}</Text>
                <Text style={styles.alertTime}>{alert.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.color.bg,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.color.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: T.font.family.semibold,
    fontSize: 24,
    color: T.color.text.primary,
    flex: 1,
  },
  countBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    color: T.color.white,
    fontSize: 12,
    fontFamily: T.font.family.semibold,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ecebe6',
    borderRadius: 12,
    marginHorizontal: 20,
    padding: 4,
    marginTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: T.color.white,
  },
  tabText: {
    fontFamily: T.font.family.medium,
    fontSize: 14,
    color: T.color.text.muted,
  },
  activeTabText: {
    color: T.color.text.primary,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: T.font.family.semibold,
    fontSize: 12,
    color: T.color.text.muted,
    letterSpacing: 1,
    marginBottom: 16,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: T.color.white,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  alertTitle: {
    flex: 1,
    fontFamily: T.font.family.semibold,
    fontSize: 15,
    color: T.color.text.primary,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 9,
    fontFamily: T.font.family.semibold,
  },
  alertDesc: {
    fontFamily: T.font.family.regular,
    fontSize: 13,
    color: T.color.text.muted,
    lineHeight: 18,
    marginBottom: 8,
  },
  alertTime: {
    fontFamily: T.font.family.regular,
    fontSize: 11,
    color: T.color.text.muted,
  },
});
