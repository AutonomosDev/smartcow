import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };
import { ChevronLeft, Menu, Package, AlertTriangle, ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { MetricGrid } from '../../components/MetricGrid';

const CRITICAL_ITEMS = [
  { name: 'Maíz Molido', stock: '2.4 Ton', min: '5 Ton', status: 'Crítico' },
  { name: 'Draxxin 100ml', stock: '2 un', min: '5 un', status: 'Bajo' },
];

const RECENT_LOGS = [
  { type: 'in', item: 'Ensilaje Pradera', qty: '+40 Ton', date: 'Hoy 09:00' },
  { type: 'out', item: 'Maíz Molido', qty: '-1.2 Ton', date: 'Hoy 07:30' },
  { type: 'out', item: 'Afrecho Trigo', qty: '-0.8 Ton', date: 'Ayer 18:00' },
];

export default function StockInventoryScreen() {
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
          <Text style={styles.headerTitle}>Inventario Stock</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Search size={20} color={T.color.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Bodega y Suministros</Text>
            <Text style={styles.subtitle}>Fundo San Pedro · Mayo 2026</Text>
          </View>

          {/* Critical Stock Alert */}
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <AlertTriangle size={18} color="#e74c3c" />
              <Text style={styles.alertTitle}>REPOSICIÓN NECESARIA</Text>
            </View>
            {CRITICAL_ITEMS.map((item, i) => (
              <View key={i} style={styles.criticalItem}>
                <Text style={styles.critName}>{item.name}</Text>
                <View style={styles.critVals}>
                  <Text style={styles.critStock}>{item.stock}</Text>
                  <Text style={styles.critMin}>/ {item.min}</Text>
                </View>
              </View>
            ))}
          </View>

          <MetricGrid 
            items={[
              { label: 'Valor Bodega', value: '$42k' },
              { label: 'Pedidos Pend.', value: '2' },
              { label: 'Insumos 24h', value: '+14' },
              { label: 'Mermas', value: '1.2%' }
            ]}
          />

          {/* Categories Grid */}
          <Text style={styles.sectionTitle}>CATEGORÍAS</Text>
          <View style={styles.categoryGrid}>
            <TouchableOpacity style={styles.catCard}>
              <View style={styles.catIcon}><Package size={20} color={T.color.primary} /></View>
              <Text style={styles.catName}>Alimentos</Text>
              <Text style={styles.catCount}>12 ítems</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.catCard}>
              <View style={styles.catIcon}><Package size={20} color={T.color.primary} /></View>
              <Text style={styles.catName}>Fármacos</Text>
              <Text style={styles.catCount}>24 ítems</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.catCard}>
              <View style={styles.catIcon}><Package size={20} color={T.color.primary} /></View>
              <Text style={styles.catName}>肥料 (Fert.)</Text>
              <Text style={styles.catCount}>4 ítems</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MOVIMIENTOS RECIENTES</Text>
            {RECENT_LOGS.map((log, i) => (
              <View key={i} style={styles.logCard}>
                <View style={[styles.logIcon, { backgroundColor: log.type === 'in' ? '#e6f3ec' : '#fff5f5' }]}>
                  {log.type === 'in' ? <ArrowDownLeft size={16} color="#2ecc71" /> : <ArrowUpRight size={16} color="#e74c3c" />}
                </View>
                <View style={styles.logContent}>
                  <Text style={styles.logItemName}>{log.item}</Text>
                  <Text style={styles.logDate}>{log.date}</Text>
                </View>
                <Text style={[styles.logQty, { color: log.type === 'in' ? '#2ecc71' : '#e74c3c' }]}>{log.qty}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Registrar Entrada/Salida</Text>
          </TouchableOpacity>
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
    backgroundColor: T.color.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: T.font.family.medium,
    fontSize: 14,
    color: T.color.text.muted,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titleSection: {
    marginTop: 10,
    marginBottom: 24,
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
  alertCard: {
    backgroundColor: '#fff5f5',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fadbd8',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 10,
    fontFamily: T.font.family.semibold,
    color: '#e74c3c',
    letterSpacing: 1,
  },
  criticalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  critName: {
    fontSize: 15,
    fontFamily: T.font.family.medium,
    color: T.color.text.primary,
  },
  critVals: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  critStock: {
    fontSize: 16,
    fontFamily: T.font.family.semibold,
    color: '#e74c3c',
  },
  critMin: {
    fontSize: 12,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: T.font.family.semibold,
    color: T.color.text.muted,
    letterSpacing: 1,
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  catCard: {
    flex: 1,
    backgroundColor: T.color.white,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f8f6f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  catName: {
    fontSize: 13,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
  catCount: {
    fontSize: 10,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
    marginTop: 2,
  },
  logCard: {
    backgroundColor: T.color.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logContent: {
    flex: 1,
  },
  logItemName: {
    fontSize: 14,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
  logDate: {
    fontSize: 11,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
    marginTop: 2,
  },
  logQty: {
    fontSize: 14,
    fontFamily: T.font.family.semibold,
  },
  primaryBtn: {
    backgroundColor: '#1E3A2F',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: T.font.family.semibold,
  },
});
