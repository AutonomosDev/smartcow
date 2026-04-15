import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, PanResponder } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path } from 'react-native-svg';

import { Hero } from '../components/Hero';
import { useAuth } from '../context/AuthContext';
import { api, PredioKpis } from '../lib/api';

const tokens = {
  font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' } },
};

type NavProp = NativeStackNavigationProp<any>;

export default function HomeScreen() {
  const { predioId, user } = useAuth();
  const navigation = useNavigation<NavProp>();
  const [kpis, setKpis] = useState<PredioKpis | null>(null);

  useEffect(() => {
    api.get<PredioKpis>(`/api/predio/${predioId}/kpis`)
      .then(setKpis)
      .catch(() => {});
  }, [predioId]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 20,
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -50) {
          // Swipe left -> go to Chat
          navigation.navigate('SmartCowChat');
        }
      },
    })
  ).current;

  const onChatPress = () => {
    navigation.navigate('SmartCowChat');
  };

  const weatherStrip = [
    { day: 'Hoy', icon: '🌧', temp: '6°', isToday: true },
    { day: 'Sáb', icon: '🌦', temp: '8°' },
    { day: 'Dom', icon: '⛅', temp: '11°' },
    { day: 'Lun', icon: '☀️', temp: '13°' },
    { day: 'Mar', icon: '☀️', temp: '14°' },
    { day: 'Mié', icon: '🌦', temp: '9°' },
  ];

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar style="light" />
      <ImageBackground
        source={require('../../../../public/1.jpg')}
        style={styles.bg}
        imageStyle={{ objectFit: 'cover' }}
      >
        <LinearGradient
          colors={['rgba(5,18,10,0.72)', 'transparent']}
          style={styles.ovTop}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(5,18,10,0.82)', 'rgba(5,18,10,0.96)']}
          locations={[0, 0.45, 1]}
          style={styles.ovBot}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        
        <SafeAreaView style={styles.contentContainer} edges={['top', 'bottom']}>
           <Hero userName={user?.nombre} />
           
           <View style={styles.spacer} />
           
           <View style={styles.bottom}>
              {/* Weather Card */}
              <View style={[styles.card, styles.blurCard]}>
                 <View style={styles.wTop}>
                    <View>
                       <Text style={styles.temp}>6<Text style={styles.tempSup}>°C</Text></Text>
                       <Text style={styles.wDesc}>Lluvia leve · Fundo San Pedro</Text>
                    </View>
                    <View style={styles.wRight}>
                       <Text style={styles.wPredio}>Los Lagos</Text>
                       <Text style={styles.wStatus}>Drone no vuela hoy</Text>
                    </View>
                 </View>
                 <View style={styles.wStrip}>
                    {weatherStrip.map((w, idx) => (
                       <View key={idx} style={styles.wday}>
                          <Text style={styles.wdN}>{w.day}</Text>
                          <Text style={styles.wdI}>{w.icon}</Text>
                          <Text style={[styles.wdT, w.isToday && styles.wdTHoy]}>{w.temp}</Text>
                          {w.isToday && <View style={styles.wdDot} />}
                       </View>
                    ))}
                 </View>
              </View>

              {/* Data Row */}
              <View style={styles.dataRow}>
                 <View style={[styles.dc, styles.blurCard]}>
                    <Text style={styles.dcL}>DÓLAR</Text>
                    <Text style={styles.dcV}>$938</Text>
                    <Text style={styles.dcS}>+$4 vs ayer</Text>
                 </View>
                 <View style={[styles.dc, styles.blurCard]}>
                    <Text style={styles.dcL}>UF</Text>
                    <Text style={styles.dcV}>$38.420</Text>
                    <Text style={styles.dcS}>Actualizada</Text>
                 </View>
                 <View style={[styles.dc, styles.blurCard]}>
                    <Text style={styles.dcL}>ANIMALES</Text>
                    <Text style={[styles.dcV, styles.ok]}>{kpis?.totalAnimales || 242}</Text>
                    <Text style={styles.dcS}>Activos</Text>
                 </View>
              </View>

              {/* Alert */}
              <View style={styles.alert}>
                 <View style={styles.aDot} />
                 <Text style={styles.aTxt}>Bebedero Corral 3 vacío · 38 animales sin agua 13 hrs</Text>
                 <Text style={styles.aArr}>›</Text>
              </View>

              {/* Chat Botón */}
              <TouchableOpacity style={styles.chatBtn} onPress={onChatPress} activeOpacity={0.8}>
                 <LinearGradient 
                   colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.05)']} 
                   start={{ x: 0, y: 0 }} 
                   end={{ x: 0, y: 1 }} 
                   style={styles.chatBtnGradient}
                 >
                   <View style={styles.cbLeft}>
                       <View style={styles.cbIcon}>
                         <Svg width={18} height={18} viewBox="0 0 16 16" fill="none">
                           <Circle cx={8} cy={8} r={6} stroke="#fff" strokeWidth={2}/>
                           <Path d="M6 8h4M8 6v4" stroke="#fff" strokeWidth={2} strokeLinecap="round"/>
                         </Svg>
                       </View>
                       <View>
                           <Text style={styles.cbTitle}>Hablar con SmartCow</Text>
                           <Text style={styles.cbSub}>Desliza o presiona para iniciar</Text>
                       </View>
                   </View>
                   <View style={styles.cbArrCont}>
                      <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                        <Path d="M3 6h6M6 3l3 3-3 3" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                      </Svg>
                   </View>
                 </LinearGradient>
              </TouchableOpacity>

              {/* Dots */}
              <View style={styles.dots}>
                 <View style={[styles.dot, styles.dotOn]} />
                 <View style={styles.dot} />
              </View>
           </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bg: { flex: 1, width: '100%', height: '100%' },
  ovTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 180 },
  ovBot: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 420 },
  contentContainer: { flex: 1, display: 'flex', flexDirection: 'column' },
  spacer: { flex: 1 },
  bottom: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },
  
  card: {
    paddingVertical: 20,
    paddingHorizontal: 18,
  },
  blurCard: {
    backgroundColor: 'rgba(5,22,12,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
  },
  
  wTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  temp: { fontSize: 44, fontFamily: tokens.font.family.semibold, color: '#fff', letterSpacing: -1 },
  tempSup: { fontSize: 16, fontFamily: tokens.font.family.regular, color: 'rgba(255,255,255,0.5)' },
  wDesc: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: tokens.font.family.regular, marginTop: 4 },
  wRight: { alignItems: 'flex-end' },
  wPredio: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: tokens.font.family.regular, marginBottom: 4 },
  wStatus: { fontSize: 12, fontFamily: tokens.font.family.medium, color: '#7ecfa0' },
  
  wStrip: { flexDirection: 'row', gap: 5, justifyContent: 'space-between', marginTop: 8 },
  wday: { flex: 1, alignItems: 'center', gap: 4 },
  wdN: { fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: tokens.font.family.medium },
  wdI: { fontSize: 16, lineHeight: 20 },
  wdT: { fontSize: 12, fontFamily: tokens.font.family.semibold, color: 'rgba(255,255,255,0.7)' },
  wdTHoy: { color: '#fff', fontSize: 13 },
  wdDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#7ecfa0', marginTop: 2 },

  dataRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  dc: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(5,22,12,0.65)',
  },
  dcL: { fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontFamily: tokens.font.family.medium, letterSpacing: 0.3 },
  dcV: { fontSize: 18, fontFamily: tokens.font.family.semibold, color: '#fff', letterSpacing: -0.3 },
  ok: { color: '#7ecfa0' },
  dcS: { fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontFamily: tokens.font.family.regular },

  alert: {
    backgroundColor: 'rgba(160,30,20,0.45)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,100,80,0.3)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  aDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff6b6b' },
  aTxt: { fontSize: 13, color: 'rgba(255,255,255,0.88)', lineHeight: 18, flex: 1, fontFamily: tokens.font.family.medium },
  aArr: { fontSize: 16, color: 'rgba(255,255,255,0.3)', fontFamily: tokens.font.family.regular },

  chatBtn: {
    borderRadius: 30, // Pill shape
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 4,
  },
  chatBtnGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 30,
  },
  cbLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cbIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cbTitle: { 
    fontSize: 16, 
    fontFamily: tokens.font.family.semibold, 
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cbSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontFamily: tokens.font.family.regular },
  cbArrCont: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotOn: { backgroundColor: '#7ecfa0', width: 16, borderRadius: 3 },
});
