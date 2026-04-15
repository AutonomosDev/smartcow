import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const tokens = {
  font: {
    family: { regular: 'DMSans_400Regular', semibold: 'DMSans_600SemiBold' },
  },
};

interface HeroProps {
  userName?: string;
}

export const Hero = ({ userName }: HeroProps) => {
  const initials = userName
    ? userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'JP';
  const displayName = userName ?? 'Juan Pablo';

  return (
    <View style={styles.topRow}>
      <View>
        <Text style={styles.hola}>Buenos días</Text>
        <Text style={styles.nombre}>{displayName}</Text>
      </View>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  hola: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    fontFamily: tokens.font.family.regular,
    marginBottom: 1,
  },
  nombre: {
    fontSize: 17,
    fontFamily: tokens.font.family.semibold,
    color: '#fff',
    letterSpacing: -0.3,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e3a2f',
    borderWidth: 2,
    borderColor: 'rgba(126,207,160,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#7ecfa0',
    fontSize: 12,
    fontFamily: tokens.font.family.semibold,
  },
});
