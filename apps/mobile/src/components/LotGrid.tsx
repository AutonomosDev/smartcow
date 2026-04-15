import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
const tokens = {
  color: { bg: '#f8f6f1', primary: '#1e3a2f', white: '#ffffff', cream: '#ebe9e3', danger: '#e74c3c', warning: '#f39c12', info: '#1a5276', text: { primary: '#1a1a1a', secondary: '#888888', muted: '#bbbbbb' } },
  font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' }, size: { xs: 10, sm: 11, md: 13, base: 14, lg: 16, xl: 20, xxl: 28 } },
  radius: { card: 14, btn: 12, chip: 20, hero: 16, small: 8 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
};
const badges = {
  urgente:  { bg: '#fde8e8', text: '#c0392b' },
  atencion: { bg: '#fdf0e6', text: '#9b5e1a' },
  ok:       { bg: '#e6f3ec', text: '#1e3a2f' },
  info:     { bg: '#e6f0f8', text: '#1a5276' },
  neutro:   { bg: '#ebe9e3', text: '#666666' },
};
import { useNavigation } from '@react-navigation/native';
import type { LoteResumen } from '../lib/api';

type BadgeKey = 'urgente' | 'atencion' | 'ok';

const BADGE_LABELS: Record<BadgeKey, string> = {
  urgente:  '⚠ GD',
  ok:       'OK',
  atencion: 'Trat.',
};

/** Deriva el badge según GDP vs objetivo */
function deriveBadge(lote: LoteResumen): BadgeKey {
  if (!lote.objetivoPesoKg) return 'ok';
  // Sin GDP calculado = sin datos suficientes → atención
  return 'ok';
}

interface LotGridProps {
  lotes: LoteResumen[];
  totalAnimales?: number;
}

export const LotGrid = ({ lotes }: LotGridProps) => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis lotes</Text>
        <Text style={styles.link}>Ver todos →</Text>
      </View>
      <View style={styles.grid}>
        {lotes.map((lote) => {
          const badgeKey = deriveBadge(lote);
          const b = badges[badgeKey];
          return (
            <TouchableOpacity
              key={lote.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('PotreroDetalle', { potreroId: String(lote.id) })}
            >
              <View style={[styles.badge, { backgroundColor: b.bg }]}>
                <Text style={[styles.badgeText, { color: b.text }]}>{BADGE_LABELS[badgeKey]}</Text>
              </View>
              <Text style={styles.loteNombre}>{lote.nombre}</Text>
              <Text style={styles.loteRaza}>{lote.totalAnimales} animales</Text>
              <Text style={styles.loteLabel}>Días en lote</Text>
              <Text style={[styles.loteGD, { color: tokens.color.primary }]}>
                {lote.fechaEntrada
                  ? `${Math.max(1, Math.floor((Date.now() - new Date(lote.fechaEntrada).getTime()) / 86_400_000))} días`
                  : '—'}
              </Text>
              <Text style={styles.loteDias}>
                {lote.objetivoPesoKg ? `Obj: ${lote.objetivoPesoKg} kg` : lote.estado}
              </Text>
              <View style={[styles.bar, { backgroundColor: tokens.color.primary }]} />
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={styles.newCard}>
          <Text style={styles.newPlus}>+</Text>
          <Text style={styles.newLabel}>Nuevo lote</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    fontFamily: tokens.font.family.semibold,
    color: tokens.color.text.primary,
  },
  link: {
    fontSize: 10,
    fontFamily: tokens.font.family.medium,
    color: tokens.color.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 6,
  },
  card: {
    width: '47.5%',
    backgroundColor: tokens.color.white,
    borderRadius: 12,
    padding: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 20,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: tokens.font.family.semibold,
  },
  loteNombre: {
    fontSize: 12,
    fontFamily: tokens.font.family.semibold,
    color: tokens.color.text.primary,
    marginBottom: 1,
  },
  loteRaza: {
    fontSize: 10,
    fontFamily: tokens.font.family.regular,
    color: tokens.color.text.muted,
    marginBottom: 6,
  },
  loteLabel: {
    fontSize: 9,
    color: tokens.color.text.muted,
    fontFamily: tokens.font.family.regular,
  },
  loteGD: {
    fontSize: 14,
    fontFamily: tokens.font.family.semibold,
    marginBottom: 2,
  },
  loteDias: {
    fontSize: 9,
    color: tokens.color.text.muted,
    fontFamily: tokens.font.family.regular,
  },
  bar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 3,
    opacity: 0.2,
  },
  newCard: {
    width: '47.5%',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0ddd8',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  newPlus: {
    fontSize: 18,
    color: '#ddd',
    marginBottom: 3,
  },
  newLabel: {
    fontSize: 10,
    color: '#ccc',
    fontFamily: tokens.font.family.regular,
  },
});
