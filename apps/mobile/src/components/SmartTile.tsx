import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

interface SmartTileProps {
  name: string;
  raza: string;
  count: number;
  days: number;
  gd: string;
  status: keyof typeof badges;
}

const LABELS: Record<string, string> = {
  urgente:  '⚠ GD',
  ok:       'OK',
  atencion: 'Trat.',
  neutro:   'Normal',
  info:     'Info',
};

export const SmartTile = ({ name, raza, count, days, gd, status }: SmartTileProps) => {
  const b = badges[status] ?? badges.neutro;
  return (
    <View style={styles.card}>
      <View style={[styles.badge, { backgroundColor: b.bg }]}>
        <Text style={[styles.badgeText, { color: b.text }]}>{LABELS[status]}</Text>
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.raza}>{count} {raza}</Text>
      <Text style={styles.label}>Gan. diaria</Text>
      <Text style={[styles.gd, { color: status === 'ok' ? tokens.color.primary : tokens.color.danger }]}>{gd}</Text>
      <Text style={styles.days}>{days} días en engorda</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.color.white,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
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
    fontFamily: 'DMSans_600SemiBold',
  },
  name: {
    fontSize: tokens.font.size.sm,
    fontFamily: 'DMSans_600SemiBold',
    color: tokens.color.text.primary,
    marginBottom: 1,
  },
  raza: {
    fontSize: tokens.font.size.xs,
    color: tokens.color.text.muted,
    fontFamily: 'DMSans_400Regular',
    marginBottom: tokens.spacing.sm,
  },
  label: {
    fontSize: tokens.font.size.xs,
    color: tokens.color.text.muted,
    fontFamily: 'DMSans_400Regular',
  },
  gd: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    marginBottom: 2,
  },
  days: {
    fontSize: tokens.font.size.xs,
    color: tokens.color.text.muted,
    fontFamily: 'DMSans_400Regular',
  },
});
