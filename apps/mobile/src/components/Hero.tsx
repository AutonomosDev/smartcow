import React from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';
const tokens = {
  color: { bg: '#f8f6f1', primary: '#1e3a2f', white: '#ffffff', cream: '#ebe9e3', danger: '#e74c3c', warning: '#f39c12', info: '#1a5276', text: { primary: '#1a1a1a', secondary: '#888888', muted: '#bbbbbb' } },
  font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' }, size: { xs: 10, sm: 11, md: 13, base: 14, lg: 16, xl: 20, xxl: 28 } },
  radius: { card: 14, btn: 12, chip: 20, hero: 16, small: 8 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
};

interface HeroProps {
  userName?: string;
}

export const Hero = ({ userName }: HeroProps) => {
  const initials = userName
    ? userName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'SC';
  const displayName = userName ?? 'SmartCow';

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=800' }}
        style={styles.image}
        resizeMode="cover"
      >
        <View style={styles.overlayTop} />
        <View style={styles.overlayBot} />

        {/* Top row */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.hola}>Buenos días,</Text>
            <Text style={styles.nombre}>{displayName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        {/* Bottom row */}
        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.predio}>Fundo San Pedro · Los Lagos</Text>
            <View style={styles.tempRow}>
              <Text style={styles.temp}>6°</Text>
              <Text style={styles.desc}>Lluvia leve · Drone no vuela hoy</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlayTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlayBot: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 90,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topRow: {
    position: 'absolute',
    top: 44,
    left: 16, right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hola: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: tokens.font.family.regular,
    marginBottom: 1,
  },
  nombre: {
    fontSize: 15,
    color: '#fff',
    fontFamily: tokens.font.family.semibold,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: tokens.color.primary,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: tokens.font.family.semibold,
  },
  bottomRow: {
    position: 'absolute',
    bottom: 10,
    left: 16, right: 16,
  },
  predio: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: tokens.font.family.regular,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  temp: {
    fontSize: 26,
    fontFamily: tokens.font.family.semibold,
    color: '#fff',
    lineHeight: 32,
  },
  desc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: tokens.font.family.regular,
  },
});
