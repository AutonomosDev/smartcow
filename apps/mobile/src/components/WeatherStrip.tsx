import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const tokens = {
  color: { bg: '#f8f6f1', primary: '#1e3a2f', white: '#ffffff', cream: '#ebe9e3', danger: '#e74c3c', warning: '#f39c12', info: '#1a5276', text: { primary: '#1a1a1a', secondary: '#888888', muted: '#bbbbbb' } },
  font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' }, size: { xs: 10, sm: 11, md: 13, base: 14, lg: 16, xl: 20, xxl: 28 } },
  radius: { card: 14, btn: 12, chip: 20, hero: 16, small: 8 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
};

const DIAS = [
  { day: 'Hoy', emoji: '🌧', temp: '6°',  active: true },
  { day: 'Sáb', emoji: '🌦', temp: '8°' },
  { day: 'Dom', emoji: '⛅', temp: '10°' },
  { day: 'Lun', emoji: '☀️', temp: '12°' },
  { day: 'Mar', emoji: '☀️', temp: '13°' },
  { day: 'Mié', emoji: '🌦', temp: '9°' },
  { day: 'Jue', emoji: '🌧', temp: '7°' },
];

export const WeatherStrip = () => {
  return (
    <View style={styles.container}>
      <View style={styles.dias}>
        {DIAS.map((d, i) => (
          <View key={i} style={styles.dia}>
            <Text style={styles.diaNombre}>{d.day}</Text>
            <Text style={styles.diaIco}>{d.emoji}</Text>
            <Text style={[styles.diaTemp, d.active && styles.diaTempActive]}>{d.temp}</Text>
          </View>
        ))}
      </View>
      <View style={styles.divider} />
      <View style={styles.alertRow}>
        <View style={styles.alertDot} />
        <Text style={styles.alertTxt}>+12% energía mantenimiento · Sáb ventana drone 08:00</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 14,
    marginTop: -14,
    backgroundColor: tokens.color.white,
    borderRadius: 12,
    padding: 10,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  dias: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dia: {
    alignItems: 'center',
    flex: 1,
  },
  diaNombre: {
    fontSize: 9,
    color: tokens.color.text.muted,
    fontFamily: tokens.font.family.regular,
    marginBottom: 2,
  },
  diaIco: {
    fontSize: 11,
    marginBottom: 1,
  },
  diaTemp: {
    fontSize: 10,
    fontFamily: tokens.font.family.medium,
    color: tokens.color.text.primary,
  },
  diaTempActive: {
    color: tokens.color.primary,
    fontFamily: tokens.font.family.semibold,
  },
  divider: {
    height: 0.5,
    backgroundColor: tokens.color.cream,
    marginBottom: 6,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: tokens.color.warning,
  },
  alertTxt: {
    fontSize: 9,
    color: tokens.color.text.secondary,
    fontFamily: tokens.font.family.regular,
    flex: 1,
  },
});
