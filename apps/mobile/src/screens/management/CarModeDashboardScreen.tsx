import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };
import { ChevronLeft, Map, Mic, Phone, Bell, Wind, AlertCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function CarModeDashboardScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header - Auto Style */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerIcon} 
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={32} color={T.color.white} />
          </TouchableOpacity>
          <View style={styles.clockContainer}>
            <Text style={styles.clock}>08:14</Text>
            <Text style={styles.date}>LUNES 14 ABR</Text>
          </View>
          <View style={styles.tempContainer}>
            <Text style={styles.temp}>6°</Text>
            <Wind size={20} color="#f39c12" />
          </View>
        </View>

        {/* High Contrast Cards */}
        <View style={styles.content}>
          <TouchableOpacity 
            style={[styles.mainCard, styles.alertCard]}
            onPress={() => navigation.navigate('AlertDetail', { alertId: '1' })}
          >
            <AlertCircle size={40} color="#fff" />
            <View style={styles.cardTextContent}>
              <Text style={styles.cardTitle}>ALERTA URGENTE</Text>
              <Text style={styles.cardDesc}>Bebedero Potrero Sur Vacío</Text>
            </View>
            <Text style={styles.timeTag}>AHORA</Text>
          </TouchableOpacity>

          <View style={styles.gridRow}>
            <TouchableOpacity 
              style={[styles.gridCard, { backgroundColor: '#212121' }]}
              onPress={() => navigation.navigate('DroneDashboard')}
            >
              <Map size={32} color={T.color.white} />
              <Text style={styles.gridLabel}>MAPA / DRONE</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.gridCard, { backgroundColor: '#1E3A2F' }]}>
              <Mic size={32} color={T.color.white} />
              <Text style={styles.gridLabel}>COMANDO VOZ</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.machineryCard}>
            <View style={styles.machineryInfo}>
              <Text style={styles.machLabel}>VEHÍCULO ACTUAL</Text>
              <Text style={styles.machName}>Toyota Hilux (San Pedro #2)</Text>
            </View>
            <View style={styles.fuelContainer}>
              <View style={styles.fuelBar}>
                <View style={[styles.fuelFill, { width: '84%' }]} />
              </View>
              <Text style={styles.fuelText}>84%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Quick Actions */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footBtn}>
            <Phone size={28} color="#fff" />
            <Text style={styles.footLabel}>LLAMAR JP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footBtn} onPress={() => navigation.navigate('AlertsCenter')}>
            <Bell size={28} color="#fff" />
            <Text style={styles.footLabel}>ALERTAS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background for car mode
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockContainer: {
    alignItems: 'center',
  },
  clock: {
    fontSize: 40,
    fontFamily: T.font.family.semibold,
    color: '#fff',
  },
  date: {
    fontSize: 12,
    fontFamily: T.font.family.semibold,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  temp: {
    fontSize: 24,
    fontFamily: T.font.family.semibold,
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 20,
  },
  mainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    minHeight: 120,
  },
  alertCard: {
    backgroundColor: '#e74c3c', // Red for car alert
  },
  cardTextContent: {
    flex: 1,
    marginLeft: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: T.font.family.semibold,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  cardDesc: {
    fontSize: 22,
    fontFamily: T.font.family.semibold,
    color: '#fff',
    marginTop: 4,
  },
  timeTag: {
    fontSize: 10,
    fontFamily: T.font.family.semibold,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 20,
  },
  gridCard: {
    flex: 1,
    height: 140,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  gridLabel: {
    fontSize: 12,
    fontFamily: T.font.family.semibold,
    color: '#fff',
    letterSpacing: 0.5,
  },
  machineryCard: {
    backgroundColor: '#333',
    padding: 24,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  machineryInfo: {
    flex: 1,
  },
  machLabel: {
    fontSize: 10,
    fontFamily: T.font.family.semibold,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  machName: {
    fontSize: 16,
    fontFamily: T.font.family.semibold,
    color: '#fff',
  },
  fuelContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  fuelBar: {
    width: 60,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
  },
  fuelFill: {
    height: '100%',
    backgroundColor: '#7ecfa0',
    borderRadius: 3,
  },
  fuelText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: T.font.family.semibold,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 20,
  },
  footBtn: {
    flex: 1,
    height: 90,
    backgroundColor: '#222',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footLabel: {
    fontSize: 11,
    fontFamily: T.font.family.semibold,
    color: '#fff',
  },
});
