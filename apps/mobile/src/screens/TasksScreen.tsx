import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };
import { Menu, Filter, ChevronDown, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { TaskCard } from '../components/TaskCard';

export default function TasksScreen() {
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
            <Menu size={20} color={T.color.primary} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.screenTitle}>Tareas</Text>
            <Text style={styles.screenSubtitle}>25 tareas activas</Text>
          </View>
          <TouchableOpacity style={styles.headerIcon}>
            <Menu size={20} color={T.color.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity style={[styles.tab, styles.activeTab]}>
              <Text style={[styles.tabText, styles.activeTabText]}>Todas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tab}>
              <Text style={styles.tabText}>Hoy</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Activas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Listas</Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.filterBtn}>
              <Filter size={14} color={T.color.text.primary} style={{ marginRight: 6 }} />
              <Text style={styles.controlText}>Filtrar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateBtn}>
              <Text style={styles.controlText}>Fecha</Text>
              <ChevronDown size={14} color={T.color.text.primary} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>

          {/* Task List */}
          <TaskCard 
            title="Revisar bebedero"
            paddock="Potrero Sur"
            lot="Angus"
            time="Hoy, 8:00 AM"
            priority="Alta"
            assignee="Jaime"
            status="Activa"
            color="#2d6a4f"
          />
          <TaskCard 
            title="Mover lote Norte"
            paddock="Potrero Central"
            lot="110 novillos"
            time="Mañana, 10:00 AM"
            priority="Media"
            assignee="Jaime"
            status="Pendiente"
            color="#d68910"
          />
          <TaskCard 
            title="Pesar lote 3"
            paddock="Manga principal"
            lot="45 animales"
            time="Ayer, 14:00"
            priority="Normal"
            assignee="Jaime"
            status="Lista"
            color="#546e7a"
          />
        </ScrollView>

        {/* FAB */}
        <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.fab}>
            <Plus size={20} color={T.color.white} style={{ marginRight: 8 }} />
            <Text style={styles.fabText}>Nueva tarea</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#ecebe6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  screenTitle: {
    fontFamily: T.font.family.semibold,
    fontSize: 18,
    color: T.color.text.primary,
  },
  screenSubtitle: {
    fontFamily: T.font.family.regular,
    fontSize: 12,
    color: T.color.text.muted,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ecebe6',
    borderRadius: 12,
    padding: 4,
    marginTop: 20,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: T.color.white,
  },
  tabText: {
    fontFamily: T.font.family.medium,
    fontSize: 14,
    color: T.color.text.muted,
  },
  activeTabText: {
    color: T.color.text.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: T.font.family.semibold,
    fontSize: 24,
    color: T.color.text.primary,
  },
  statLabel: {
    fontFamily: T.font.family.regular,
    fontSize: 12,
    color: T.color.text.muted,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecebe6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  controlText: {
    fontFamily: T.font.family.medium,
    fontSize: 13,
    color: T.color.text.primary,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  fab: {
    backgroundColor: '#1E3A2F',
    flexDirection: 'row',
    height: 56,
    width: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  fabText: {
    fontFamily: T.font.family.semibold,
    fontSize: 16,
    color: T.color.white,
  },
});
