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
import { Bell, ChevronRight, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

// DS font tokens (inline — no external package needed in mobile)
const F = {
  regular: 'DMSans_400Regular',
  medium:  'DMSans_500Medium',
  bold:    'DMSans_600SemiBold',
};

// ─── Mock data ────────────────────────────────────────────────────────────────
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

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function OwnerDashboardScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safeArea}>

        {/* ── 3 HEADER ── */}
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

          {/* ── 4 HERO CARD (verde oscuro) — DS exacto ── */}
          {/* bg #1e3a2f · radius 16 · padding 12 14 · margin 0 16 */}
          <View style={s.hero}>
            <Text style={s.heroLabel}>ESTADO DEL FUNDO</Text>
            <Text style={s.heroTitle}>Fundo San Pedro</Text>
            {/* grid items: bg rgba(255,255,255,0.1) · radius 7 · padding 6 */}
            <View style={s.heroGrid}>
              <View style={s.heroItem}>
                {/* label 9px/rgba(255,255,255,0.5) · val 12px/600 */}
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
          </View>

          {/* ── TARJETA VERDE (condición operacional) — DS badge ok bg #e6f3ec ── */}
          {/* Esta es la sección faltante — card blanca con bg ok verde */}
          <View style={s.condCard}>
            <View style={s.condHeader}>
              <View style={s.condDot} />
              <Text style={s.condTitle}>Condición operacional — OK</Text>
            </View>
            <Text style={s.condBody}>
              Sin alertas críticas · GDP promedio +0.9 kg/día · Efic. ración 94%
            </Text>
          </View>

          {/* ── 6 STATS ROW — 3 cajones KPI ── */}
          {/* bg #fff · radius 11 · padding 9 · val 16px/600 · label 9px/400 #bbb */}
          <View style={s.stats}>
            <View style={s.stat}>
              <Text style={s.statVal}>3</Text>
              <Text style={s.statLabel}>GDP{'\n'}semana</Text>
            </View>
            <View style={s.stat}>
              <Text style={[s.statVal, { color: '#f39c12' }]}>2</Text>
              <Text style={s.statLabel}>En{'\n'}observ.</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statVal}>18.4%</Text>
              <Text style={s.statLabel}>Margen{'\n'}est.</Text>
            </View>
          </View>

          {/* ── 5 TARJETAS DE ACTIVIDAD (card blanca x2) ── */}
          {/* bg #fff · radius 14 · padding 12 14 · margin 0 16 */}
          {TAREAS_HOY.map((tarea) => (
            <TouchableOpacity
              key={tarea.id}
              style={s.card}
              onPress={() => navigation.navigate('JaimeHome')}
            >
              <View style={s.cardTopRow}>
                <Text style={s.cardTitle}>{tarea.title}</Text>
                {/* 7 - Badge */}
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
              <Text style={s.cardBody}>{tarea.subtitle}</Text>
              <View style={s.cardFooter}>
                <Text style={s.cardMeta}>Hora  {tarea.hora}</Text>
                <Text style={s.cardMeta}>Duración  {tarea.duracion}</Text>
                <ChevronRight size={12} color="#bbb" />
              </View>
            </TouchableOpacity>
          ))}

          {/* ── 11 CTA PRINCIPAL ── */}
          {/* bg #1e3a2f · radius 12 · padding 13 · margin 0 16 */}
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

