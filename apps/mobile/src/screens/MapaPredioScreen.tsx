import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PotreroPill, Potrero } from '../components/PotreroPill';
import type { RootStackParamList } from '../../App';
import { api, LoteResumen } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const T = {
  color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } },
  font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } },
  spacing: { sm: 8, md: 16, lg: 20, xl: 24 },
  radius: { small: 8, card: 20, btn: 14, chip: 20 },
};

export const POTREROS: Potrero[] = [
  { id: 'norte',   nombre: 'Norte',   ha: 110, animales: 110, gd: '1.4 kg', agua: 92, alerta: null,        coords: [[-72.367,-40.568],[-72.342,-40.568],[-72.342,-40.582],[-72.367,-40.582],[-72.367,-40.568]] },
  { id: 'sur',     nombre: 'Sur',     ha: 85,  animales: 78,  gd: '1.1 kg', agua: 0,  alerta: 'Bebedero',  coords: [[-72.367,-40.583],[-72.342,-40.583],[-72.342,-40.597],[-72.367,-40.597],[-72.367,-40.583]] },
  { id: 'central', nombre: 'Central', ha: 65,  animales: 155, gd: '1.9 kg', agua: 78, alerta: null,        coords: [[-72.341,-40.568],[-72.322,-40.568],[-72.322,-40.584],[-72.341,-40.584],[-72.341,-40.568]] },
  { id: 'este',    nombre: 'Este',    ha: 40,  animales: 45,  gd: '1.6 kg', agua: 85, alerta: null,        coords: [[-72.341,-40.585],[-72.322,-40.585],[-72.322,-40.597],[-72.341,-40.597],[-72.341,-40.585]] },
];

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MapaPredio'>;
};

export default function MapaPredioScreen({ navigation }: Props) {
  const [selectedId, setSelectedId] = useState('norte');
  const { predioId } = useAuth();
  const [potreros, setPotreros] = useState<Potrero[]>(POTREROS);
  const [loteIds, setLoteIds] = useState<number[]>([]);

  useEffect(() => {
    api.get<LoteResumen[]>(`/api/predio/${predioId}/lotes`)
      .then((lotes) => {
        if (!lotes.length) return;
        const enriched = POTREROS.map((p, i) => {
          const lote = lotes[i];
          if (!lote) return p;
          return { ...p, animales: lote.totalAnimales, gd: '—' };
        });
        setPotreros(enriched);
        setLoteIds(lotes.map((l) => l.id));
      })
      .catch(() => {});
  }, [predioId]);

  const selectedPotrero = potreros.find((p) => p.id === selectedId)!;

  const handleSelectPotrero = (id: string) => setSelectedId(id);

  // Colores por potrero para el placeholder
  const POTRERO_COLORS: Record<string, string> = {
    norte: '#2d6a4f',
    central: '#40916c',
    este: '#52b788',
    sur: '#e74c3c',
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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

      {/* Placeholder mapa */}
      <View style={styles.map}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderTitle}>Mapa del Predio</Text>
          <Text style={styles.mapPlaceholderSub}>Fundo San Pedro · Los Lagos, Chile</Text>
          <View style={styles.mapGrid}>
            {POTREROS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.mapCell,
                  { backgroundColor: POTRERO_COLORS[p.id] ?? T.color.primary },
                  selectedId === p.id && styles.mapCellSelected,
                ]}
                onPress={() => handleSelectPotrero(p.id)}
              >
                <Text style={styles.mapCellName}>{p.nombre}</Text>
                <Text style={styles.mapCellHa}>{p.ha} ha</Text>
                {p.alerta && <Text style={styles.mapCellAlert}>⚠</Text>}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.mapNote}>Mapa GIS disponible próximamente</Text>
        </View>
      </View>

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.pillRow}>
          <PotreroPill
            potreros={POTREROS}
            selectedId={selectedId}
            onSelect={handleSelectPotrero}
          />
        </View>

        <TouchableOpacity
          style={styles.summaryCard}
          onPress={() => {
            const idx = potreros.findIndex((p) => p.id === selectedId);
            const realId = loteIds[idx] != null ? String(loteIds[idx]) : selectedId;
            navigation.navigate('PaddockCharts', { potreroId: realId });
          }}
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
  container: { flex: 1, backgroundColor: T.color.bg },
  headerSafe: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  header: {
    marginHorizontal: T.spacing.lg,
    marginTop: T.spacing.sm,
    backgroundColor: T.color.white,
    borderRadius: T.radius.card,
    paddingHorizontal: T.spacing.md,
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
  headerTitle: { fontSize: 16, fontFamily: T.font.family.semibold, color: T.color.text.primary },
  headerSub: { fontSize: 12, fontFamily: T.font.family.regular, color: T.color.text.muted, marginTop: 1 },
  filterBtn: { width: 36, height: 36, borderRadius: T.radius.small, backgroundColor: T.color.bg, alignItems: 'center', justifyContent: 'center' },
  filterIcon: { fontSize: 18, color: T.color.text.primary },
  map: { flex: 1 },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e8f4ec',
    paddingTop: 90,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  mapPlaceholderTitle: { fontSize: 18, fontFamily: 'DMSans_600SemiBold', color: T.color.primary, marginBottom: 4 },
  mapPlaceholderSub: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: T.color.text.muted, marginBottom: 24 },
  mapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' },
  mapCell: {
    width: '48%',
    height: 90,
    borderRadius: 16,
    padding: 14,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.85,
  },
  mapCellSelected: { opacity: 1, borderWidth: 2, borderColor: T.color.white },
  mapCellName: { fontSize: 16, fontFamily: 'DMSans_600SemiBold', color: T.color.white },
  mapCellHa: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  mapCellAlert: { fontSize: 16, marginTop: 4 },
  mapNote: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: T.color.text.muted, marginTop: 16 },
  bottomPanel: { backgroundColor: T.color.bg, paddingTop: T.spacing.md, paddingBottom: T.spacing.lg },
  pillRow: { marginBottom: T.spacing.md },
  summaryCard: {
    marginHorizontal: T.spacing.lg,
    backgroundColor: T.color.white,
    borderRadius: T.radius.card,
    padding: T.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: T.spacing.sm },
  summaryName: { fontSize: 18, fontFamily: T.font.family.semibold, color: T.color.text.primary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: T.radius.chip },
  statusBadgeOk: { backgroundColor: '#e6f3ec' },
  statusBadgeAlert: { backgroundColor: '#fde8e8' },
  statusBadgeText: { fontSize: 12, fontFamily: T.font.family.semibold },
  statusBadgeTextOk: { color: T.color.primary },
  statusBadgeTextAlert: { color: '#c0392b' },
  metricsRow: { flexDirection: 'row', gap: T.spacing.xl },
  metric: {},
  metricLabel: { fontSize: 12, fontFamily: T.font.family.regular, color: T.color.text.muted },
  metricValue: { fontSize: 15, fontFamily: T.font.family.semibold, color: T.color.text.primary, marginTop: 1 },
  metricAlert: { color: T.color.danger },
});
