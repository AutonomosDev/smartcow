import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };
import { ChevronLeft, Menu, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NutritionTimeline } from '../components/NutritionTimeline';

export default function WagyuNutritionScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerIcon} 
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color={T.color.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AgroBrain · NARO 和牛</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Menu size={20} color={T.color.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Main Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Requerimientos Wagyu</Text>
            <Text style={styles.subtitle}>Lote Sur · 78 animales · Recría</Text>
          </View>

          {/* Target Card */}
          <View style={styles.infoCard}>
            <Text style={styles.categoryLabel}>WAGYU — KUROGE WASHU</Text>
            <Text style={styles.itemName}>黒毛和牛 · Angus Negro</Text>
            <Text style={styles.cardSub}>Tablas NARO Japón · Fase recría 180-350 kg</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Peso promedio</Text>
                <Text style={styles.statValue}>312 kg</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>GD objetivo</Text>
                <Text style={[styles.statValue, { color: '#2d6a4f' }]}>0.9 kg/día</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>EM requerida</Text>
                <Text style={styles.statValue}>9.8 Mcal</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>BMS objetivo</Text>
                <Text style={[styles.statValue, { color: '#f39c12' }]}>BMS 8+</Text>
              </View>
            </View>
          </View>

          {/* Fattening Phases Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fases de engorda Wagyu</Text>
            
            <NutritionTimeline 
              phases={[
                {
                  title: 'Recría — Fase 1',
                  duration: 'Actual',
                  desc: '180—350 kg · Alta proteína · Desarrollo muscular',
                  status: 'actual'
                },
                {
                  title: 'Engorda — Fase 2',
                  duration: '120 días',
                  desc: '350—550 kg · Transición energía · Inicio marmoreo',
                  status: 'upcoming'
                },
                {
                  title: 'Finalización — Fase 3',
                  duration: '240 días',
                  desc: '550—700 kg · Alta energía · Máximo marmoreo BMS',
                  status: 'upcoming'
                }
              ]}
            />
          </View>

          {/* BMS Indicators grid */}
          <View style={[styles.section, { paddingBottom: 20 }]}>
            <Text style={styles.sectionTitle}>Indicadores BMS actuales</Text>
            
            <View style={styles.indicatorRow}>
              <Text style={styles.indicatorLabel}>GD semana</Text>
              <Text style={[styles.indicatorValue, { color: T.color.danger }]}>1.1 kg/día</Text>
            </View>
            <View style={styles.indicatorRow}>
              <Text style={styles.indicatorLabel}>GD objetivo fase 1</Text>
              <Text style={styles.indicatorValue}>0.9—1.1 kg</Text>
            </View>
            <View style={styles.indicatorRow}>
              <Text style={styles.indicatorLabel}>Proteína dieta</Text>
              <View style={styles.checkValue}>
                <Text style={styles.indicatorValue}>15.2% </Text>
                <Check size={14} color="#1E3A2F" />
              </View>
            </View>
            <View style={styles.indicatorRow}>
              <Text style={styles.indicatorLabel}>Energía dieta</Text>
              <View style={styles.checkValue}>
                <Text style={styles.indicatorValue}>9.6 Mcal </Text>
                <Check size={14} color="#1E3A2F" />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.color.bg,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ebe9e3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: T.font.family.medium,
    fontSize: 12,
    color: T.color.text.muted,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  title: {
    fontFamily: T.font.family.semibold,
    fontSize: 24,
    color: T.color.text.primary,
  },
  subtitle: {
    fontFamily: T.font.family.regular,
    fontSize: 14,
    color: T.color.text.muted,
  },
  infoCard: {
    backgroundColor: '#1E3A2F',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  categoryLabel: {
    fontSize: 10,
    fontFamily: T.font.family.semibold,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  itemName: {
    fontSize: 18,
    fontFamily: T.font.family.semibold,
    color: T.color.white,
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 10,
    fontFamily: T.font.family.regular,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: T.font.family.regular,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: T.font.family.semibold,
    color: T.color.white,
  },
  section: {
    backgroundColor: T.color.white,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
    marginBottom: 20,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f6f1',
  },
  indicatorLabel: {
    fontSize: 13,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
  },
  indicatorValue: {
    fontSize: 14,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
  checkValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
