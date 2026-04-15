import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };

interface Phase {
  title: string;
  duration: string;
  desc: string;
  status: 'actual' | 'upcoming' | 'completed';
}

interface NutritionTimelineProps {
  phases: Phase[];
}

export const NutritionTimeline = ({ phases }: NutritionTimelineProps) => {
  return (
    <View style={styles.container}>
      {phases.map((phase, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.lineCol}>
            <View style={[
              styles.dot, 
              phase.status === 'actual' ? styles.activeDot : (phase.status === 'completed' ? styles.completedDot : styles.upcomingDot)
            ]} />
            {i < phases.length - 1 && <View style={styles.line} />}
          </View>
          <View style={styles.contentCol}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, phase.status === 'upcoming' && styles.mutedText]}>{phase.title}</Text>
              {phase.status === 'actual' && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Actual</Text>
                </View>
              )}
              {phase.status === 'upcoming' && (
                <Text style={styles.duration}>~{phase.duration}</Text>
              )}
            </View>
            <Text style={[styles.desc, phase.status === 'upcoming' && styles.mutedText]}>{phase.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingLeft: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  lineCol: {
    alignItems: 'center',
    marginRight: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  activeDot: {
    backgroundColor: '#1E3A2F',
    borderWidth: 3,
    borderColor: '#e6f3ec',
  },
  completedDot: {
    backgroundColor: '#1E3A2F',
  },
  upcomingDot: {
    backgroundColor: '#bbbbbb',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#ecebe6',
    marginTop: 4,
    marginBottom: -28,
  },
  contentCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: T.font.family.semibold,
    fontSize: 15,
    color: T.color.text.primary,
  },
  badge: {
    backgroundColor: '#1E3A2F',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    color: T.color.white,
    fontSize: 10,
    fontFamily: T.font.family.semibold,
  },
  duration: {
    fontSize: 11,
    color: T.color.text.muted,
    fontFamily: T.font.family.regular,
  },
  desc: {
    fontFamily: T.font.family.regular,
    fontSize: 12,
    color: T.color.text.muted,
    lineHeight: 16,
  },
  mutedText: {
    color: '#bbbbbb',
  },
});
