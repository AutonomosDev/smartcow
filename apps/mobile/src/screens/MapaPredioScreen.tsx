import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { tokens } from '../../../../packages/tokens/theme';
import { PotreroPill, Potrero } from '../components/PotreroPill';
import type { RootStackParamList } from '../../App';

MapboxGL.setAccessToken(
  'pk.eyJ1IjoiYXV0b25vbW9zLWRldiIsImEiOiJjbW54aG9tZXkwMmUxMnBxMWY1ZXoyNTRoIn0.52wtPi_tT4B4H1PPu4SfDw'
);

// Coordenadas centradas en Los Lagos, Chile (aprox Fundo San Pedro)
const CENTER_COORDS: [number, number] = [-72.35, -40.58];

export const POTREROS: Potrero[] = [
  {
    id: 'norte',
    nombre: 'Norte',
    ha: 110,
    animales: 110,
    gd: '1.4 kg',
    agua: 92,
    alerta: null,
    coords: [
      [-72.367, -40.568],
      [-72.342, -40.568],
      [-72.342, -40.582],
      [-72.367, -40.582],
      [-72.367, -40.568],
    ],
  },
  {
    id: 'sur',
    nombre: 'Sur',
    ha: 85,
    animales: 78,
    gd: '1.1 kg',
    agua: 0,
    alerta: 'Bebedero',
    coords: [
      [-72.367, -40.583],
      [-72.342, -40.583],
      [-72.342, -40.597],
      [-72.367, -40.597],
      [-72.367, -40.583],
    ],
  },
  {
    id: 'central',
    nombre: 'Central',
    ha: 65,
    animales: 155,
    gd: '1.9 kg',
    agua: 78,
    alerta: null,
    coords: [
      [-72.341, -40.568],
      [-72.322, -40.568],
      [-72.322, -40.584],
      [-72.341, -40.584],
      [-72.341, -40.568],
    ],
  },
  {
    id: 'este',
    nombre: 'Este',
    ha: 40,
    animales: 45,
    gd: '1.6 kg',
    agua: 85,
    alerta: null,
    coords: [
      [-72.341, -40.585],
      [-72.322, -40.585],
      [-72.322, -40.597],
      [-72.341, -40.597],
      [-72.341, -40.585],
    ],
  },
];

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MapaPredio'>;
};

