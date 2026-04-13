import React from 'react';
import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { tokens, badges } from '../../../../packages/tokens/theme';

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
