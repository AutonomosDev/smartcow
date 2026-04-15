import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
const tokens = {
  color: { bg: '#f8f6f1', primary: '#1e3a2f', white: '#ffffff', cream: '#ebe9e3', danger: '#e74c3c', warning: '#f39c12', info: '#1a5276', text: { primary: '#1a1a1a', secondary: '#888888', muted: '#bbbbbb' } },
  font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' }, size: { xs: 10, sm: 11, md: 13, base: 14, lg: 16, xl: 20, xxl: 28 } },
  radius: { card: 14, btn: 12, chip: 20, hero: 16, small: 8 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
};

const ALERTAS = [
  { icon: '🚨', bg: '#fde8e8', title: 'Bebedero Sur vacío',  sub: 'Jaime en camino',     subColor: '#c0392b' },
  { icon: '⚠️', bg: '#fdf0e6', title: 'Déficit energía',     sub: 'Lote Norte −17%',     subColor: '#9b5e1a' },
];

export const ActiveAlerts = () => {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>Alertas activas</Text>
        <Text style={styles.link}>Ver todas →</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {ALERTAS.map((a, i) => (
          <View key={i} style={styles.chip}>
            <View style={[styles.iconBox, { backgroundColor: a.bg }]}>
              <Text style={styles.iconTxt}>{a.icon}</Text>
            </View>
            <View>
              <Text style={styles.chipTitle}>{a.title}</Text>
              <Text style={[styles.chipSub, { color: a.subColor }]}>{a.sub}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
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
  row: {
    paddingHorizontal: 14,
    gap: 6,
  },
  chip: {
    backgroundColor: tokens.color.white,
    borderRadius: 10,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 6,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTxt: {
    fontSize: 13,
  },
  chipTitle: {
    fontSize: 11,
    fontFamily: tokens.font.family.semibold,
    color: tokens.color.text.primary,
  },
  chipSub: {
    fontSize: 10,
    fontFamily: tokens.font.family.regular,
    marginTop: 1,
  },
});
