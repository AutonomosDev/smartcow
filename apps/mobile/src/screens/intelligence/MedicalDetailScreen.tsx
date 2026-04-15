import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };
import { ChevronLeft, Menu, AlertCircle, Clock, Thermometer, ShieldCheck } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function MedicalDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { id } = route.params || { id: '1' };

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
          <Text style={styles.headerTitle}>Detalle Tratamiento</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Menu size={20} color={T.color.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.drugCard}>
            <Text style={styles.drugLabel}>ANTIBIÓTICO</Text>
            <Text style={styles.drugName}>Draxxin (Tulitromicina)</Text>
            <Text style={styles.dosage}>Dosis: 10 ml · Vía SC</Text>
          </View>

          {/* Withholding Period Warning */}
          <View style={styles.warningCard}>
            <ShieldCheck size={24} color="#f39c12" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>PERIODO DE CARENCIA</Text>
              <Text style={styles.warningValue}>44 días restantes</Text>
              <Text style={styles.warningText}>No apto para faena hasta el 28 de mayo.</Text>
            </View>
          </View>

          {/* Protocol Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROTOCOLO RESPIRATORIO</Text>
            <View style={styles.grid}>
              <View style={styles.gridBox}>
                <Clock size={18} color={T.color.text.muted} />
                <Text style={styles.boxLabel}>Frecuencia</Text>
                <Text style={styles.boxValue}>Cada 48h</Text>
              </View>
              <View style={styles.gridBox}>
                <Thermometer size={18} color={T.color.text.muted} />
                <Text style={styles.boxLabel}>Mantener</Text>
                <Text style={styles.boxValue}>2° - 8° C</Text>
              </View>
            </View>
          </View>

          {/* Application Log */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>REGISTRO DE APLICACIÓN</Text>
            <View style={styles.logItem}>
              <View style={[styles.logDot, { backgroundColor: '#7ecfa0' }]} />
              <View style={styles.logContent}>
                <Text style={styles.logTitle}>Aplicación 1 completada</Text>
                <Text style={styles.logMeta}>12 Abr · 08:30 · P. Soto</Text>
              </View>
            </View>
            <View style={styles.logItem}>
              <View style={[styles.logDot, { backgroundColor: '#f39c12' }]} />
              <View style={styles.logContent}>
                <Text style={styles.logTitle}>Aplicación 2 pendiente</Text>
                <Text style={styles.logMeta}>Hoy (14 Abr) · 18:00</Text>
              </View>
            </View>
            <View style={[styles.logItem, { opacity: 0.5 }]}>
              <View style={[styles.logDot, { backgroundColor: '#ebe9e3' }]} />
              <View style={styles.logContent}>
                <Text style={styles.logTitle}>Aplicación 3 futura</Text>
                <Text style={styles.logMeta}>16 Abr · 08:00</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.confirmBtn}>
            <Text style={styles.confirmBtnText}>Registrar Aplicación Hoy</Text>
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
    fontSize: 14,
    color: T.color.text.muted,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  drugCard: {
    backgroundColor: '#1E3A2F',
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    marginBottom: 16,
  },
  drugLabel: {
    fontSize: 10,
    fontFamily: T.font.family.semibold,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  drugName: {
    fontSize: 22,
    fontFamily: T.font.family.semibold,
    color: T.color.white,
    marginTop: 4,
    marginBottom: 12,
  },
  dosage: {
    fontSize: 14,
    fontFamily: T.font.family.medium,
    color: 'rgba(255,255,255,0.8)',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fdf0e6',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 20,
    marginBottom: 32,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 10,
    fontFamily: T.font.family.semibold,
    color: '#f39c12',
    letterSpacing: 1,
    marginBottom: 4,
  },
  warningValue: {
    fontSize: 20,
    fontFamily: T.font.family.semibold,
    color: '#f39c12',
  },
  warningText: {
    fontSize: 12,
    fontFamily: T.font.family.regular,
    color: '#9b5e1a',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: T.font.family.semibold,
    color: T.color.text.muted,
    letterSpacing: 1,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  gridBox: {
    flex: 1,
    backgroundColor: T.color.white,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  boxLabel: {
    fontSize: 10,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
    marginTop: 4,
  },
  boxValue: {
    fontSize: 14,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logContent: {
    flex: 1,
  },
  logTitle: {
    fontSize: 14,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
  logMeta: {
    fontSize: 12,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: '#1E3A2F',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: T.font.family.semibold,
  },
});
