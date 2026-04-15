/**
 * ChatScreen — full AI conversation view.
 * FlatList messages | StreamingIndicator | AgentPlan | PromptBox
 * KeyboardAvoidingView keeps the input above the keyboard.
 */
import React, { useEffect, useRef } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MessageBubble } from '../components/MessageBubble';
import { StreamingIndicator } from '../components/StreamingIndicator';
import { AgentPlan } from '../components/AgentPlan';
import { PromptBox } from '../components/PromptBox';
import { useMessages } from '../hooks/useMessages';
import { RootStackParamList, ChatMessage } from '../types';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;
type RoutePropType = RouteProp<RootStackParamList, 'Chat'>;

interface Props {
  navigation: NavProp;
  route: RoutePropType;
}

export function ChatScreen({ navigation, route }: Props) {
  const { messages, loading, agentActions, handleSend } = useMessages();
  const flatRef = useRef<FlatList<ChatMessage>>(null);
  const initialMessageSent = useRef(false);

  // Send initial quick-action message once
  useEffect(() => {
    const initial = route.params?.initialMessage;
    if (initial && !initialMessageSent.current) {
      initialMessageSent.current = true;
      handleSend(initial);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatRef.current?.scrollToEnd({ animated: true });
      }, 80);
    }
  }, [messages.length, loading]);

  const agentActionsMapped = (agentActions ?? []).map(a => ({
    label: a.label,
    status: 'done' as const,
    detail: a.detail,
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Volver"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.orbDot} />
        <Text style={styles.headerTitle}>SmartCow IA</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Escribe o dicta para empezar una conversación con el asistente ganadero.
              </Text>
            </View>
          }
          ListFooterComponent={loading ? <StreamingIndicator /> : null}
        />

        {/* Agent plan */}
        <AgentPlan
          actions={agentActionsMapped}
          visible={agentActionsMapped.length > 0 && !loading}
        />

        {/* Input */}
        <PromptBox
          onSend={handleSend}
          onVoice={() => navigation.navigate('Voice')}
          disabled={loading}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    paddingRight: 12,
  },
  backIcon: {
    fontSize: 22,
    color: '#16a34a',
    fontWeight: '600',
  },
  orbDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16a34a',
    marginRight: 8,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  kav: {
    flex: 1,
  },
  list: {
    paddingVertical: 12,
  },
  emptyState: {
    paddingHorizontal: 32,
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
  },
});
