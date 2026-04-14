import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
const tokens = {
  color: { bg: '#f8f6f1', primary: '#1e3a2f', white: '#ffffff', cream: '#ebe9e3', danger: '#e74c3c', warning: '#f39c12', info: '#1a5276', text: { primary: '#1a1a1a', secondary: '#888888', muted: '#bbbbbb' } },
  font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' }, size: { xs: 10, sm: 11, md: 13, base: 14, lg: 16, xl: 20, xxl: 28 } },
  radius: { card: 14, btn: 12, chip: 20, hero: 16, small: 8 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
};
import { Hero } from '../components/Hero';
import { WeatherStrip } from '../components/WeatherStrip';
import { ActiveAlerts } from '../components/ActiveAlerts';
import { LotGrid } from '../components/LotGrid';
import { QuickAccess } from '../components/QuickAccess';
import { useAuth } from '../context/AuthContext';
import { api, PredioKpis, LoteResumen } from '../lib/api';

export default function HomeScreen() {
  const { predioId, user } = useAuth();
  const [kpis, setKpis] = useState<PredioKpis | null>(null);
  const [lotes, setLotes] = useState<LoteResumen[]>([]);

  useEffect(() => {
    api.get<PredioKpis>(`/api/predio/${predioId}/kpis`)
      .then(setKpis)
      .catch(() => {/* mantener null — LotGrid muestra estado vacío */});

    api.get<LoteResumen[]>(`/api/predio/${predioId}/lotes`)
      .then(setLotes)
      .catch(() => {/* mantener [] */});
  }, [predioId]);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Hero userName={user?.nombre} />
        <WeatherStrip />
        <ActiveAlerts />
        <LotGrid lotes={lotes} totalAnimales={kpis?.totalAnimales} />
        <QuickAccess />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.color.bg,
  },
  content: {
    paddingBottom: 60,
  },
});
