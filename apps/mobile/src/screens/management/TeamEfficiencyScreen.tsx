import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };
import { ChevronLeft, Menu, Users, Clock, Award, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { MetricGrid } from '../../components/MetricGrid';

const WORKERS = [
  { name: 'Jaime Soto', tasks: '12/14', time: '14m', efficiency: '92%', avatar: 'JS' },
  { name: 'Pedro Arce', tasks: '8/10', time: '22m', efficiency: '80%', avatar: 'PA' },
  { name: 'Luis Rivas', tasks: '15/15', time: '18m', efficiency: '98%', avatar: 'LR' },
];

export default function TeamEfficiencyScreen() {
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
          <Text style={styles.headerTitle}>Eficiencia Equipo</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Menu size={20} color={T.color.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Rendimiento Humano</Text>
            <Text style={styles.subtitle}>Consolidado Semanal · 3 Operarios</Text>
          </View>

          {/* Top Performer Card */}
          <View style={styles.topCard}>
            <Award size={32} color="#f1c40f" />
            <View style={styles.topContent}>
              <Text style={styles.topLabel}>DESTACADO DE LA SEMANA</Text>
              <Text style={styles.topName}>Luis Rivas</Text>
              <Text style={styles.topMetric}>100% tareas críticas resueltas en {`< 15m`}</Text>
            </View>
          </View>

          <MetricGrid 
            items={[
              { label: 'Tareas Total', value: '37' },
              { label: 'Tiempo Medio', value: '18 min' },
              { label: 'Alertas OK', value: '100%' },
              { label: 'Turnos Hoy', value: '3/3' }
            ]}
          />

          {/* Individual Performance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DETALLE POR OPERARIO</Text>
            {WORKERS.map((w, i) => (
              <View key={i} style={styles.workerCard}>
                <View style={styles.workerHeader}>
                  <View style={styles.workerInfo}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{w.avatar}</Text></View>
                    <View>
                      <Text style={styles.wName}>{w.name}</Text>
                      <Text style={styles.wMeta}>Respuesta media: {w.time}</Text>
                    </View>
                  </View>
                  <Text style={styles.effPct}>{w.efficiency}</Text>
                </View>
                
                <View style={styles.taskProgressRow}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: w.efficiency as any }]} />
                  </View>
                  <Text style={styles.taskCount}>{w.tasks} tareas</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.scheduleBtn}>
            <Clock size={18} color={T.color.primary} />
            <Text style={styles.scheduleBtnText}>Gestionar Turnos y Horarios</Text>
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
  topCard: {
    backgroundColor: '#1E3A2F',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
  },
  topContent: {
    flex: 1,
  },
  topLabel: {
    fontSize: 10,
    fontFamily: T.font.family.semibold,
    color: '#f1c40f',
    letterSpacing: 1,
  },
  topName: {
    fontSize: 20,
    fontFamily: T.font.family.semibold,
    color: T.color.white,
    marginTop: 4,
  },
  topMetric: {
    fontSize: 12,
    fontFamily: T.font.family.regular,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
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
  workerCard: {
    backgroundColor: T.color.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f6f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontFamily: T.font.family.semibold,
    color: T.color.primary,
  },
  wName: {
    fontSize: 15,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
  wMeta: {
    fontSize: 11,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
  },
  effPct: {
    fontSize: 18,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
  taskProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f8f6f1',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2ecc71',
    borderRadius: 3,
  },
  taskCount: {
    fontSize: 11,
    fontFamily: T.font.family.medium,
    color: T.color.text.muted,
    width: 60,
    textAlign: 'right',
  },
  scheduleBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ecebe6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  scheduleBtnText: {
    fontSize: 14,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
});
