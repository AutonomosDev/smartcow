import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };

interface ComparisonBarProps {
  percentage: number;
  color?: string;
  reference?: number;
  height?: number;
}

export const ComparisonBar = ({ percentage, color = T.color.primary, reference, height = 10 }: ComparisonBarProps) => {
  return (
    <View style={styles.container}>
      <View style={[styles.background, { height }]}>
        <View 
          style={[
            styles.fill, 
            { width: `${Math.min(percentage, 100)}%`, backgroundColor: color, height }
          ]} 
        />
        {reference !== undefined && (
          <View 
            style={[
              styles.reference, 
              { left: `${reference}%`, height: height + 6, top: -3 }
            ]} 
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 4,
  },
  background: {
    width: '100%',
    backgroundColor: '#ecebe6',
    borderRadius: 5,
    position: 'relative',
    overflow: 'visible',
  },
  fill: {
    borderRadius: 5,
  },
  reference: {
    position: 'absolute',
    width: 2,
    backgroundColor: T.color.text.muted,
    zIndex: 1,
  },
});
