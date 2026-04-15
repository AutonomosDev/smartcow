import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };
import { ChevronLeft, MoreHorizontal, Battery, Navigation, Signal, Target, Camera } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function ActiveMissionScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Map Placeholder with SVG Telemetry */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          {/* Simulated Satellite View Background */}
          <View style={styles.satLayer}>
            <Svg height="100%" width="100%" viewBox="0 0 400 600">
              {/* Simulated Flight Path */}
              <Path
                d="M50,100 L150,120 L280,180 L320,300 L250,450 L100,480"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="5,5"
                fill="none"
              />
              {/* Area boundaries */}
              <Path
                d="M20,50 L380,50 L380,550 L20,550 Z"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
                fill="none"
              />
              {/* Drone Position */}
              <Circle cx="250" cy="450" r="8" fill="#1e3a2f" stroke="white" strokeWidth="2" />
              <Circle cx="250" cy="450" r="15" fill="rgba(30,58,47,0.3)" />
              
              {/* Findings Icons */}
              <Circle cx="280" cy="180" r="6" fill="#e74c3c" />
              <Circle cx="150" cy="120" r="6" fill="#f39c12" />
            </Svg>
          </View>
        </View>

        {/* Telemetry Overlay Top */}
        <SafeAreaView style={styles.topOverlay}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerIcon} 
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft size={24} color={T.color.white} />
            </TouchableOpacity>
            <View style={styles.missionInfo}>
              <Text style={styles.missionStatus}>VIGILANCIA EN VIVO</Text>
              <Text style={styles.missionTime}>00:14:22</Text>
            </View>
            <TouchableOpacity style={styles.headerIcon}>
              <MoreHorizontal size={24} color={T.color.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.badgesRow}>
            <View style={styles.teleBadge}>
              <Battery size={14} color="#7ecfa0" />
              <Text style={styles.teleValue}>87%</Text>
            </View>
            <View style={styles.teleBadge}>
              <Navigation size={14} color="#fff" />
              <Text style={styles.teleValue}>12m/s</Text>
            </View>
            <View style={styles.teleBadge}>
              <Signal size={14} color="#fff" />
              <Text style={styles.teleValue}>RC 0.8s</Text>
            </View>
          </View>
        </SafeAreaView>

        {/* Telemetry Overlay Bottom */}
        <View style={styles.bottomOverlay}>
          <View style={styles.teleGrid}>
            <View style={styles.teleItem}>
              <Text style={styles.teleLabel}>ALTITUD</Text>
              <Text style={styles.teleBigVal}>82 m</Text>
            </View>
            <View style={styles.teleItem}>
              <Text style={styles.teleLabel}>DISTANCIA</Text>
              <Text style={styles.teleBigVal}>1,2 km</Text>
            </View>
            <View style={styles.teleItem}>
              <Text style={styles.teleLabel}>MODO</Text>
              <Text style={styles.teleBigVal}>WAYPOINT</Text>
            </View>
          </View>

          {/* Real-time Findings */}
          <View style={styles.findingsCard}>
            <Text style={styles.findingsTitle}>HALLAZGOS (2)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              <TouchableOpacity 
                style={styles.findingItem}
                onPress={() => navigation.navigate('FindingDetail', { findingId: '1' })}
              >
                <View style={[styles.findingDot, { backgroundColor: '#e74c3c' }]} />
                <View>
                  <Text style={styles.findingText}>Bebedero vacío</Text>
                  <Text style={styles.findingSub}>Potrero Sur · 08:14</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.findingItem}>
                <View style={[styles.findingDot, { backgroundColor: '#f39c12' }]} />
                <View>
                  <Text style={styles.findingText}>Animal aislado</Text>
                  <Text style={styles.findingSub}>Potrero Norte · 08:10</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
          
          <TouchableOpacity 
            style={styles.stopBtn}
            onPress={() => navigation.navigate('DroneCVResults')}
          >
            <Text style={styles.stopBtnText}>Finalizar misión</Text>
          </TouchableOpacity>
        </View>

        {/* Floating Actions Right */}
        <View style={styles.floatingActions}>
          <TouchableOpacity style={styles.floatBtn}>
            <Target size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.floatBtn}>
            <Camera size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mapContainer: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  satLayer: {
    flex: 1,
    backgroundColor: '#2c3e50', // Dark forest green-blue
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missionInfo: {
    alignItems: 'center',
  },
  missionStatus: {
    fontSize: 10,
    fontFamily: T.font.family.semibold,
    color: '#fff',
    letterSpacing: 1,
  },
  missionTime: {
    fontSize: 20,
    fontFamily: T.font.family.semibold,
    color: '#fff',
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  teleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  teleValue: {
    color: '#fff',
    fontSize: 11,
    fontFamily: T.font.family.medium,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  teleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  teleItem: {
    alignItems: 'flex-start',
  },
  teleLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: T.font.family.semibold,
    marginBottom: 4,
  },
  teleBigVal: {
    fontSize: 18,
    color: '#fff',
    fontFamily: T.font.family.semibold,
  },
  findingsCard: {
    marginBottom: 24,
  },
  findingsTitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: T.font.family.semibold,
    letterSpacing: 1,
    marginBottom: 12,
  },
  findingItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginRight: 10,
    minWidth: 160,
  },
  findingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  findingText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: T.font.family.semibold,
  },
  findingSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontFamily: T.font.family.regular,
  },
  stopBtn: {
    backgroundColor: '#e74c3c',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: T.font.family.semibold,
  },
  floatingActions: {
    position: 'absolute',
    right: 20,
    top: 180,
    gap: 12,
  },
  floatBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});
