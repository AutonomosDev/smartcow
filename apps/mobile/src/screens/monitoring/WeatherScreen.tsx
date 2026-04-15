import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, AlignLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = { r: 'DMSans_400Regular', m: 'DMSans_500Medium', b: 'DMSans_600SemiBold' };

const FORECAST = [
  { dia: 'Hoy',  temp: '6°',  rain: '12mm', icon: '🌧️' },
  { dia: 'Sáb',  temp: '8°',  rain: '4mm',  icon: '⛅' },
  { dia: 'Dom',  temp: '10°', rain: '0mm',  icon: '☀️' },
  { dia: 'Lun',  temp: '12°', rain: '0mm',  icon: '☀️' },
  { dia: 'Mar',  temp: '13°', rain: '0mm',  icon: '☀️' },
  { dia: 'Mié',  temp: '9°',  rain: '6mm',  icon: '🌦️' },
  { dia: 'Jue',  temp: '7°',  rain: '14mm', icon: '🌧️' },
];

export default function WeatherScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={16} color="#444" />
          </TouchableOpacity>
          <AlignLeft size={18} color="#444" />
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.title}>Clima</Text>
          <Text style={s.subtitle}>Fundo San Pedro · En vivo</Text>

          {/* Hero verde clima */}
          <View style={s.hero}>
            <Text style={s.heroLocation}>Los Lagos, Chile</Text>
            <Text style={s.heroTemp}>6°</Text>
            <Text style={s.heroDesc}>Lluvia leve · Viento 18 km/h</Text>
            <View style={s.heroGrid}>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>Humedad</Text>
                <Text style={s.heroItemVal}>84%</Text>
              </View>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>Lluvia hoy</Text>
                <Text style={s.heroItemVal}>12 mm</Text>
              </View>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>Ráfagas</Text>
                <Text style={s.heroItemVal}>31 km/h</Text>
              </View>
            </View>
          </View>

          {/* Impacto predio — amarillo */}
          <View style={s.warnCard}>
            <Text style={s.warnTitle}>Impacto en el predio</Text>
            <Text style={s.warnBody}>+12% gasto energético mantenimiento · Ráfagas: vuelo drone no recomendado hoy</Text>
          </View>

          {/* Pronóstico 7 días */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Próximos 7 días</Text>
            <View style={s.divider} />
            <View style={s.forecastRow}>
              {FORECAST.map((d) => (
                <View key={d.dia} style={s.forecastDay}>
                  <Text style={s.forecastDia}>{d.dia}</Text>
                  <Text style={s.forecastIcon}>{d.icon}</Text>
                  <Text style={s.forecastTemp}>{d.temp}</Text>
                  <Text style={[s.forecastRain, parseInt(d.rain) > 0 ? { color: '#1a6aa0' } : { color: '#bbb' }]}>{d.rain}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Ventanas de vuelo */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Ventanas de vuelo drone</Text>
            <View style={s.divider} />
            {[
              { dia: 'Hoy',        estado: 'No recomendado', ok: false },
              { dia: 'Sábado AM',  estado: 'OK — 08:00–11:00', ok: true },
              { dia: 'Domingo',    estado: 'OK — todo el día', ok: true },
            ].map((v) => (
              <View key={v.dia} style={s.ventRow}>
                <Text style={s.ventDia}>{v.dia}</Text>
                <Text style={[s.ventEstado, { color: v.ok ? '#1e3a2f' : '#e74c3c' }]}>{v.estado}</Text>
              </View>
            ))}
          </View>

          {/* CTA impacto climático */}
          <TouchableOpacity
            style={s.cta}
            onPress={() => navigation.navigate('WeatherDetail')}
          >
            <Text style={s.ctaText}>Ver impacto climático del mes</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f1' },
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#ebe9e3', justifyContent: 'center', alignItems: 'center' },
  title:    { fontFamily: F.b, fontSize: 28, color: '#1a1a1a', marginTop: 4, marginBottom: 2 },
  subtitle: { fontFamily: F.r, fontSize: 11, color: '#888', marginBottom: 12 },
  hero: { backgroundColor: '#1e3a2f', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 14, marginBottom: 10 },
  heroLocation: { fontFamily: F.r, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  heroTemp:     { fontFamily: F.b, fontSize: 48, color: '#fff', lineHeight: 52 },
  heroDesc:     { fontFamily: F.r, fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  heroGrid:  { flexDirection: 'row', gap: 5 },
  heroItem:  { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 7, padding: 6 },
  heroItemLabel: { fontFamily: F.r, fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 1 },
  heroItemVal:   { fontFamily: F.b, fontSize: 12, color: '#fff' },
  warnCard: { backgroundColor: '#fdf8e6', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  warnTitle: { fontFamily: F.b, fontSize: 12, color: '#9b5e1a', marginBottom: 3 },
  warnBody:  { fontFamily: F.r, fontSize: 11, color: '#555', lineHeight: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  cardTitle: { fontFamily: F.b, fontSize: 13, color: '#1a1a1a', marginBottom: 8 },
  divider:   { height: 0.5, backgroundColor: '#f0ede8', marginBottom: 8 },
  forecastRow: { flexDirection: 'row', justifyContent: 'space-between' },
  forecastDay: { alignItems: 'center', flex: 1 },
  forecastDia:  { fontFamily: F.r, fontSize: 9, color: '#888', marginBottom: 3 },
  forecastIcon: { fontSize: 18, marginBottom: 3 },
  forecastTemp: { fontFamily: F.b, fontSize: 12, color: '#1a1a1a', marginBottom: 2 },
  forecastRain: { fontFamily: F.r, fontSize: 9 },
  ventRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#f0ede8' },
  ventDia:    { fontFamily: F.r, fontSize: 12, color: '#444' },
  ventEstado: { fontFamily: F.b, fontSize: 12 },
  cta: { backgroundColor: '#1e3a2f', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  ctaText: { fontFamily: F.m, fontSize: 13, color: '#fff' },
});
