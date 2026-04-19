import React, { useRef, useState } from 'react';
import {
  View, StyleSheet, TextInput, TouchableOpacity,
  Image, PanResponder,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowRight } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

type NavProp = NativeStackNavigationProp<any>;

export default function HomeScreen() {
  useAuth();
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');

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
    goToChat(inputText.trim() || undefined);
    setInputText('');
  };

  return (
    <View style={s.root} {...panResponder.panHandlers}>
      <StatusBar style="dark" />

      {/* Vaca full screen */}
      <Image
        source={require('../../../../public/cow_robot.png')}
        style={s.cow}
        resizeMode="contain"
      />

      {/* Input flotante — glassmorphism */}
      <BlurView
        intensity={28}
        tint="dark"
        style={[s.bar, { bottom: insets.bottom + 24 }]}
      >
        <TextInput
          style={s.input}
          placeholder="Escribe a SmartCow..."
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={inputText}
          onChangeText={setInputText}
          onFocus={() => { if (!inputText) goToChat(); }}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={s.sendBtn} onPress={handleSend} activeOpacity={0.85}>
          <ArrowRight size={16} color="#fff" />
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  cow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%',
    height: '100%',
  },

  bar: {
    position: 'absolute',
    left: 20, right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    overflow: 'hidden',
    paddingVertical: 10,
    paddingLeft: 22,
    paddingRight: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    paddingVertical: 2,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center', alignItems: 'center',
  },
});
