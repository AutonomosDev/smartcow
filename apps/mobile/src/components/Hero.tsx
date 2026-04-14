import React from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';
import { tokens } from '../../../../packages/tokens/theme';

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
    height: 220,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlayTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  overlayBot: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 110,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  topRow: {
    position: 'absolute',
    top: 52,
    left: 18, right: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hola: {
    fontSize: tokens.font.size.sm,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: tokens.font.family.regular,
    marginBottom: 1,
  },
  nombre: {
    fontSize: 17,
    color: '#fff',
    fontFamily: tokens.font.family.semibold,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: tokens.color.primary,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: tokens.font.family.semibold,
  },
  bottomRow: {
    position: 'absolute',
    bottom: 12,
    left: 18, right: 18,
  },
  predio: {
    fontSize: tokens.font.size.xs,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: tokens.font.family.regular,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  temp: {
    fontSize: 34,
    fontFamily: tokens.font.family.semibold,
    color: '#fff',
    lineHeight: 40,
  },
  desc: {
    fontSize: tokens.font.size.sm,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: tokens.font.family.regular,
  },
});
