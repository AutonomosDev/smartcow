/**
 * AgentPlan — shows only when Claude executes an action touching real data.
 * Appears as a collapsible card above the chat input.
 */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Action {
  label: string;
  status: 'running' | 'done' | 'error';
  detail?: string;
}

interface Props {
  actions: Action[];
  visible: boolean;
}

const STATUS_ICON: Record<Action['status'], string> = {
  running: '⟳',
  done: '✓',
  error: '✗',
};
const STATUS_COLOR: Record<Action['status'], string> = {
  running: '#d97706',
  done: '#16a34a',
  error: '#dc2626',
};

export function AgentPlan({ actions, visible }: Props) {
  const height = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && actions.length > 0) {
      Animated.parallel([
        Animated.timing(height, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(height, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible, actions.length, height, opacity]);

  const maxH = height.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 160],
  });

  return (
    <Animated.View style={[styles.container, { maxHeight: maxH, opacity }]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Plan de agente</Text>
      </View>
      {actions.map((action, i) => (
        <View key={i} style={styles.actionRow}>
          <Text style={[styles.statusIcon, { color: STATUS_COLOR[action.status] }]}>
            {STATUS_ICON[action.status]}
          </Text>
          <View style={styles.actionInfo}>
            <Text style={styles.actionLabel}>{action.label}</Text>
            {action.detail ? (
              <Text style={styles.actionDetail}>{action.detail}</Text>
            ) : null}
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fefce8',
    borderTopWidth: 1,
    borderTopColor: '#fde68a',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  statusIcon: {
    fontSize: 14,
    width: 20,
    fontWeight: '700',
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 13,
    color: '#78350f',
  },
  actionDetail: {
    fontSize: 11,
    color: '#a16207',
    marginTop: 1,
  },
});