export default function MapaPredioScreen({ navigation }: Props) {
  const [selectedId, setSelectedId] = useState('norte');
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const selectedPotrero = POTREROS.find((p) => p.id === selectedId)!;

  const handleSelectPotrero = (id: string) => {
    setSelectedId(id);
    const p = POTREROS.find((pt) => pt.id === id)!;
    const centerLng = (p.coords[0][0] + p.coords[2][0]) / 2;
    const centerLat = (p.coords[0][1] + p.coords[2][1]) / 2;
    cameraRef.current?.flyTo([centerLng, centerLat], 600);
  };

  const geoJSON: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: POTREROS.map((p) => ({
      type: 'Feature',
      id: p.id,
      properties: {
        id: p.id,
        alerta: p.alerta,
        selected: p.id === selectedId,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [p.coords],
      },
    })),
  };

  const alertaPotrero = POTREROS.find((p) => p.alerta !== null);
  const alertaCenter: [number, number] | null = alertaPotrero
    ? [
        (alertaPotrero.coords[0][0] + alertaPotrero.coords[2][0]) / 2,
        (alertaPotrero.coords[0][1] + alertaPotrero.coords[2][1]) / 2 - 0.004,
      ]
    : null;

  return (
    <View style={styles.container}>
      {/* Header card */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Fundo San Pedro</Text>
            <Text style={styles.headerSub}>4 potreros · 300 ha</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Text style={styles.filterIcon}>⊟</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Mapa */}
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Outdoors}
        compassEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          centerCoordinate={CENTER_COORDS}
          zoomLevel={13}
        />

        {/* Relleno de potreros */}
        <MapboxGL.ShapeSource id="potreros" shape={geoJSON}>
          <MapboxGL.FillLayer
            id="potreros-fill"
            style={{
              fillColor: [
                'case',
                ['==', ['get', 'id'], 'sur'],
                '#e74c3c',
                ['==', ['get', 'selected'], true],
                tokens.color.primary,
                tokens.color.primary,
              ],
              fillOpacity: [
                'case',
                ['==', ['get', 'selected'], true],
                0.55,
                0.25,
              ],
            }}
          />
          <MapboxGL.LineLayer
            id="potreros-border"
            style={{
              lineColor: [
                'case',
                ['==', ['get', 'id'], 'sur'],
                '#e74c3c',
                tokens.color.primary,
              ],
              lineWidth: 1.5,
              lineOpacity: 0.7,
            }}
          />
        </MapboxGL.ShapeSource>

        {/* Label de nombre en cada potrero */}
        {POTREROS.map((p) => {
          const lng = (p.coords[0][0] + p.coords[2][0]) / 2;
          const lat = (p.coords[0][1] + p.coords[2][1]) / 2;
          return (
            <MapboxGL.MarkerView
              key={`label-${p.id}`}
              coordinate={[lng, lat]}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View pointerEvents="none">
                <Text style={styles.potreroLabel}>{p.nombre}</Text>
                <Text style={styles.potreroAnimales}>{p.animales} an.</Text>
              </View>
            </MapboxGL.MarkerView>
          );
        })}

        {/* Pin de alerta */}
        {alertaCenter && alertaPotrero && (
          <MapboxGL.MarkerView
            coordinate={alertaCenter}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.alertPin}>
              <Text style={styles.alertPinIcon}>!</Text>
            </View>
          </MapboxGL.MarkerView>
        )}
      </MapboxGL.MapView>

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        {/* Pill selector */}
        <View style={styles.pillRow}>
          <PotreroPill
            potreros={POTREROS}
            selectedId={selectedId}
            onSelect={handleSelectPotrero}
          />
        </View>

        {/* Card resumen */}
        <TouchableOpacity
          style={styles.summaryCard}
          onPress={() => navigation.navigate('PotreroDetalle', { potreroId: selectedId })}
          activeOpacity={0.85}
        >
          <View style={styles.summaryRow}>
            <Text style={styles.summaryName}>{selectedPotrero.nombre}</Text>
            <View style={[styles.statusBadge, selectedPotrero.alerta ? styles.statusBadgeAlert : styles.statusBadgeOk]}>
              <Text style={[styles.statusBadgeText, selectedPotrero.alerta ? styles.statusBadgeTextAlert : styles.statusBadgeTextOk]}>
                {selectedPotrero.alerta ? `⚠ ${selectedPotrero.alerta}` : 'OK'}
              </Text>
            </View>
          </View>
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Animales</Text>
              <Text style={styles.metricValue}>{selectedPotrero.animales}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>GD hoy</Text>
              <Text style={[styles.metricValue, selectedPotrero.alerta ? styles.metricAlert : null]}>
                {selectedPotrero.gd}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Agua</Text>
              <Text style={[styles.metricValue, selectedPotrero.agua === 0 ? styles.metricAlert : null]}>
                {selectedPotrero.agua}%
              </Text>
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
    backgroundColor: tokens.color.bg,
  },
  headerSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    marginHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.sm,
    backgroundColor: tokens.color.white,
    borderRadius: tokens.radius.card,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  headerLeft: {},
  headerTitle: {
    fontSize: tokens.font.size.base,
    fontFamily: tokens.font.family.semibold,
    color: tokens.color.text.primary,
  },
  headerSub: {
    fontSize: tokens.font.size.xs,
    fontFamily: tokens.font.family.regular,
    color: tokens.color.text.muted,
    marginTop: 1,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: tokens.radius.small,
    backgroundColor: tokens.color.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    fontSize: 18,
    color: tokens.color.text.primary,
  },
  map: {
    flex: 1,
  },
  bottomPanel: {
    backgroundColor: tokens.color.bg,
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.lg,
  },
  pillRow: {
    marginBottom: tokens.spacing.md,
  },
  summaryCard: {
    marginHorizontal: tokens.spacing.lg,
    backgroundColor: tokens.color.white,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  summaryName: {
    fontSize: tokens.font.size.lg,
    fontFamily: tokens.font.family.semibold,
    color: tokens.color.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: tokens.radius.chip,
  },
  statusBadgeOk: {
    backgroundColor: '#e6f3ec',
  },
  statusBadgeAlert: {
    backgroundColor: '#fde8e8',
  },
  statusBadgeText: {
    fontSize: tokens.font.size.xs,
    fontFamily: tokens.font.family.semibold,
  },
  statusBadgeTextOk: {
    color: tokens.color.primary,
  },
  statusBadgeTextAlert: {
    color: '#c0392b',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: tokens.spacing.xl,
  },
  metric: {},
  metricLabel: {
    fontSize: tokens.font.size.xs,
    fontFamily: tokens.font.family.regular,
    color: tokens.color.text.muted,
  },
  metricValue: {
    fontSize: tokens.font.size.md,
    fontFamily: tokens.font.family.semibold,
    color: tokens.color.text.primary,
    marginTop: 1,
  },
  metricAlert: {
    color: tokens.color.danger,
  },
  potreroLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: tokens.color.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  potreroAnimales: {
    fontSize: 9,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  alertPin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: tokens.color.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: tokens.color.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  alertPinIcon: {
    color: tokens.color.white,
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    lineHeight: 16,
  },
});
