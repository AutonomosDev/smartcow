import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';
import { api, LoteDetalle } from '../lib/api';

const T = {
  color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e', secondary: '#555' } },
  font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } },
  spacing: { sm: 8, md: 16, lg: 20 },
  radius: { card: 20, btn: 14, chip: 20 },
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PotreroDetalle'>;
  route: RouteProp<RootStackParamList, 'PotreroDetalle'>;
};

type Tab = 'resumen' | 'historial';

export default function PotreroDetalleScreen({ navigation, route }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('resumen');
  const [lote, setLote] = useState<LoteDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  const potreroId = route.params?.potreroId ?? '';

  useEffect(() => {
    if (!potreroId) return;
    setLoading(true);
    api.get<LoteDetalle>(`/api/lotes/${potreroId}`)
      .then(setLote)
      .catch(() => setLote(null))
      .finally(() => setLoading(false));
  }, [potreroId]);

  const titulo = lote?.nombre ?? 'Potrero';
  const subHeader = lote
    ? `${lote.totalAnimales} animales · ${lote.diasEnLote} días en lote`
    : '—';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{titulo}</Text>
          </View>
          <TouchableOpacity style={styles.menuBtn}>
            <Text style={styles.menuIcon}>≡</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subHeader}>{subHeader}</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'resumen' && styles.tabActive]}
            onPress={() => setActiveTab('resumen')}
          >
            <Text style={[styles.tabText, activeTab === 'resumen' && styles.tabTextActive]}>Resumen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'historial' && styles.tabActive]}
            onPress={() => setActiveTab('historial')}
          >
            <Text style={[styles.tabText, activeTab === 'historial' && styles.tabTextActive]}>Historial</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={T.color.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Mini mapa placeholder */}
          <View style={styles.miniMapContainer}>
            <View style={styles.miniMapPlaceholder}>
              <Text style={styles.miniMapLabel}>Potrero · Los Lagos, Chile</Text>
              <Text style={styles.miniMapNote}>Mapa GIS próximamente</Text>
            </View>
          </View>

          {/* Estado del lote */}
          {lote && (
            <View style={styles.estadoCard}>
              <Text style={styles.estadoTitle}>Estado del lote</Text>
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Animales</Text>
                  <Text style={styles.gridValue}>{lote.totalAnimales}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Días en lote</Text>
                  <Text style={styles.gridValue}>{lote.diasEnLote}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>GDP (kg/día)</Text>
                  <Text style={[
                    styles.gridValue,
                    lote.gdpKgDia !== null && lote.objetivoPesoKg !== null && lote.gdpKgDia < 1.0
                      ? styles.gridValueAlert
                      : null,
                  ]}>
                    {lote.gdpKgDia !== null ? `${lote.gdpKgDia} kg` : '—'}
                  </Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Objetivo</Text>
                  <Text style={styles.gridValue}>
                    {lote.objetivoPesoKg !== null ? `${lote.objetivoPesoKg} kg` : '—'}
                  </Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Peso prom. entrada</Text>
                  <Text style={styles.gridValue}>
                    {lote.avgPesoEntradaKg !== null ? `${lote.avgPesoEntradaKg} kg` : '—'}
                  </Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Peso prom. actual</Text>
                  <Text style={styles.gridValue}>
                    {lote.avgPesoActualKg !== null ? `${lote.avgPesoActualKg} kg` : '—'}
                  </Text>
                </View>
              </View>
            </View>
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* CTA fijo */}
      <View style={styles.ctaWrapper}>
        <SafeAreaView>
          <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85}>
            <Text style={styles.ctaText}>Asignar tarea de campo</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.color.bg },
  safe: { backgroundColor: T.color.white },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: T.spacing.md,
    paddingTop: T.spacing.sm,
    paddingBottom: T.spacing.sm,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 28, color: T.color.text.primary, lineHeight: 32, marginTop: -2 },
  headerCenter: { flex: 1, paddingHorizontal: T.spacing.sm },
  headerTitle: { fontSize: 18, fontFamily: T.font.family.semibold, color: T.color.text.primary },
  menuBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { fontSize: 20, color: T.color.text.primary },
  subHeader: {
    fontSize: 12,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
    paddingHorizontal: T.spacing.lg,
    paddingBottom: T.spacing.sm,
  },
  tabs: { flexDirection: 'row', paddingHorizontal: T.spacing.lg, gap: T.spacing.sm, paddingBottom: 1 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: T.radius.btn, backgroundColor: T.color.bg },
  tabActive: { backgroundColor: T.color.text.primary },
  tabText: { fontSize: 13, fontFamily: T.font.family.medium, color: T.color.text.secondary },
  tabTextActive: { color: T.color.white },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: T.spacing.md, paddingHorizontal: T.spacing.lg, gap: T.spacing.md },
  miniMapContainer: { height: 160, borderRadius: T.radius.card, overflow: 'hidden' },
  miniMapPlaceholder: {
    flex: 1,
    backgroundColor: '#e6f3ec',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniMapLabel: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: T.color.primary },
  miniMapNote: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: T.color.text.muted, marginTop: 4 },
  estadoCard: { backgroundColor: T.color.white, borderRadius: T.radius.card, padding: T.spacing.md },
  estadoTitle: { fontSize: 15, fontFamily: T.font.family.semibold, color: T.color.text.primary, marginBottom: T.spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: T.spacing.md },
  gridItem: { width: '50%' },
  gridLabel: { fontSize: 12, fontFamily: T.font.family.regular, color: T.color.text.muted },
  gridValue: { fontSize: 15, fontFamily: T.font.family.semibold, color: T.color.text.primary, marginTop: 1 },
  gridValueAlert: { color: T.color.danger },
  ctaWrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: T.color.white,
    paddingHorizontal: T.spacing.lg,
    paddingTop: T.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f0ede8',
  },
  ctaBtn: { backgroundColor: T.color.primary, borderRadius: T.radius.btn, paddingVertical: 14, alignItems: 'center', marginBottom: T.spacing.sm },
  ctaText: { fontSize: 16, fontFamily: T.font.family.semibold, color: T.color.white },
});
