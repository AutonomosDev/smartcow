import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const T = { color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', text: { primary: '#1E3A2F', muted: '#7a7a6e' } }, font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } } };

interface TaskCardProps {
  title: string;
  paddock: string;
  lot: string;
  time: string;
  priority: 'Alta' | 'Media' | 'Baja' | 'Normal';
  assignee: string;
  status: 'Activa' | 'Pendiente' | 'Lista';
  color: string;
}

export const TaskCard = ({ title, paddock, lot, time, priority, assignee, status, color }: TaskCardProps) => {
  const priorityColor = priority === 'Alta' ? T.color.danger : (priority === 'Media' ? '#d68910' : T.color.primary);
  const statusConfig = {
    Activa: { bg: '#e6f3ec', text: '#2d6a4f' },
    Pendiente: { bg: '#fef3e7', text: '#d68910' },
    Lista: { bg: '#f0f4f8', text: '#546e7a' }
  };
  const sc = statusConfig[status];

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: color }]}>
          <View style={[styles.innerDot, { backgroundColor: T.color.white }]} />
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <Text style={[styles.statusText, { color: sc.text }]}>{status}</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>{paddock} · {lot}</Text>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>{time} · <Text style={{ color: priorityColor }}>● {priority} prioridad</Text></Text>
            <View style={styles.assigneeRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{assignee.charAt(0)}</Text>
              </View>
              <Text style={styles.assigneeName}>{assignee}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: T.color.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontFamily: T.font.family.semibold,
    fontSize: 15,
    color: T.color.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontFamily: T.font.family.medium,
    fontSize: 11,
  },
  subtitle: {
    fontFamily: T.font.family.regular,
    fontSize: 12,
    color: T.color.text.muted,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: T.font.family.regular,
    fontSize: 12,
    color: T.color.text.muted,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1E3A2F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  avatarText: {
    color: T.color.white,
    fontSize: 10,
    fontFamily: T.font.family.semibold,
  },
  assigneeName: {
    fontFamily: T.font.family.regular,
    fontSize: 12,
    color: T.color.text.primary,
  },
});
