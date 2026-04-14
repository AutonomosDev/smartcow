import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { tokens } from '../../../../packages/tokens/theme';
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
