/**
 * Quick action card — floating card with icon + label.
 * Reference: dribbble.com/shots/26674910-AI-ChatBot-Mobile-App-Design
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  icon: string;
  label: string;
  onPress: () => void;
}

export function QuickActionCard({ icon, label, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '46%',
    margin: '2%',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  iconWrap: {
    width: 36,
    height: 36,
    marginBottom: 10,
  },
  icon: {
    fontSize: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
    lineHeight: 18,
  },
});
