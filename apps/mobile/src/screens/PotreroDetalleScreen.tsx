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
import MapboxGL from '@rnmapbox/maps';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { tokens } from '../../../../packages/tokens/theme';
import type { RootStackParamList } from '../../App';
import { api, LoteDetalle } from '../lib/api';

// Coords hardcodeadas para el mini mapa visual — AG: conectar a tabla `potreros` con campos GIS
const COORDS_MAP: Record<string, { ha: number; coords: [number, number][] }> = {
  default: {
    ha: 0,
    coords: [
      [-72.35, -40.58],
      [-72.34, -40.58],
      [-72.34, -40.59],
      [-72.35, -40.59],
      [-72.35, -40.58],
    ],
  },
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

  // Fallback visual coords para el mini mapa
  const mapData = COORDS_MAP.default;
  const miniGeoJSON: GeoJSON.Feature = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [mapData.coords],
    },
  };
  const miniCenter: [number, number] = [
    (mapData.coords[0][0] + mapData.coords[2][0]) / 2,
    (mapData.coords[0][1] + mapData.coords[2][1]) / 2,
  ];

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

        {/* Sub-header */}
        <Text style={styles.subHeader}>{subHeader}</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'resumen' && styles.tabActive]}
            onPress={() => setActiveTab('resumen')}
          >
            <Text style={[styles.tabText, activeTab === 'resumen' && styles.tabTextActive]}>
              Resumen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'historial' && styles.tabActive]}
            onPress={() => setActiveTab('historial')}
          >
            <Text style={[styles.tabText, activeTab === 'historial' && styles.tabTextActive]}>
              Historial
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={tokens.color.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Mini mapa — coords hardcodeadas hasta conectar GIS */}
          <View style={styles.miniMapContainer}>
            <MapboxGL.MapView
              style={styles.miniMap}
              styleURL={MapboxGL.StyleURL.Outdoors}
              compassEnabled={false}
              logoEnabled={false}
              attributionEnabled={false}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
            >
              <MapboxGL.Camera centerCoordinate={miniCenter} zoomLevel={14} />
              <MapboxGL.ShapeSource id="mini-potrero" shape={miniGeoJSON}>
                <MapboxGL.FillLayer
                  id="mini-fill"
                  style={{ fillColor: '#c8b898', fillOpacity: 0.5 }}
                />
                <MapboxGL.LineLayer
                  id="mini-border"
                  style={{ lineColor: '#a08060', lineWidth: 1.5 }}
                />
              </MapboxGL.ShapeSource>
            </MapboxGL.MapView>
            {mapData.ha > 0 && (
              <View style={styles.haLabel}>
                <Text style={styles.haText}>{mapData.ha} ha</Text>
              </View>
            )}
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
  container: {
    flex: 1,
    backgroundColor: tokens.color.bg,
  },
  safe: {
    backgroundColor: tokens.color.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: tokens.color.text.primary,
    lineHeight: 32,
    marginTop: -2,
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: tokens.spacing.sm,
  },
  headerTitle: {
    fontSize: tokens.font.size.lg,
    fontFamily: tokens.font.family.semibold,
    color: tokens.color.text.primary,
  },
  menuBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 20,
    color: tokens.color.text.primary,
  },
  subHeader: {
    fontSize: tokens.font.size.xs,
    fontFamily: tokens.font.family.regular,
    color: tokens.color.text.muted,
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: tokens.spacing.lg,
    gap: tokens.spacing.sm,
    paddingBottom: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: tokens.radius.btn,
    backgroundColor: tokens.color.bg,
  },
  tabActive: {
    backgroundColor: tokens.color.text.primary,
  },
  tabText: {
    fontSize: tokens.font.size.sm,
    fontFamily: tokens.font.family.medium,
    color: tokens.color.text.secondary,
  },
  tabTextActive: {
    color: tokens.color.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  miniMapContainer: {
    height: 160,
    borderRadius: tokens.radius.card,
    overflow: 'hidden',
    position: 'relative',
  },
  miniMap: {
    flex: 1,
  },
  haLabel: {
    position: 'absolute',
    bottom: tokens.spacing.sm,
    right: tokens.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  haText: {
    color: tokens.color.white,
    fontSize: tokens.font.size.xs,
    fontFamily: tokens.font.family.semibold,
  },
  estadoCard: {
    backgroundColor: tokens.color.white,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.md,
  },
  estadoTitle: {
    fontSize: tokens.font.size.md,
    fontFamily: tokens.font.family.semibold,
    color: tokens.color.text.primary,
    marginBottom: tokens.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: tokens.spacing.md,
  },
  gridItem: {
    width: '50%',
  },
  gridLabel: {
    fontSize: tokens.font.size.xs,
    fontFamily: tokens.font.family.regular,
    color: tokens.color.text.muted,
  },
  gridValue: {
    fontSize: tokens.font.size.md,
    fontFamily: tokens.font.family.semibold,
    color: tokens.color.text.primary,
    marginTop: 1,
  },
  gridValueAlert: {
    color: tokens.color.danger,
  },
  ctaWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: tokens.color.white,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f0ede8',
  },
  ctaBtn: {
    backgroundColor: tokens.color.primary,
    borderRadius: tokens.radius.btn,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  ctaText: {
    fontSize: tokens.font.size.base,
    fontFamily: tokens.font.family.semibold,
    color: tokens.color.white,
  },
});
