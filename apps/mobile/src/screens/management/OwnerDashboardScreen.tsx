import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const F = {
  regular: 'DMSans_400Regular',
  medium:  'DMSans_500Medium',
  bold:    'DMSans_600SemiBold',
};

const TAREAS_HOY = [
  {
    id: '1',
    title: 'Pesaje Lote 3',
    subtitle: 'Manga principal · 45 animales',
    hora: '08:14',
    duracion: '30 min',
    estado: 'completado' as const,
  },
  {
    id: '2',
    title: 'Mover Lote Norte',
    subtitle: '110 novillos Angus · Revisar cerco',
    hora: '10:00',
    duracion: '60 min',
    estado: 'pendiente' as const,
  },
];

export default function OwnerDashboardScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.hdrTextBlock}>
            <Text style={s.hdrTitle}>Buenos días, JP</Text>
            <Text style={s.hdrSub}>Lunes 14 abril · Fundo San Pedro</Text>
          </View>
          <TouchableOpacity
            style={s.bellBtn}
            onPress={() => navigation.navigate('AlertsCenter')}
          >
            <Bell size={18} color="#1a1a1a" />
            <View style={s.notifDot} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >

          {/* ── HERO CARD ── */}
          <TouchableOpacity
            style={s.hero}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('FundoDetail')}
          >
            <Text style={s.heroLabel}>ESTADO DEL FUNDO</Text>
            <Text style={s.heroMain}>Fundo San Pedro</Text>
            <Text style={s.heroSub}>242 animales · Feedlot Wagyu F1 & Angus</Text>
            <View style={s.heroGrid}>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>Animales</Text>
                <Text style={s.heroItemVal}>242</Text>
              </View>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>Peso total</Text>
                <Text style={[s.heroItemVal, s.ok]}>106 Ton</Text>
              </View>
              <View style={s.heroItem}>
                <Text style={s.heroItemLabel}>Costo/kg</Text>
                <Text style={[s.heroItemVal, s.warn]}>$1.82</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* ── CONDICIÓN OPERACIONAL ── */}
          <View style={s.condCard}>
            <View style={s.condHeader}>
              <View style={s.condDot} />
              <Text style={s.condTitle}>Condición operacional — OK</Text>
            </View>
            <Text style={s.condBody}>
              Sin alertas críticas · GDP promedio +0.9 kg/día · Efic. ración 94%
            </Text>
          </View>

          {/* ── STATS ROW ── */}
          <View style={s.stats}>
            <TouchableOpacity
              style={s.stat}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AnimalesScreen')}
            >
              <Text style={s.statVal}>3</Text>
              <Text style={s.statLabel}>GDP{'\n'}semana</Text>
            </TouchableOpacity>
            <View style={s.stat}>
              <Text style={[s.statVal, { color: '#f39c12' }]}>2</Text>
              <Text style={s.statLabel}>En{'\n'}observ.</Text>
            </View>
            <TouchableOpacity
              style={s.stat}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('CostsSummary')}
            >
              <Text style={s.statVal}>18.4%</Text>
              <Text style={s.statLabel}>Margen{'\n'}est.</Text>
            </TouchableOpacity>
          </View>

          {/* ── TARJETAS DE ACTIVIDAD ── */}
          {TAREAS_HOY.map((tarea) => (
            <TouchableOpacity
              key={tarea.id}
              style={s.card}
              onPress={() => navigation.navigate('JaimeHome')}
            >
              <View style={s.cardTop}>
                <View style={s.cardTopLeft}>
                  <Text style={s.cardTitle}>{tarea.title}</Text>
                  <Text style={s.cardSubtitle}>{tarea.subtitle}</Text>
                </View>
                {tarea.estado === 'completado' ? (
                  <View style={[s.badge, s.badgeOk]}>
                    <Text style={[s.badgeText, { color: '#1e3a2f' }]}>Completada</Text>
                  </View>
                ) : (
                  <View style={[s.badge, s.badgeNeutral]}>
                    <Text style={[s.badgeText, { color: '#666666' }]}>{tarea.hora}</Text>
                  </View>
                )}
              </View>
              <View style={s.cardGrid}>
                <View style={s.cardGridItem}>
                  <Text style={s.gridLabel}>Hora</Text>
                  <Text style={s.gridVal}>{tarea.hora}</Text>
                </View>
                <View style={s.cardGridItem}>
                  <Text style={s.gridLabel}>Duración</Text>
                  <Text style={s.gridVal}>{tarea.duracion}</Text>
                </View>
                <View style={s.cardGridItem}>
                  <Text style={s.gridLabel}>Estado</Text>
                  <Text style={s.gridVal}>
                    {tarea.estado === 'completado' ? 'Listo' : 'Pendiente'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* ── CTA PRINCIPAL ── */}
          <TouchableOpacity
            style={s.cta}
            onPress={() => navigation.navigate('MapaPredio')}
          >
            <Text style={s.ctaText}>Ver mapa del fundo</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f1' },
  safeArea:  { flex: 1 },
  scroll:    { paddingBottom: 40 },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingTop: 7,
    paddingBottom: 4,
  },
  hdrTextBlock: {},
  hdrTitle: {
    fontFamily: F.bold,
    fontSize: 20,
    color: '#1a1a1a',
  },
  hdrSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#999999',
    marginTop: 2,
  },
  bellBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ebe9e3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#e74c3c',
    borderWidth: 1.5,
    borderColor: '#ebe9e3',
  },

  // ── Hero card ────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: '#1e3a2f',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  heroLabel: {
    fontFamily: F.bold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  heroMain: {
    fontFamily: F.bold,
    fontSize: 22,
    color: '#ffffff',
    lineHeight: 22,
    marginBottom: 3,
  },
  heroSub: {
    fontFamily: F.regular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 10,
  },
  heroGrid: {
    flexDirection: 'row',
    gap: 5,
  },
  heroItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 7,
    paddingVertical: 6,
    paddingHorizontal: 7,
  },
  heroItemLabel: {
    fontFamily: F.regular,
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 2,
  },
  heroItemVal: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#ffffff',
  },
  ok:   { color: '#7ecfa0' },
  warn: { color: '#f39c12' },

  // ── Condición operacional ────────────────────────────────────────────────
  condCard: {
    backgroundColor: '#e6f3ec',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  condHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  condDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1e3a2f',
  },
  condTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#1e3a2f',
  },
  condBody: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#888888',
    lineHeight: 16,
  },

  // ── Stats row ────────────────────────────────────────────────────────────
  stats: {
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 12,
    marginBottom: 8,
  },
  stat: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  statVal: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#1a1a1a',
  },
  statLabel: {
    fontFamily: F.regular,
    fontSize: 9,
    color: '#bbbbbb',
    marginTop: 1,
    textAlign: 'center',
  },

  // ── Cards actividad ──────────────────────────────────────────────────────
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginBottom: 6,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTopLeft: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#1a1a1a',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily: F.regular,
    fontSize: 10,
    color: '#aaaaaa',
  },
  cardGrid: {
    flexDirection: 'row',
    gap: 4,
  },
  cardGridItem: {
    flex: 1,
  },
  gridLabel: {
    fontFamily: F.regular,
    fontSize: 9,
    color: '#bbbbbb',
    marginBottom: 1,
  },
  gridVal: {
    fontFamily: F.bold,
    fontSize: 11,
    color: '#1a1a1a',
  },

  // ── Badges ───────────────────────────────────────────────────────────────
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: F.bold,
    fontSize: 9,
  },
  badgeOk:      { backgroundColor: '#e6f3ec' },
  badgeNeutral: { backgroundColor: '#e6f0f8' },

  // ── CTA ──────────────────────────────────────────────────────────────────
  cta: {
    backgroundColor: '#1e3a2f',
    borderRadius: 11,
    padding: 12,
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#ffffff',
  },
});
