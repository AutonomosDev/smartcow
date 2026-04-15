import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
const tokens = {
  color: { bg: '#f8f6f1', primary: '#1e3a2f', white: '#ffffff', cream: '#ebe9e3', danger: '#e74c3c', warning: '#f39c12', info: '#1a5276', text: { primary: '#1a1a1a', secondary: '#888888', muted: '#bbbbbb' } },
  font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' }, size: { xs: 10, sm: 11, md: 13, base: 14, lg: 16, xl: 20, xxl: 28 } },
  radius: { card: 14, btn: 12, chip: 20, hero: 16, small: 8 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
};
import { ChevronLeft, Menu } from 'lucide-react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { BarChart } from '../components/BarChart';
import type { RootStackParamList } from '../../App';
import { api, LoteDetalle } from '../lib/api';

type Props = {
  route: RouteProp<RootStackParamList, 'PaddockCharts'>;
};

export default function PaddockChartsScreen({ route }: Props) {
  const navigation = useNavigation<any>();
  const potreroId = route.params?.potreroId ?? '';
  const [lote, setLote] = useState<LoteDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!potreroId) { setLoading(false); return; }
    api.get<LoteDetalle>(`/api/lotes/${potreroId}`)
      .then(setLote)
      .catch(() => setLote(null))
      .finally(() => setLoading(false));
  }, [potreroId]);

  const gdpDisplay = lote?.gdpKgDia !== null && lote?.gdpKgDia !== undefined
    ? `${lote.gdpKgDia} kg`
    : '—';

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
            <ChevronLeft size={24} color={tokens.color.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Menu size={20} color={tokens.color.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={tokens.color.primary} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>{lote?.nombre ?? 'Potrero'}</Text>
              <Text style={styles.subtitle}>
                {lote ? `${lote.totalAnimales} animales · ${lote.diasEnLote} días` : '—'}
              </Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                <Text style={[styles.tabText, styles.activeTabText]}>Resumen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tab}>
                <Text style={styles.tabText}>Notas</Text>
              </TouchableOpacity>
            </View>

            {/* Daily Gain Chart Card */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Ganancia diaria</Text>
              <Text style={styles.gainValue}>{gdpDisplay}</Text>
              {/* AG: reemplazar data hardcodeada con serie temporal cuando exista /api/lotes/:id/pesajes */}
              <BarChart
                data={[0.8, 1.1, 1.0, 1.3, 1.2, 1.5, 1.4, 1.2, 1.6, 1.5, 1.7, lote?.gdpKgDia ?? 1.4]}
                labels={['15 mar', '1 abr', '12 abr']}
              />
            </View>

            {/* Lot Status Card */}
            <View style={[styles.card, { paddingBottom: 20 }]}>
              <Text style={styles.cardTitle}>Estado del lote</Text>

              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Animales</Text>
                  <Text style={styles.metricValue}>{lote?.totalAnimales ?? '—'}</Text>
                  <Text style={styles.metricSub}>{lote?.estado ?? ''}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Peso prom.</Text>
                  <Text style={styles.metricValue}>
                    {lote?.avgPesoActualKg !== null && lote?.avgPesoActualKg !== undefined
                      ? `${lote.avgPesoActualKg} kg`
                      : '—'}
                  </Text>
                  <Text style={styles.metricSub}>actual</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Objetivo</Text>
                  <Text style={styles.metricValue}>
                    {lote?.objetivoPesoKg !== null && lote?.objetivoPesoKg !== undefined
                      ? `${lote.objetivoPesoKg} kg`
                      : '—'}
                  </Text>
                  <Text style={styles.metricSub}>Peso faena</Text>
                </View>
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Ver potrero ahora</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.color.bg,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontFamily: tokens.font.family.semibold,
    fontSize: 24,
    color: tokens.color.text.primary,
  },
  subtitle: {
    fontFamily: tokens.font.family.regular,
    fontSize: 14,
    color: tokens.color.text.muted,
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
    backgroundColor: tokens.color.white,
  },
  tabText: {
    fontFamily: tokens.font.family.medium,
    fontSize: 14,
    color: tokens.color.text.muted,
  },
  activeTabText: {
    color: tokens.color.text.primary,
  },
  card: {
    backgroundColor: tokens.color.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 12,
    color: tokens.color.text.muted,
    fontFamily: tokens.font.family.regular,
    marginBottom: 4,
  },
  gainValue: {
    fontSize: 32,
    fontFamily: tokens.font.family.semibold,
    color: tokens.color.text.primary,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: tokens.font.family.semibold,
    color: tokens.color.text.primary,
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: tokens.color.text.muted,
    fontFamily: tokens.font.family.regular,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontFamily: tokens.font.family.semibold,
    color: tokens.color.text.primary,
  },
  metricSub: {
    fontSize: 10,
    color: tokens.color.text.muted,
    fontFamily: tokens.font.family.regular,
  },
  actionButton: {
    backgroundColor: '#1E3A2F',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  actionButtonText: {
    fontFamily: tokens.font.family.semibold,
    fontSize: 16,
    color: tokens.color.white,
  },
});
