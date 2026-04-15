import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };
import { ChevronLeft, Filter, Info, MapPin, AlertCircle, Menu } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function MapScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Simulation of the Mapbox Map */}
      <View style={styles.mapBackground}>
        {/* Paddock Polygons (Simplified UI representation) */}
        <View style={styles.polygonNorte}>
          <Text style={styles.polygonTitle}>Norte</Text>
          <Text style={styles.polygonSub}>110 an.</Text>
        </View>

        <TouchableOpacity 
          style={styles.polygonSur}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('PaddockDetail')}
        >
          <View style={styles.alertMarker}>
            <View style={styles.alertIconPulse}>
              <AlertCircle size={16} color={T.color.white} />
            </View>
            <Text style={styles.alertText}>Sur</Text>
            <View style={styles.alertLabelContainer}>
              <Text style={styles.alertLabel}>▲ Bebedero</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.polygonCentral}>
          <Text style={styles.polygonTitle}>Central</Text>
        </View>

        <View style={styles.polygonEste}>
          <Text style={styles.polygonTitle}>Este</Text>
        </View>
      </View>

      {/* Header Overlays */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.fundoCard}>
            <Text style={styles.fundoTitle}>Fundo San Pedro</Text>
            <Text style={styles.fundoSub}>4 potreros · 110 ha</Text>
          </View>
          
          <TouchableOpacity style={styles.iconButton}>
            <Menu size={20} color={T.color.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Bottom UI components */}
      <View style={styles.bottomOverlay}>
        {/* Selector de potreros */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.selectorScroll}
          contentContainerStyle={styles.selectorContent}
        >
          <TouchableOpacity style={styles.selectorBtn}>
            <Text style={styles.selectorBtnText}>Norte</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.selectorBtn, styles.selectorBtnAlert]}>
            <Text style={[styles.selectorBtnText, styles.selectorBtnTextAlert]}>Sur ▲</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectorBtn}>
            <Text style={styles.selectorBtnText}>Central</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectorBtn}>
            <Text style={styles.selectorBtnText}>Este</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Info Card */}
        <TouchableOpacity 
          style={styles.infoCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('PaddockDetail')}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Potrero Norte</Text>
            <View style={styles.okBadge}>
              <Text style={styles.okBadgeText}>OK</Text>
            </View>
          </View>
          
          <View style={styles.cardMetrics}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Animales</Text>
              <Text style={styles.metricValue}>110</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>GD hoy</Text>
              <Text style={styles.metricValue}>1.4 kg</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Agua</Text>
              <Text style={styles.metricValue}>92%</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d6e6cc', // Map base color
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#e6f3ec', // Slightly different green for terrain
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fundoCard: {
    backgroundColor: T.color.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fundoTitle: {
    fontFamily: T.font.family.semibold,
    fontSize: 16,
    color: T.color.text.primary,
  },
  fundoSub: {
    fontFamily: T.font.family.regular,
    fontSize: 12,
    color: T.color.text.muted,
  },
  iconButton: {
    backgroundColor: T.color.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Polygons (Replicating mockup layout)
  polygonNorte: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    width: '70%',
    height: '18%',
    backgroundColor: '#acc09a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#95ab82',
    justifyContent: 'center',
    alignItems: 'center',
  },
  polygonSur: {
    position: 'absolute',
    top: '45%',
    left: '10%',
    width: '75%',
    height: '20%',
    backgroundColor: '#dec5a1', // Different color for Sur to match mockup
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c6ad8a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  polygonCentral: {
    position: 'absolute',
    top: '68%',
    left: '30%',
    width: '50%',
    height: '12%',
    backgroundColor: '#acc09a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#95ab82',
    justifyContent: 'center',
    alignItems: 'center',
  },
  polygonEste: {
    position: 'absolute',
    top: '25%',
    right: '-10%',
    width: '15%',
    height: '40%',
    backgroundColor: '#acc09a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#95ab82',
  },
  polygonTitle: {
    fontFamily: T.font.family.semibold,
    fontSize: 14,
    color: '#1e3a2fa0',
  },
  polygonSub: {
    fontFamily: T.font.family.regular,
    fontSize: 11,
    color: '#1e3a2f80',
  },
  alertMarker: {
    alignItems: 'center',
  },
  alertIconPulse: {
    backgroundColor: T.color.danger,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: T.color.white,
  },
  alertText: {
    fontFamily: T.font.family.semibold,
    fontSize: 13,
    color: T.color.danger,
    marginTop: 2,
  },
  alertLabelContainer: {
    marginTop: 2,
  },
  alertLabel: {
    fontFamily: T.font.family.regular,
    fontSize: 10,
    color: T.color.danger,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
  },
  selectorScroll: {
    maxHeight: 50,
    marginBottom: 16,
  },
  selectorContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  selectorBtn: {
    backgroundColor: T.color.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  selectorBtnAlert: {
    borderWidth: 1,
    borderColor: T.color.danger,
  },
  selectorBtnText: {
    fontFamily: T.font.family.medium,
    fontSize: 13,
    color: T.color.text.primary,
  },
  selectorBtnTextAlert: {
    color: T.color.danger,
  },
  infoCard: {
    backgroundColor: T.color.white,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: T.font.family.semibold,
    fontSize: 18,
    color: T.color.text.primary,
  },
  okBadge: {
    backgroundColor: '#f1f5f2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  okBadgeText: {
    fontFamily: T.font.family.semibold,
    fontSize: 12,
    color: T.color.primary,
  },
  cardMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontFamily: T.font.family.regular,
    fontSize: 11,
    color: T.color.text.muted,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: T.font.family.semibold,
    fontSize: 18,
    color: T.color.text.primary,
  },
});
