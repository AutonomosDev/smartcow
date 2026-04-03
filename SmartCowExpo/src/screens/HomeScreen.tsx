/**
 * HomeScreen — SmartCow AI entry point.
 * Gradient background + animated orb + personalized greeting + quick action cards.
 * Reference: dribbble.com/shots/26674910-AI-ChatBot-Mobile-App-Design
 */
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AnimatedOrb } from '../components/AnimatedOrb';
import { QuickActionCard } from '../components/QuickActionCard';
import { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: NavProp;
}

const QUICK_ACTIONS = [
  { icon: '🔍', label: 'Escanear\nanimal', message: 'Quiero escanear un animal para identificarlo.' },
  { icon: '⚖️', label: 'Sync\nromana', message: 'Sincronizar datos de la romana.' },
  { icon: '📊', label: 'Pesajes\nhoy', message: 'Muéstrame todos los pesajes registrados hoy.' },
  { icon: '🐄', label: 'Partos\npendientes', message: 'Lista los animales con partos pendientes.' },
];

const USER_NAME = 'Juan Pablo';

export function HomeScreen({ navigation }: Props) {
  function openChat(initialMessage?: string) {
    navigation.navigate('Chat', { initialMessage });
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#e8e0f7', '#f5e6f0', '#fde8d8', '#fef3e2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Header row */}
          <View style={styles.headerRow}>
            <Text style={styles.appName}>SmartCow</Text>
            <TouchableOpacity style={styles.menuBtn} onPress={() => {}}>
              <Text style={styles.menuIcon}>⋯</Text>
            </TouchableOpacity>
          </View>

          {/* Orb + greeting */}
          <View style={styles.orbSection}>
            <AnimatedOrb size={120} />
            <Text style={styles.greeting}>Hola, {USER_NAME}</Text>
            <Text style={styles.subtitle}>¿En qué te puedo ayudar hoy?</Text>
          </View>

          {/* Quick action cards — 2x2 grid */}
          <View style={styles.grid}>
            {QUICK_ACTIONS.map(action => (
              <QuickActionCard
                key={action.label}
                icon={action.icon}
                label={action.label}
                onPress={() => openChat(action.message)}
              />
            ))}
          </View>

          {/* Main chat input bar */}
          <TouchableOpacity
            style={styles.chatBar}
            onPress={() => openChat()}
            activeOpacity={0.85}
          >
            <Text style={styles.chatBarText}>Pregunta algo sobre tu campo...</Text>
            <View style={styles.micButton}>
              <Text style={styles.micIcon}>🎙</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.footer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#e8e0f7',
  },
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    letterSpacing: -0.3,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 18,
    color: '#1a1a2e',
    letterSpacing: 2,
  },
  orbSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 40,
  },
  greeting: {
    marginTop: 24,
    fontSize: 26,
    fontWeight: '700',
    color: '#16a34a',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a2e',
    letterSpacing: -0.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  chatBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 28,
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  chatBarText: {
    flex: 1,
    fontSize: 15,
    color: '#94a3b8',
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  micIcon: {
    fontSize: 20,
  },
  footer: {
    height: 16,
  },
});
