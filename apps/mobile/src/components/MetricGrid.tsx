import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };

interface MetricItem {
  label: string;
  value: string | number;
  subValue?: string;
  color?: string;
}

interface MetricGridProps {
  items: MetricItem[];
  columns?: number;
  backgroundColor?: string;
}

export const MetricGrid = ({ 
  items, 
  columns = 2, 
  backgroundColor = T.color.white 
}: MetricGridProps) => {
  return (
    <View style={styles.grid}>
      {items.map((item, index) => (
        <View 
          key={index} 
          style={[
            styles.item, 
            { width: `${100 / columns}%`, backgroundColor }
          ]}
        >
          <Text style={styles.label}>{item.label}</Text>
          <Text style={[styles.value, item.color ? { color: item.color } : null]}>
            {item.value}
          </Text>
          {item.subValue && (
            <Text style={styles.subValue}>{item.subValue}</Text>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  item: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 0,
    borderWidth: 6,
    borderColor: 'transparent', // Using border to simulate gap while keeping width %
  },
  label: {
    fontSize: 10,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    fontFamily: T.font.family.semibold,
    color: T.color.text.primary,
  },
  subValue: {
    fontSize: 10,
    fontFamily: T.font.family.regular,
    color: T.color.text.muted,
    marginTop: 2,
  },
});
