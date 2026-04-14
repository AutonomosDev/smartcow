import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { tokens, badges } from '../../../../packages/tokens/theme';
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
    marginTop: tokens.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.sm,
  },
  title: {
    fontSize: tokens.font.size.md,
    fontFamily: tokens.font.family.semibold,
    color: tokens.color.text.primary,
  },
  link: {
    fontSize: tokens.font.size.xs,
    fontFamily: tokens.font.family.medium,
    color: tokens.color.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  card: {
    width: '47.5%',
    backgroundColor: tokens.color.white,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: tokens.radius.chip,
    marginBottom: tokens.spacing.sm,
  },
  badgeText: {
    fontSize: tokens.font.size.xs,
    fontFamily: tokens.font.family.semibold,
  },
  loteNombre: {
    fontSize: tokens.font.size.sm,
    fontFamily: tokens.font.family.semibold,
    color: tokens.color.text.primary,
    marginBottom: 1,
  },
  loteRaza: {
    fontSize: tokens.font.size.xs,
    fontFamily: tokens.font.family.regular,
    color: tokens.color.text.muted,
    marginBottom: tokens.spacing.sm,
  },
  loteLabel: {
    fontSize: tokens.font.size.xs,
    color: tokens.color.text.muted,
    fontFamily: tokens.font.family.regular,
  },
  loteGD: {
    fontSize: 15,
    fontFamily: tokens.font.family.semibold,
    marginBottom: tokens.spacing.xs,
  },
  loteDias: {
    fontSize: tokens.font.size.xs,
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
    borderRadius: tokens.radius.card,
    borderWidth: 1.5,
    borderColor: '#e0ddd8',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: tokens.spacing.xxl,
  },
  newPlus: {
    fontSize: 22,
    color: '#ddd',
    marginBottom: tokens.spacing.xs,
  },
  newLabel: {
    fontSize: tokens.font.size.sm,
    color: '#ccc',
    fontFamily: tokens.font.family.regular,
  },
});
