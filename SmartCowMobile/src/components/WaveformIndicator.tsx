/**
 * Animated waveform — shown on the VoiceScreen while recording.
 * Bars animate independently to simulate an audio waveform.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const BAR_COUNT = 24;
const BAR_HEIGHT_MAX = 48;
const BAR_HEIGHT_MIN = 6;

function Bar({ index, active }: { index: number; active: boolean }) {
  const anim = useRef(new Animated.Value(BAR_HEIGHT_MIN)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (active) {
      const delay = (index * 60) % 400;
      const period = 350 + Math.floor(Math.random() * 250);
      const target = BAR_HEIGHT_MIN + Math.random() * (BAR_HEIGHT_MAX - BAR_HEIGHT_MIN);

      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: target,
            duration: period / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: BAR_HEIGHT_MIN,
            duration: period / 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      );
      loopRef.current = loop;
      loop.start();
    } else {
      loopRef.current?.stop();
      Animated.timing(anim, {
        toValue: BAR_HEIGHT_MIN,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
    return () => loopRef.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return <Animated.View style={[styles.bar, { height: anim }]} />;
}

interface Props {
  active: boolean;
}

export function WaveformIndicator({ active }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <Bar key={i} index={i} active={active} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BAR_HEIGHT_MAX + 8,
    gap: 3,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#16a34a',
  },
});
