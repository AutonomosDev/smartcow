import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const BTNS = [
  { icon: '🗺️', title: 'Mapa Predio', sub: 'Ver potreros', route: 'MapaPredio' },
  { icon: '📋', title: 'Tareas',      sub: '25 activas',  route: 'Tasks' },
  { icon: '🛸', title: 'Drone',       sub: 'Programar' },
];

export const QuickAccess = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.section}>
      <View style={styles.row}>
        {BTNS.map((b, i) => (
          <TouchableOpacity 
            key={i} 
            style={styles.btn} 
            activeOpacity={0.7}
            onPress={() => b.route ? navigation.navigate(b.route) : null}
          >
            <View style={styles.iconBox}>
              <Text style={styles.icon}>{b.icon}</Text>
            </View>
            <Text style={styles.btnTitle}>{b.title}</Text>
            <Text style={styles.btnSub}>{b.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  btn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#e6f3ec',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  icon: {
    fontSize: 14,
  },
  btnTitle: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: '#1E3A2F',
  },
  btnSub: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: '#7a7a6e',
  },
});
