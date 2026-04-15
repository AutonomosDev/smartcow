import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };
import { ChevronLeft, Menu, Share2, Target, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { MetricGrid } from '../../components/MetricGrid';

export default function DroneCVResultsScreen() {
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
          <Text style={styles.headerTitle}>Resultados IA · Misión M3E</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Share2 size={20} color={T.color.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Hallazgos de IA</Text>
            <Text style={styles.subtitle}>Procesamiento completado · 148 fotos</Text>
          </View>

          {/* CV Summary Card */}
          <View style={styles.cvSummaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>ANIMALES TOTAL</Text>
              <Text style={styles.summaryValue}>242</Text>
              <Text style={styles.summaryDelta}>+1 vs esperado</Text>
            </View>
            <View style={[styles.summaryItem, { borderLeftWidth: 1, borderLeftColor: '#f8f6f1' }]}>
              <Text style={styles.summaryLabel}>ANOMALÍAS</Text>
              <Text style={[styles.summaryValue, { color: '#e74c3c' }]}>2</Text>
              <Text style={styles.summaryDelta}>Urgente</Text>
            </View>
          </View>

          <MetricGrid 
            items={[
              { label: 'Confianza IA', value: '98.4%' },
              { label: 'Tiempo Proc.', value: '1.2 min' },
              { label: 'Bebederos', value: 'OK (3/4)', color: '#f39c12' },
              { label: 'Cercos', value: 'OK', color: '#2ecc71' }
            ]}
          />

          {/* List of Findings */}
          <Text style={styles.sectionTitle}>DETALLES DETECTADOS</Text>

          <TouchableOpacity 
            style={styles.findingCard}
            onPress={() => navigation.navigate('FindingDetail', { findingId: '1' })}
          >
            <View style={styles.findingImagePlaceholder}>
              <Target size={24} color="rgba(255,255,255,0.4)" />
              <View style={styles.aiBox} />
            </View>
            <View style={styles.findingContent}>
              <View style={styles.findingHeader}>
                <Text style={styles.findingTitle}>Bebedero vacío</Text>
                <AlertCircle size={16} color="#e74c3c" />
              </View>
              <Text style={styles.findingDesc}>Detectado en Potrero Sur. Nivel de agua: 0%.</Text>
              <View style={styles.findingFooter}>
                <Text style={styles.findingMeta}>Probabilidad: 99.2%</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.findingCard}>
            <View style={styles.findingImagePlaceholder}>
              <Target size={24} color="rgba(255,255,255,0.4)" />
            </View>
            <View style={styles.findingContent}>
              <View style={styles.findingHeader}>
                <Text style={styles.findingTitle}>Cerco dañado (posible)</Text>
                <AlertCircle size={16} color="#f39c12" />
              </View>
              <Text style={styles.findingDesc}>Potrero Norte, sección 12. Posible sombra o rotura.</Text>
              <View style={styles.findingFooter}>
                <Text style={styles.findingMeta}>Probabilidad: 74.5%</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.doneSection}>
            <CheckCircle2 size={32} color="#2ecc71" />
            <Text style={styles.doneText}>Todos los animales del lote principal han sido contabilizados.</Text>
          </View>
          
          <TouchableOpacity style={styles.finishBtn} onPress={() => navigation.navigate('AlertsCenter')}>
            <Text style={styles.finishBtnText}>Ir al centro de alertas</Text>
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
  cvSummaryCard: {
    flexDirection: 'row',
    backgroundColor: T.color.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: T.font.family.semibold,
    color: T.color.text.muted,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 32,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
  summaryDelta: {
    fontSize: 11,
    fontFamily: T.font.family.medium,
    color: T.color.text.muted,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: T.font.family.semibold,
    color: T.color.text.muted,
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 16,
  },
  findingCard: {
    backgroundColor: T.color.white,
    borderRadius: 20,
    flexDirection: 'row',
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  findingImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  aiBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#e74c3c',
    width: 40,
    height: 40,
    top: 20,
    left: 20,
  },
  findingContent: {
    flex: 1,
  },
  findingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  findingTitle: {
    fontSize: 15,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
  findingDesc: {
    fontSize: 12,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
    marginBottom: 8,
  },
  findingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  findingMeta: {
    fontSize: 9,
    fontFamily: T.font.family.medium,
    color: T.color.text.muted,
  },
  doneSection: {
    backgroundColor: '#e6f3ec',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  doneText: {
    fontSize: 14,
    fontFamily: T.font.family.medium,
    color: '#1e3a2f',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  finishBtn: {
    backgroundColor: '#1E3A2F',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: T.font.family.semibold,
  },
});
