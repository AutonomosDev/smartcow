/**
 * Animated green orb — the identity element of the SmartCow AI.
 * Pulses with a slow breath animation and glows on the outer ring.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const GREEN = '#16a34a';
const GREEN_GLOW = '#22c55e';
const GREEN_OUTER = '#dcfce7';

interface Props {
  size?: number;
  active?: boolean; // true = faster pulse when streaming
}

export function AnimatedOrb({ size = 120, active = false }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const outer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = active ? 800 : 2200;

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const outerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(outer, {
          toValue: 1,
          duration: duration,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(outer, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();
    outerLoop.start();

    return () => {
      pulseLoop.stop();
      outerLoop.stop();
    };
  }, [active, pulse, outer]);

  const outerScale = outer.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  });
  const outerOpacity = outer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.3, 0],
  });

  return (
    <View style={[styles.container, { width: size * 1.5, height: size * 1.5 }]}>
      {/* outer glow ring */}
      <Animated.View
        style={[
          styles.outer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            opacity: outerOpacity,
            transform: [{ scale: outerScale }],
          },
        ]}
      />
      {/* middle ring */}
      <View
        style={[
          styles.middle,
          {
            width: size * 0.88,
            height: size * 0.88,
            borderRadius: (size * 0.88) / 2,
          },
        ]}
      />
      {/* core */}
      <Animated.View
        style={[
          styles.core,
          {
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: (size * 0.7) / 2,
            transform: [{ scale: pulse }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outer: {
    position: 'absolute',
    backgroundColor: GREEN_OUTER,
  },
  middle: {
    position: 'absolute',
    backgroundColor: GREEN_GLOW,
    opacity: 0.5,
  },
  core: {
    backgroundColor: GREEN,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
  },
});
