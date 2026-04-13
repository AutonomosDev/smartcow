import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { tokens } from '../../../../packages/tokens/theme';
import { POTREROS } from './MapaPredioScreen';
import type { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PotreroDetalle'>;
  route: RouteProp<RootStackParamList, 'PotreroDetalle'>;
};

type Tab = 'resumen' | 'historial';

// Datos extra para el detalle (hardcodeados según mockup)
const DETALLE: Record<string, {
  raza: string;
  tipo: string;
  objetivo: string;
  diasEngorda: number;
}> = {
  norte: { raza: 'Angus',  tipo: 'Engorda',  objetivo: '1.8 kg', diasEngorda: 47 },
  sur:   { raza: 'Wagyu',  tipo: 'Recría',   objetivo: '1.8 kg', diasEngorda: 34 },
  central: { raza: 'Angus', tipo: 'Engorda', objetivo: '2.0 kg', diasEngorda: 68 },
  este:  { raza: 'Hereford', tipo: 'Cría',   objetivo: '1.5 kg', diasEngorda: 21 },
};

export default function PotreroDetalleScreen({ navigation, route }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('resumen');
  const potreroId = route.params?.potreroId ?? 'sur';
  const potrero = POTREROS.find((p) => p.id === potreroId) ?? POTREROS[1];
  const detalle = DETALLE[potrero.id];

  const miniGeoJSON: GeoJSON.Feature = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [potrero.coords],
    },
  };

  const miniCenter: [number, number] = [
    (potrero.coords[0][0] + potrero.coords[2][0]) / 2,
    (potrero.coords[0][1] + potrero.coords[2][1]) / 2,
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{`Potrero ${potrero.nombre}`}</Text>
          </View>
          <TouchableOpacity style={styles.menuBtn}>
            <Text style={styles.menuIcon}>≡</Text>
          </TouchableOpacity>
        </View>

        {/* Sub-header */}
        <Text style={styles.subHeader}>
          {`${potrero.ha} ha · Lote ${detalle.raza} · ${detalle.tipo}`}
        </Text>

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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mini mapa */}
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
            <MapboxGL.Camera
              centerCoordinate={miniCenter}
              zoomLevel={14}
            />
            <MapboxGL.ShapeSource id="mini-potrero" shape={miniGeoJSON}>
              <MapboxGL.FillLayer
                id="mini-fill"
                style={{
                  fillColor: potrero.alerta ? '#e74c3c' : '#c8b898',
                  fillOpacity: 0.5,
                }}
              />
              <MapboxGL.LineLayer
                id="mini-border"
                style={{
                  lineColor: potrero.alerta ? '#e74c3c' : '#a08060',
                  lineWidth: 1.5,
                }}
              />
            </MapboxGL.ShapeSource>
          </MapboxGL.MapView>
          <View style={styles.haLabel}>
            <Text style={styles.haText}>{potrero.ha} ha</Text>
          </View>
        </View>

        {/* Alert card */}
        {potrero.alerta && (
          <View style={styles.alertCard}>
            <View style={styles.alertBar} />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {`${potrero.alerta} vacío detectado`}
              </Text>
              <Text style={styles.alertSub}>
                Drone 08:14 AM · Asignado a Jaime
              </Text>
            </View>
          </View>
        )}

        {/* Estado del potrero */}
        <View style={styles.estadoCard}>
          <Text style={styles.estadoTitle}>Estado del potrero</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Animales</Text>
              <Text style={styles.gridValue}>{potrero.animales}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Raza</Text>
              <Text style={styles.gridValue}>{detalle.raza}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>GD semana</Text>
              <Text style={[styles.gridValue, styles.gridValueAlert]}>
                {potrero.gd}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Objetivo</Text>
              <Text style={styles.gridValue}>{detalle.objetivo}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Días engorda</Text>
              <Text style={styles.gridValue}>{detalle.diasEngorda}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>Agua</Text>
              <Text style={[styles.gridValue, potrero.agua === 0 ? styles.gridValueAlert : null]}>
                {potrero.agua}%
              </Text>
            </View>
          </View>
        </View>

        {/* Spacer para el botón fijo */}
        <View style={{ height: 80 }} />
      </ScrollView>

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
  alertCard: {
    backgroundColor: '#fde8e8',
    borderRadius: tokens.radius.card,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  alertBar: {
    width: 4,
    backgroundColor: tokens.color.danger,
  },
  alertContent: {
    flex: 1,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
  },
  alertTitle: {
    fontSize: tokens.font.size.sm,
    fontFamily: tokens.font.family.semibold,
    color: '#c0392b',
  },
  alertSub: {
    fontSize: tokens.font.size.xs,
    fontFamily: tokens.font.family.regular,
    color: '#c0392b',
    marginTop: 2,
    opacity: 0.8,
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
