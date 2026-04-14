import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
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

export type Potrero = {
  id: string;
  nombre: string;
  ha: number;
  animales: number;
  gd: string;
  agua: number;
  alerta: string | null;
  coords: [number, number][];
};

type Props = {
  potreros: Potrero[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export const PotreroPill = ({ potreros, selectedId, onSelect }: Props) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {potreros.map((p) => {
        const isSelected = p.id === selectedId;
        const hasAlerta = p.alerta !== null;
        return (
          <TouchableOpacity
            key={p.id}
            onPress={() => onSelect(p.id)}
            style={[
              styles.pill,
              isSelected && styles.pillSelected,
            ]}
            activeOpacity={0.7}
          >
            {hasAlerta && (
              <View style={styles.alertDot} />
            )}
            <Text style={[
              styles.pillText,
              isSelected && styles.pillTextSelected,
            ]}>
              {p.nombre}
            </Text>
            {hasAlerta && (
              <Text style={styles.alertIcon}> ⚠</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: tokens.spacing.lg,
    gap: tokens.spacing.sm,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: tokens.radius.chip,
    borderWidth: 1.5,
    borderColor: '#e0ddd8',
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: tokens.color.white,
  },
  pillSelected: {
    backgroundColor: tokens.color.primary,
    borderColor: tokens.color.primary,
  },
  pillText: {
    fontSize: tokens.font.size.sm,
    fontFamily: tokens.font.family.medium,
    color: tokens.color.text.primary,
  },
  pillTextSelected: {
    color: tokens.color.white,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.color.danger,
    marginRight: 5,
  },
  alertIcon: {
    fontSize: 10,
    color: tokens.color.danger,
    marginLeft: 2,
  },
});