// ─── Styles — DS tokens exactos ───────────────────────────────────────────────
const s = StyleSheet.create({
  // Globals
  container: { flex: 1, backgroundColor: '#f8f6f1' },
  safeArea: { flex: 1 },
  scroll: { paddingBottom: 40 },

  // ── Header (comp 3) ──────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  hdrTextBlock: {},
  hdrTitle: {
    // DS: 16px/600 — uso 20 para saludo diferenciado
    fontFamily: F.bold,
    fontSize: 20,
    color: '#1a1a1a',
  },
  hdrSub: {
    // DS: 11px/400 #888
    fontFamily: F.regular,
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ebe9e3', // DS: back btn bg
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#e74c3c',
    borderWidth: 1.5,
    borderColor: '#ebe9e3',
  },

  // ── Hero card (comp 4) — DS exacto ──────────────────────────────────────
  hero: {
    backgroundColor: '#1e3a2f',
    borderRadius: 16,          // DS: 16px
    paddingVertical: 12,       // DS: 12px top/bottom
    paddingHorizontal: 14,     // DS: 14px left/right
    marginHorizontal: 16,      // DS: margin 0 16px
    marginTop: 8,
    marginBottom: 8,
  },
  heroLabel: {
    fontFamily: F.bold,
    fontSize: 9,                              // DS: 9px
    color: 'rgba(255,255,255,0.5)',           // DS: rgba(255,255,255,0.5)
    marginBottom: 3,
  },
  heroTitle: {
    fontFamily: F.bold,
    fontSize: 14,              // DS: 14px/600
    color: '#ffffff',
    marginBottom: 8,
  },
  heroGrid: {
    flexDirection: 'row',
    gap: 5,
  },
  heroItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)', // DS exacto
    borderRadius: 7,                           // DS: 7px
    padding: 6,                                // DS: 6px
  },
  heroItemLabel: {
    fontFamily: F.regular,
    fontSize: 9,                              // DS: 9px
    color: 'rgba(255,255,255,0.5)',           // DS: rgba(255,255,255,0.5)
    marginBottom: 1,
  },
  heroItemVal: {
    fontFamily: F.bold,
    fontSize: 12,              // DS: 12px/600
    color: '#ffffff',
  },
  ok: { color: '#7ecfa0' },
  warn: { color: '#f39c12' },

  // ── Tarjeta verde condición (sección faltante — bg badge ok) ─────────────
  condCard: {
    backgroundColor: '#e6f3ec', // DS: badge ok bg
    borderRadius: 14,            // DS: card 14px
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
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
    backgroundColor: '#1e3a2f',   // DS: offline dot color
  },
  condTitle: {
    fontFamily: F.bold,
    fontSize: 12,                  // DS: card-title 12px/600
    color: '#1e3a2f',
  },
  condBody: {
    fontFamily: F.regular,
    fontSize: 11,                  // DS: card-body 11px
    color: '#888888',
    lineHeight: 16,
  },

  // ── Stats row (comp 6) ───────────────────────────────────────────────────
  stats: {
    flexDirection: 'row',
    gap: 8,                   // DS: gap 8px
    marginHorizontal: 16,     // DS: margin 0 16px
    marginBottom: 8,
  },
  stat: {
    flex: 1,
    backgroundColor: '#ffffff', // DS: #fff
    borderRadius: 11,           // DS: 11px
    padding: 9,                 // DS: 9px
    alignItems: 'center',
  },
  statVal: {
    fontFamily: F.bold,
    fontSize: 16,              // DS: 16px/600
    color: '#1a1a1a',
  },
  statLabel: {
    fontFamily: F.regular,
    fontSize: 9,               // DS: 9px/400 #bbb
    color: '#bbbbbb',
    marginTop: 1,
    textAlign: 'center',
  },

  // ── Card blanca actividades (comp 5) ─────────────────────────────────────
  card: {
    backgroundColor: '#ffffff', // DS: #fff
    borderRadius: 14,           // DS: 14px
    paddingVertical: 12,        // DS: 12px
    paddingHorizontal: 14,      // DS: 14px
    marginHorizontal: 16,       // DS: margin 0 16px
    marginBottom: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardTitle: {
    fontFamily: F.bold,
    fontSize: 12,              // DS: card-title 12px/600
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  cardBody: {
    fontFamily: F.regular,
    fontSize: 11,              // DS: card-body 11px
    color: '#888888',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardMeta: {
    fontFamily: F.regular,
    fontSize: 10,              // DS: label 10px/400 #bbb
    color: '#bbbbbb',
    flex: 1,
  },

  // ── Badges (comp 7) ─────────────────────────────────────────────────────
  badge: {
    paddingVertical: 3,        // DS: 3px
    paddingHorizontal: 10,     // DS: 10px
    borderRadius: 20,          // DS: 20px
  },
  badgeText: {
    fontFamily: F.bold,
    fontSize: 10,              // DS: 10px/600
  },
  badgeOk: { backgroundColor: '#e6f3ec' },
  badgeNeutral: { backgroundColor: '#ebe9e3' },

  // ── CTA principal (comp 11) ──────────────────────────────────────────────
  cta: {
    backgroundColor: '#1e3a2f', // DS: #1e3a2f
    borderRadius: 12,           // DS: 12px
    padding: 13,                // DS: 13px
    marginHorizontal: 16,       // DS: margin 0 16px
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: F.medium,
    fontSize: 13,              // DS: 13px/500
    color: '#ffffff',
  },
});
