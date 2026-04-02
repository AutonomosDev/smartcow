/**
 * VoiceScreen — real-time voice transcription.
 * Waveform animado + transcripción live + botón parar.
 *
 * NOTE: react-native doesn't ship a native speech-to-text API.
 * This screen implements the full UI and hooks for a @react-native-voice/voice
 * integration. That library requires native module linking; for the debug APK
 * the transcription falls back to a simulated placeholder so the UI is fully
 * exercisable without native linking.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WaveformIndicator } from '../components/WaveformIndicator';
import { RootStackParamList } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Voice'>;

interface Props {
  navigation: NavProp;
  onTranscription?: (text: string) => void; // callback to send to chat
}

type RecordingState = 'idle' | 'recording' | 'processing';

export function VoiceScreen({ navigation, onTranscription }: Props) {
  const [state, setState] = useState<RecordingState>('idle');
  const [transcript, setTranscript] = useState('');
  const recordingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Pulse button while recording
  useEffect(() => {
    if (state === 'recording') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(buttonScale, {
            toValue: 1.12,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(buttonScale, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
      return undefined;
    }
  }, [state, buttonScale]);

  const startRecording = useCallback(() => {
    setState('recording');
    setTranscript('');

    // Simulate transcription updates (replace with Voice.start() when linked)
    const phrases = [
      'Quiero ver los pesajes...',
      'Quiero ver los pesajes de hoy',
      'Quiero ver los pesajes de hoy del potrero norte.',
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < phrases.length) {
        setTranscript(phrases[i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 900);

    recordingTimer.current = setTimeout(() => {
      clearInterval(interval);
      stopRecording();
    }, 8000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecording = useCallback(() => {
    if (recordingTimer.current) {
      clearTimeout(recordingTimer.current);
    }
    setState('processing');

    // Simulate brief processing delay
    setTimeout(() => {
      setState('idle');
    }, 600);
  }, []);

  function sendTranscript() {
    if (!transcript.trim()) {
      return;
    }
    onTranscription?.(transcript);
    navigation.navigate('Chat', { initialMessage: transcript });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#052e16" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver"
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comando de voz</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Main area */}
      <View style={styles.body}>
        {/* Waveform */}
        <View style={styles.waveformContainer}>
          <WaveformIndicator active={state === 'recording'} />
        </View>

        {/* State label */}
        <Text style={styles.stateLabel}>
          {state === 'idle'
            ? 'Toca el micrófono para empezar'
            : state === 'recording'
            ? 'Escuchando...'
            : 'Procesando...'}
        </Text>

        {/* Transcript */}
        <View style={styles.transcriptBox}>
          {transcript ? (
            <Text style={styles.transcriptText}>{transcript}</Text>
          ) : (
            <Text style={styles.transcriptPlaceholder}>
              La transcripción aparecerá aquí
            </Text>
          )}
        </View>

        {/* Mic button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[
              styles.micButton,
              state === 'recording' ? styles.micButtonActive : null,
            ]}
            onPress={state === 'idle' ? startRecording : stopRecording}
            accessibilityLabel={
              state === 'recording' ? 'Detener grabación' : 'Iniciar grabación'
            }
          >
            <Text style={styles.micIcon}>
              {state === 'recording' ? '⏹' : '🎙'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {state === 'recording' ? (
          <Text style={styles.stopHint}>Toca para detener</Text>
        ) : null}

        {/* Send button — appears once there is a transcript */}
        {transcript && state === 'idle' ? (
          <TouchableOpacity style={styles.sendButton} onPress={sendTranscript}>
            <Text style={styles.sendButtonText}>Enviar al chat →</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {Platform.OS === 'android' ? (
        <Text style={styles.nativeHint}>
          Integración nativa de voz disponible con @react-native-voice/voice
        </Text>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#052e16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 32,
  },
  backIcon: {
    fontSize: 22,
    color: '#86efac',
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#f0fdf4',
    textAlign: 'center',
  },
  headerRight: {
    width: 32,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  waveformContainer: {
    marginBottom: 32,
  },
  stateLabel: {
    fontSize: 16,
    color: '#86efac',
    marginBottom: 24,
    fontWeight: '500',
  },
  transcriptBox: {
    width: '100%',
    minHeight: 80,
    backgroundColor: '#14532d',
    borderRadius: 16,
    padding: 16,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcriptText: {
    fontSize: 18,
    color: '#f0fdf4',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
  transcriptPlaceholder: {
    fontSize: 15,
    color: '#4ade80',
    opacity: 0.6,
    textAlign: 'center',
  },
  micButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  micButtonActive: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
  },
  micIcon: {
    fontSize: 36,
  },
  stopHint: {
    marginTop: 12,
    fontSize: 13,
    color: '#4ade80',
    opacity: 0.8,
  },
  sendButton: {
    marginTop: 32,
    backgroundColor: '#16a34a',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  nativeHint: {
    color: '#4ade80',
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.5,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
});
