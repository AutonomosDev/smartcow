import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStackParamList } from '../../App';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TRACK_WIDTH = SCREEN_WIDTH - 48;
const THUMB_SIZE = 56;
const SWIPE_THRESHOLD = 0.85;

interface SplashScreenProps {
  fundoNombre?: string;
}

export default function SplashScreen({ fundoNombre }: SplashScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const thumbX = useRef(new Animated.Value(0)).current;
  const [completed, setCompleted] = useState(false);

  const maxX = TRACK_WIDTH - THUMB_SIZE - 8;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(0, Math.min(gestureState.dx, maxX));
        thumbX.setValue(newX);
      },
      onPanResponderRelease: async (_, gestureState) => {
        const progress = gestureState.dx / maxX;
        if (progress >= SWIPE_THRESHOLD) {
          // Completado — llevar al final y navegar
          Animated.timing(thumbX, {
            toValue: maxX,
            duration: 150,
            useNativeDriver: false,
          }).start(async () => {
            setCompleted(true);
            if (Platform.OS !== 'web') {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            await AsyncStorage.setItem('@smartcow:launched', '1');
            navigation.replace('Login');
          });
        } else {
          // No completado — volver al inicio
          Animated.spring(thumbX, {
            toValue: 0,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const trackTextOpacity = thumbX.interpolate({
    inputRange: [0, maxX * 0.5],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const nombre = fundoNombre ?? 'Tu Asistente Agrícola';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={require('../../assets/splash_bg.jpg')}
        style={styles.bg}
        resizeMode="cover"
      >
        {/* Overlay gradiente */}
        <View style={styles.overlay} />

        {/* TOP — Logo + marca */}
        <View style={styles.top}>
          <View style={styles.logoRow}>
            <Text style={styles.brandText}>
              <Text style={styles.brandSmart}>smart</Text>
              <Text style={styles.brandCow}>Cow</Text>
            </Text>
          </View>

          <Text style={styles.fundoNombre}>{nombre}</Text>
          <Text style={styles.tagline}>
            Por fin tus herramientas hablan con tus datos.
          </Text>
        </View>

        {/* BOTTOM — Swipe to enter */}
        <View style={styles.bottom}>
          <View style={styles.track}>
            {/* Texto del track */}
            <Animated.Text style={[styles.trackText, { opacity: trackTextOpacity }]}>
              Desliza para entrar  ›››
            </Animated.Text>

            {/* Thumb deslizable */}
            <Animated.View
              style={[styles.thumb, { transform: [{ translateX: thumbX }] }]}
              {...panResponder.panHandlers}
            >
              <Text style={styles.thumbArrow}>›</Text>
            </Animated.View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bg: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  top: {
    flex: 1,
    paddingTop: 72,
    paddingHorizontal: 24,
    // overlay oscuro solo en la parte superior para legibilidad
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandText: {
    fontSize: 28,
    lineHeight: 32,
  },
  brandSmart: {
    fontFamily: 'DMSans_600SemiBold',
    color: '#7ecfa0',
    fontSize: 28,
  },
  brandCow: {
    fontFamily: 'DMSans_600SemiBold',
    color: '#1E3A2F',
    fontSize: 28,
  },
  fundoNombre: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 22,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 8,
  },
  tagline: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 20,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 56,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  track: {
    width: TRACK_WIDTH,
    height: THUMB_SIZE + 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: (THUMB_SIZE + 8) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  trackText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },
  thumb: {
    position: 'absolute',
    left: 4,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbArrow: {
    fontSize: 24,
    color: '#ffffff',
  },
});
