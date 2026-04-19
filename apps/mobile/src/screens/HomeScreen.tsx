import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Image, KeyboardAvoidingView, Platform, Animated,
  PanResponder, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Paperclip, Mic, ArrowRight, Zap, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const { width: SW } = Dimensions.get('window');

const C = {
  bg:     '#ffffff',
  fog:    '#f0ede8',
  cream:  '#ebe9e3',
  ink1:   '#1a1a1a',
  ink2:   '#666',
  ink3:   '#999',
  ink4:   '#bbb',
  green:  '#1e3a2f',
  leaf:   '#7ecfa0',
  note:   '#fafaf7',
  noteBd: '#e8e5dd',
};

const F = {
  regular: 'DMSans_400Regular',
  medium:  'DMSans_500Medium',
  bold:    'DMSans_600SemiBold',
  mono:    'JetBrainsMono_400Regular',
  monoMd:  'JetBrainsMono_500Medium',
};

type NavProp = NativeStackNavigationProp<any>;

export default function HomeScreen() {
  const { } = useAuth();
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');

  // Pulsing arrow animation
  const arrowX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowX, { toValue: 6,  duration: 560, useNativeDriver: true }),
        Animated.timing(arrowX, { toValue: 0,  duration: 560, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Swipe left → chat
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 18 && Math.abs(gs.dy) < 40,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -50) navigation.navigate('SmartCowChat');
      },
    })
  ).current;

  const goToChat = (text?: string) => {
    navigation.navigate('SmartCowChat', text ? { initialText: text } : undefined);
  };

  const handleSend = () => {
    const t = inputText.trim();
    goToChat(t || undefined);
    setInputText('');
  };

  return (
    <View style={s.root} {...panResponder.panHandlers}>
      <StatusBar style="dark" />
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

        {/* ── Centro — vaca protagonista ── */}
        <View style={s.center}>
          <Image
            source={require('../../../../public/cow_robot.png')}
            style={s.cowImg}
            resizeMode="contain"
          />

          {/* Swipe pill */}
          <TouchableOpacity
            style={s.swipePill}
            onPress={() => goToChat()}
            activeOpacity={0.75}
          >
            <View style={s.swipeDot} />
            <Text style={s.swipeTxt}>Desliza para chatear</Text>
            <Animated.View style={{ transform: [{ translateX: arrowX }] }}>
              <ChevronRight size={14} color={C.green} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* ── Cajón inferior ── */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={insets.top}
        >
          <View style={[s.comp, { paddingBottom: Math.max(insets.bottom + 6, 28) }]}>

            {/* ⚡ + más ▾ */}
            <View style={s.ctxRow}>
              <View style={s.rayoBtn}>
                <Zap size={13} color={C.ink2} />
              </View>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={s.masText}>más ▾</Text>
              </TouchableOpacity>
            </View>

            {/* Input */}
            <View style={s.inputBox}>
              <TouchableOpacity style={s.inputIc} activeOpacity={0.7}>
                <Paperclip size={14} color={C.ink1} />
              </TouchableOpacity>
              <TextInput
                style={s.inputTxt}
                placeholder="Escribe a SmartCow..."
                placeholderTextColor={C.ink4}
                value={inputText}
                onChangeText={setInputText}
                onFocus={() => { if (!inputText) goToChat(); }}
                multiline
                returnKeyType="default"
              />
              <TouchableOpacity style={s.inputIc} activeOpacity={0.7}>
                <Mic size={14} color={C.ink1} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.inputIc, s.sendBtn]}
                onPress={handleSend}
                activeOpacity={0.85}
              >
                <ArrowRight size={14} color="#fff" />
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safe: { flex: 1 },

  // Centro
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  cowImg: {
    width: SW * 0.68,
    height: SW * 0.68,
  },

  // Swipe pill
  swipePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 30,
    borderWidth: 0.5,
    borderColor: C.noteBd,
    backgroundColor: C.note,
  },
  swipeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.leaf,
  },
  swipeTxt: {
    fontFamily: F.monoMd,
    fontSize: 12,
    color: C.green,
    letterSpacing: 0.2,
  },

  // Cajón
  comp: {
    backgroundColor: C.bg,
    borderTopWidth: 0.5, borderTopColor: C.fog,
    paddingTop: 10, paddingHorizontal: 12, gap: 7,
  },
  ctxRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 7, paddingHorizontal: 10,
    borderWidth: 0.5, borderColor: '#e0ddd8', borderRadius: 8,
  },
  rayoBtn: {
    width: 22, height: 22, borderRadius: 6, backgroundColor: C.cream,
    alignItems: 'center', justifyContent: 'center',
  },
  masText: { fontFamily: F.mono, fontSize: 12, color: C.ink3 },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 0.5, borderColor: '#e0ddd8', borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 8, minHeight: 44,
  },
  inputIc: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.cream, justifyContent: 'center', alignItems: 'center',
  },
  inputTxt: { flex: 1, fontFamily: F.regular, fontSize: 13, color: C.ink1, paddingVertical: 2 },
  sendBtn:  { backgroundColor: C.green },
});
