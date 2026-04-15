import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Menu } from 'lucide-react-native';

const T = {
  color: {
    primary: '#1E3A2F',
    bg: '#f8f6f1',
    white: '#ffffff',
    danger: '#e74c3c',
    text: { primary: '#1E3A2F', muted: '#7a7a6e' },
  },
  font: {
    family: {
      regular: 'DMSans_400Regular',
      medium: 'DMSans_500Medium',
      semibold: 'DMSans_600SemiBold',
    },
  },
};
import { useNavigation } from '@react-navigation/native';
import { ComparisonBar } from '../components/ComparisonBar';

export default function SoilAnalysisScreen() {
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
          <Text style={styles.headerTitle}>AgroBrain · CIREN</Text>
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
            <Text style={styles.title}>Suelos y cultivos</Text>
            <Text style={styles.subtitle}>Fundo San Pedro · Potrero Norte</Text>
          </View>

          {/* Analysis Header Card */}
          <View style={styles.infoCard}>
            <Text style={styles.categoryLabel}>ANÁLISIS DE SUELO</Text>
            <Text style={styles.itemName}>Potrero Norte — Serie Osorno</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Clase agrológica</Text>
                <View style={styles.statValueRow}>
                  <View style={[styles.classBadge, { backgroundColor: '#2d6a4f' }]}>
                    <Text style={styles.classBadgeText}>II</Text>
                  </View>
                </View>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>pH suelo</Text>
                <Text style={[styles.statValueText, { color: '#d68910' }]}>5.8</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>MO %</Text>
                <Text style={[styles.statValueText, { color: '#2d6a4f' }]}>4.2%</Text>
              </View>
            </View>
          </View>

          {/* CIREN Shapefile Map Placeholder */}
          <View style={styles.mapContainer}>
            <Text style={styles.mapLabel}>CIREN - shapefile</Text>
            <View style={styles.mapContent}>
              <View style={[styles.mapPolygon, { backgroundColor: '#e6f3ec', width: '70%', height: '100%', borderRightWidth: 1, borderColor: '#fff' }]}>
                <Text style={styles.polygonTitle}>Serie Osorno</Text>
                <Text style={styles.polygonSub}>Clase II — Apto forraje</Text>
              </View>
              <View style={[styles.mapPolygon, { backgroundColor: '#e9e9e1', width: '30%', height: '100%' }]}>
                <Text style={[styles.polygonTitle, { fontSize: 10 }]}>Serie Cauquenes</Text>
              </View>
            </View>
          </View>

          {/* Parameters Comparison Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parámetros del suelo</Text>
            
            <View style={styles.paramRow}>
              <View style={styles.paramInfo}>
                <Text style={styles.paramLabel}>pH</Text>
                <ComparisonBar percentage={58} reference={65} color="#d68910" height={10} />
              </View>
              <View style={styles.paramValues}>
                <Text style={styles.currentVal}>5.8</Text>
                <Text style={styles.refVal}>6.5</Text>
              </View>
            </View>

            <View style={styles.paramRow}>
              <View style={styles.paramInfo}>
                <Text style={styles.paramLabel}>Materia org.</Text>
                <ComparisonBar percentage={82} reference={80} color="#2d6a4f" height={10} />
              </View>
              <View style={styles.paramValues}>
                <Text style={styles.currentVal}>4.2%</Text>
                <Text style={styles.refVal}>4%</Text>
              </View>
            </View>

            <View style={styles.paramRow}>
              <View style={styles.paramInfo}>
                <Text style={styles.paramLabel}>Fósforo</Text>
                <ComparisonBar percentage={45} reference={100} color="#e74c3c" height={10} />
              </View>
              <View style={styles.paramValues}>
                <Text style={[styles.currentVal, { color: T.color.danger }]}>9 ppm</Text>
                <Text style={styles.refVal}>20</Text>
              </View>
            </View>

            <View style={styles.paramRow}>
              <View style={styles.paramInfo}>
                <Text style={styles.paramLabel}>Potasio</Text>
                <ComparisonBar percentage={94} reference={100} height={10} />
              </View>
              <View style={styles.paramValues}>
                <Text style={styles.currentVal}>142</Text>
                <Text style={styles.refVal}>150</Text>
              </View>
            </View>
          </View>

          {/* Recommendations Box */}
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationTitle}>Recomendación AgroBrain</Text>
            <Text style={styles.recommendationText}>
              pH bajo (5.8) — encalar con 2 ton/ha de cal agrícola antes de próxima siembra. Fósforo deficiente — agregar 80 kg/ha superfosfato triple.
            </Text>
          </View>

          {/* Data Sources */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Fuentes de datos</Text>
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
    marginBottom: 20,
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
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
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
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValueText: {
    fontSize: 16,
    fontFamily: T.font.family.semibold,
  },
  classBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classBadgeText: {
    color: T.color.white,
    fontSize: 12,
    fontFamily: T.font.family.semibold,
  },
  mapContainer: {
    height: 120,
    marginBottom: 20,
  },
  mapLabel: {
    fontSize: 10,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
    marginBottom: 6,
  },
  mapContent: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapPolygon: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  polygonTitle: {
    fontSize: 12,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
  polygonSub: {
    fontSize: 9,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
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
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  paramInfo: {
    flex: 1,
    marginRight: 20,
  },
  paramLabel: {
    fontSize: 13,
    fontFamily: T.font.family.medium,
    color: T.color.text.primary,
    marginBottom: 6,
  },
  paramValues: {
    alignItems: 'flex-end',
    paddingBottom: 4,
  },
  currentVal: {
    fontSize: 14,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
  refVal: {
    fontSize: 10,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
  },
  recommendationCard: {
    backgroundColor: '#e6f3ec',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  recommendationTitle: {
    fontSize: 14,
    fontFamily: T.font.family.semibold,
    color: '#1E3A2F',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 12,
    fontFamily: T.font.family.regular,
    color: '#1E3A2F',
    lineHeight: 18,
  },
  footer: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ebe9e3',
  },
  footerText: {
    fontSize: 14,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
});
