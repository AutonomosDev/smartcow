import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };
import { ChevronLeft, Menu, Battery, Wind, Signal, ChevronRight, Play } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function DroneDashboardScreen() {
  const navigation = useNavigation<any>();

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
          <Text style={styles.headerTitle}>DJI M3E · MSDK V5</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Menu size={20} color={T.color.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Drone</Text>
            <Text style={styles.subtitle}>Fundo San Pedro · Mavic 3 Enterprise</Text>
          </View>

          {/* Status Card */}
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>ESTADO DEL EQUIPO</Text>
            <Text style={styles.equipmentName}>DJI Mavic 3 Enterprise</Text>
            
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemLabel}>Batería</Text>
                  <Battery size={14} color="#2ecc71" />
                </View>
                <Text style={[styles.itemValue, { color: '#2ecc71' }]}>87%</Text>
              </View>
              <View style={styles.statusItem}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemLabel}>Estado</Text>
                </View>
                <Text style={[styles.itemValue, { color: '#2ecc71' }]}>Listo</Text>
              </View>
              <View style={styles.statusItem}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemLabel}>Viento</Text>
                  <Wind size={14} color="#f39c12" />
                </View>
                <Text style={[styles.itemValue, { color: '#f39c12' }]}>18 km/h</Text>
              </View>
            </View>
          </View>

          {/* Flight Window */}
          <View style={styles.windowCard}>
            <Text style={styles.windowTitle}>Ventana de vuelo — OK</Text>
            <Text style={styles.windowDesc}>
              Viento 18 km/h — dentro del límite (25 km/h). Lluvia: no. Siguiente vuelo programado: Sábado 08:00.
            </Text>
          </View>

          {/* Monthly Stats */}
          <View style={styles.statsRow}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatVal}>7</Text>
              <Text style={styles.miniStatLabel}>Vuelos mes</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={[styles.miniStatVal, { color: '#e74c3c' }]}>4</Text>
              <Text style={styles.miniStatLabel}>Cancelados</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatVal}>2 km²</Text>
              <Text style={styles.miniStatLabel}>Cobertura</Text>
            </View>
          </View>

          {/* Missions Section */}
          <Text style={styles.sectionTitle}>MISIONES</Text>
          
          <TouchableOpacity 
            style={styles.missionCard}
            onPress={() => navigation.navigate('ActiveMission')}
          >
            <View style={styles.missionHeader}>
              <Text style={styles.missionTitle}>Vigilancia matutina</Text>
              <View style={styles.missionBadge}>
                <Text style={styles.missionBadgeText}>Completada</Text>
              </View>
            </View>
            <Text style={styles.missionDetails}>Conteo + Bebederos + Cercos</Text>
            <View style={styles.missionFooter}>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Hora</Text>
                <Text style={styles.footerVal}>08:14</Text>
              </View>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Duración</Text>
                <Text style={styles.footerVal}>22 min</Text>
              </View>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Fotos</Text>
                <Text style={styles.footerVal}>148</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.missionCard}>
            <View style={styles.missionHeader}>
              <Text style={styles.missionTitle}>Mapeo potrero Este</Text>
              <View style={[styles.missionBadge, { backgroundColor: '#e6f0f8' }]}>
                <Text style={[styles.missionBadgeText, { color: '#1a5276' }]}>Programada</Text>
              </View>
            </View>
            <Text style={styles.missionDetails}>Fotogrametría 2D</Text>
            <View style={styles.missionFooter}>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Hora</Text>
                <Text style={styles.footerVal}>Sáb 08:00</Text>
              </View>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Duración est.</Text>
                <Text style={styles.footerVal}>35 min</Text>
              </View>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Altitud</Text>
                <Text style={styles.footerVal}>80 m</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.startMissionBtn}>
            <Play size={20} color="#fff" />
            <Text style={styles.startMissionText}>Iniciar misión manual</Text>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
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
  },
  headerTitle: {
    fontFamily: T.font.family.medium,
    fontSize: 12,
    color: T.color.text.muted,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginTop: 10,
    marginBottom: 24,
  },
  title: {
    fontFamily: T.font.family.semibold,
    fontSize: 24,
    color: T.color.text.primary,
  },
  subtitle: {
    fontFamily: T.font.family.regular,
    fontSize: 14,
    color: T.color.text.muted,
  },
  statusCard: {
    backgroundColor: '#1E3A2F',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 10,
    fontFamily: T.font.family.semibold,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  equipmentName: {
    fontSize: 20,
    fontFamily: T.font.family.semibold,
    color: T.color.white,
    marginBottom: 24,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statusItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemLabel: {
    fontSize: 9,
    fontFamily: T.font.family.regular,
    color: 'rgba(255,255,255,0.6)',
  },
  itemValue: {
    fontSize: 16,
    fontFamily: T.font.family.semibold,
  },
  windowCard: {
    backgroundColor: '#e6f3ec',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  windowTitle: {
    fontSize: 14,
    fontFamily: T.font.family.semibold,
    color: '#1e3a2f',
    marginBottom: 4,
  },
  windowDesc: {
    fontSize: 12,
    fontFamily: T.font.family.regular,
    color: '#1e3a2f',
    lineHeight: 18,
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  miniStat: {
    flex: 1,
    backgroundColor: T.color.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  miniStatVal: {
    fontSize: 20,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
  miniStatLabel: {
    fontSize: 10,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: T.font.family.semibold,
    color: T.color.text.muted,
    letterSpacing: 1,
    marginBottom: 16,
  },
  missionCard: {
    backgroundColor: T.color.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  missionTitle: {
    fontSize: 16,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
  missionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#e6f3ec',
    borderRadius: 8,
  },
  missionBadgeText: {
    fontSize: 10,
    fontFamily: T.font.family.semibold,
    color: '#1e3a2f',
  },
  missionDetails: {
    fontSize: 12,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
    marginBottom: 16,
  },
  missionFooter: {
    flexDirection: 'row',
    gap: 24,
  },
  footerItem: {
    gap: 2,
  },
  footerLabel: {
    fontSize: 9,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
  },
  footerVal: {
    fontSize: 13,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
  startMissionBtn: {
    backgroundColor: '#1E3A2F',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  startMissionText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: T.font.family.semibold,
  },
});
