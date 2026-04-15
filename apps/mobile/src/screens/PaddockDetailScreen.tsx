import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };
import { ChevronLeft, MoreHorizontal, AlertTriangle, Menu } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function PaddockDetailScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerIcon} 
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={T.color.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIcon}>
          <Menu size={20} color={T.color.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Potrero Sur</Text>
          <Text style={styles.subtitle}>85 ha · Lote Wagyu · Recría</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>Resumen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Historial</Text>
          </TouchableOpacity>
        </View>

        {/* Mini Map */}
        <View style={styles.miniMapContainer}>
          <View style={styles.miniMap}>
            <View style={styles.mapLabel}>
              <Text style={styles.mapLabelText}>Potrero Sur</Text>
            </View>
            <View style={styles.mapAlertCircle}>
              <AlertTriangle size={16} color={T.color.white} />
            </View>
            <View style={styles.mapAreaBadge}>
              <Text style={styles.mapAreaText}>85 ha</Text>
            </View>
          </View>
        </View>

        {/* Alert Card */}
        <View style={styles.alertCard}>
          <View style={styles.alertIndicator} />
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>Bebedero vacío detectado</Text>
            <Text style={styles.alertSub}>Drone 08:14 AM · Asignado a Jaime</Text>
          </View>
        </View>

        {/* Status Grid */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Estado del potrero</Text>
          
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Animales</Text>
              <Text style={styles.gridValue}>78</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Raza</Text>
              <Text style={styles.gridValue}>Wagyu</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>GD semana</Text>
              <Text style={[styles.gridValue, { color: T.color.danger }]}>1.1 kg</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Objetivo</Text>
              <Text style={styles.gridValue}>1.8 kg</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Días engorda</Text>
              <Text style={styles.gridValue}>34</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Agua</Text>
              <Text style={[styles.gridValue, { color: T.color.danger }]}>0%</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Asignar tarea de campo</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.color.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ebe9e3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginTop: 10,
    marginBottom: 20,
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ebe9e3',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: T.color.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontFamily: T.font.family.medium,
    fontSize: 14,
    color: T.color.text.muted,
  },
  activeTabText: {
    color: T.color.text.primary,
  },
  miniMapContainer: {
    marginBottom: 20,
  },
  miniMap: {
    height: 140,
    backgroundColor: '#e6f3ec',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLabel: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(30,58,47,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mapLabelText: {
    color: T.color.white,
    fontFamily: T.font.family.semibold,
    fontSize: 11,
  },
  mapAlertCircle: {
    backgroundColor: T.color.danger,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: T.color.white,
  },
  mapAreaBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: T.color.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mapAreaText: {
    fontFamily: T.font.family.semibold,
    fontSize: 11,
    color: T.color.text.primary,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#fde8e8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  alertIndicator: {
    width: 6,
    height: '100%',
    backgroundColor: T.color.danger,
    borderRadius: 3,
    marginRight: 16,
  },
  alertBody: {
    flex: 1,
  },
  alertTitle: {
    fontFamily: T.font.family.semibold,
    fontSize: 15,
    color: T.color.danger,
    marginBottom: 2,
  },
  alertSub: {
    fontFamily: T.font.family.regular,
    fontSize: 12,
    color: T.color.text.muted,
  },
  statusSection: {
    backgroundColor: T.color.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: T.font.family.semibold,
    fontSize: 18,
    color: T.color.text.primary,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  gridItem: {
    width: '45%',
  },
  gridLabel: {
    fontFamily: T.font.family.regular,
    fontSize: 12,
    color: T.color.text.muted,
    marginBottom: 4,
  },
  gridValue: {
    fontFamily: T.font.family.semibold,
    fontSize: 18,
    color: T.color.text.primary,
  },
  actionButton: {
    backgroundColor: '#1E3A2F',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: T.font.family.semibold,
    fontSize: 16,
    color: T.color.white,
  },
});
