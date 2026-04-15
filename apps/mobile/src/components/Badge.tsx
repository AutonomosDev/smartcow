import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const badges = {
  urgente:  { bg: '#fde8e8', text: '#c0392b' },
  atencion: { bg: '#fdf0e6', text: '#9b5e1a' },
  ok:       { bg: '#e6f3ec', text: '#1e3a2f' },
  info:     { bg: '#e6f0f8', text: '#1a5276' },
  neutro:   { bg: '#ebe9e3', text: '#666666' },
};

interface BadgeProps {
  type: keyof typeof badges;
  text: string;
}

export const Badge = ({ type, text }: BadgeProps) => {
  const config = badges[type] ?? badges.neutro;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  text: {
    fontSize: 10,
    fontFamily: 'DMSans_600SemiBold',
  },
});
