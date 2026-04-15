/**
 * HomeScreen — entry point of SmartCow Mobile.
 * Shows animated orb, personalized greeting, and 4 quick action cards.
 */
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AnimatedOrb } from '../components/AnimatedOrb';
import { QuickActionCard } from '../components/QuickActionCard';
import { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: NavProp;
}

// Quick actions — dynamic by context in production, hardcoded MVP
const QUICK_ACTIONS = [
  {
    icon: '📷',
    label: 'Escanear animal',
    message: 'Quiero escanear un animal para identificarlo.',
  },
  {
    icon: '⚖️',
    label: 'Sync romana',
    message: 'Sincronizar datos de la romana bluetooth.',
  },
  {
    icon: '📊',
    label: 'Ver pesajes hoy',
    message: 'Muéstrame todos los pesajes registrados hoy.',
  },
  {
    icon: '🐄',
    label: 'Partos pendientes',
    message: 'Lista los animales con partos pendientes este mes.',
  },
];

// Hardcoded for MVP — wire to auth in real build
const USER_NAME = 'Rodrigo';

export function HomeScreen({ navigation }: Props) {
  function openChat(initialMessage?: string) {
    navigation.navigate('Chat', { initialMessage });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Orb + greeting */}
        <View style={styles.orbSection}>
          <AnimatedOrb size={110} />
          <Text style={styles.greeting}>Hola, {USER_NAME}</Text>
          <Text style={styles.subtitle}>¿En qué te ayudo hoy?</Text>
        </View>

        {/* Quick access to chat (tap anywhere on orb section) */}
        <View style={styles.chatEntryRow}>
          <QuickActionCard
            icon="💬"
            label="Abrir chat"
            onPress={() => openChat()}
          />
          <QuickActionCard
            icon="🎙"
            label="Comando de voz"
            onPress={() => navigation.navigate('Voice')}
          />
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
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

        {/* Footer space */}
        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scroll: {
    paddingHorizontal: 16,
  },
  orbSection: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 24,
  },
  greeting: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: '#64748b',
  },
  chatEntryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: {
    height: 40,
  },
});
