import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };

interface BarChartProps {
  data: number[];
  labels: string[];
}

export const BarChart = ({ data, labels }: BarChartProps) => {
  const max = Math.max(...data);
  return (
    <View style={styles.container}>
      <View style={styles.chartArea}>
        {data.map((val, i) => (
          <View key={i} style={styles.barContainer}>
            <View 
              style={[
                styles.bar, 
                { height: (val / max) * 60 } // Max height 60px
              ]} 
            />
          </View>
        ))}
      </View>
      <View style={styles.labelsRow}>
        {labels.map((label, i) => (
          <Text key={i} style={styles.labelText}>{label}</Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    width: '100%',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 70,
    paddingHorizontal: 4,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: 14,
    backgroundColor: '#385045', // Dark green from mockup bars
    borderRadius: 3,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  labelText: {
    fontSize: 10,
    color: T.color.text.muted,
    fontFamily: T.font.family.regular,
  },
});
