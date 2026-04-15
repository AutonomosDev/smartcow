import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };
import { ChevronLeft, Menu, TrendingUp, BarChart3, Target, Info } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { MetricGrid } from '../../components/MetricGrid';

export default function ProductionScreen() {
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
          <Text style={styles.headerTitle}>Producción</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Menu size={20} color={T.color.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Rendimiento</Text>
            <Text style={styles.subtitle}>Fundo San Pedro · Consolidado Semanal</Text>
          </View>

          {/* Efficiency Card */}
          <View style={styles.efficiencyCard}>
            <View style={styles.effHeader}>
              <Text style={styles.effLabel}>EFICIENCIA DE CONVERSIÓN</Text>
              <TrendingUp size={16} color="#2ecc71" />
            </View>
            <Text style={styles.effValue}>6.4 : 1</Text>
            <Text style={styles.effSub}>kg ración / kg carne (Wagyu F1)</Text>
          </View>

          <MetricGrid 
            items={[
              { label: 'GDP Semanal', value: '1.24 kg' },
              { label: 'Consumo MS', value: '11.2 kg' },
              { label: 'Costo Kg GDP', value: '$1.42' },
              { label: 'Proy. Faena', value: 'Sep 26' }
            ]}
          />

          {/* Production Chart Placeholder */}
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>CURVA DE CRECIMIENTO LOTE 4</Text>
            <View style={styles.chartPlaceholder}>
              <BarChart3 size={40} color="rgba(0,0,0,0.1)" />
              <Text style={styles.chartText}>Curva acumulada vs Ideal</Text>
            </View>
            <View style={styles.chartDetails}>
              <View style={styles.detailItem}>
                <View style={[styles.dot, { backgroundColor: '#1E3A2F' }]} />
                <Text style={styles.detailText}>Real</Text>
              </View>
              <View style={styles.detailItem}>
                <View style={[styles.dot, { backgroundColor: '#ecebe6' }]} />
                <Text style={styles.detailText}>Objetivo</Text>
              </View>
            </View>
          </View>

          <View style={styles.tipCard}>
            <Target size={20} color={T.color.primary} />
            <Text style={styles.tipText}>
              Ajustar ración energética en Potrero Sur podría mejorar el margen un 4% este mes.
            </Text>
          </View>
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
  efficiencyCard: {
    backgroundColor: '#1E3A2F',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  effHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  effLabel: {
    fontSize: 10,
    fontFamily: T.font.family.semibold,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
  },
  effValue: {
    fontSize: 32,
    fontFamily: T.font.family.semibold,
    color: T.color.white,
  },
  effSub: {
    fontSize: 12,
    fontFamily: T.font.family.regular,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  chartSection: {
    backgroundColor: T.color.white,
    borderRadius: 24,
    padding: 24,
    marginTop: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: T.font.family.semibold,
    color: T.color.text.muted,
    letterSpacing: 1,
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 180,
    backgroundColor: '#f8f6f1',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  chartText: {
    fontSize: 12,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
  },
  chartDetails: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailText: {
    fontSize: 12,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#e6f3ec',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: T.font.family.regular,
    color: '#1e3a2f',
    lineHeight: 18,
  },
});
