/**
 * AI Prompt Box — dark input bar estilo 21st.dev/easemize.
 * Input oscuro con micrófono prominente como acción principal.
 * Reference: https://21st.dev/community/components/easemize/ai-prompt-box/default
 */
import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Props {
  onSend: (text: string) => void;
  onVoice?: () => void;
  disabled?: boolean;
}

export function PromptBox({ onSend, onVoice, disabled }: Props) {
  const [text, setText] = useState('');

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {/* Text input */}
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type your message here..."
          placeholderTextColor="#6b7280"
          multiline
          maxLength={1200}
          editable={!disabled}
          onSubmitEditing={Platform.OS === 'ios' ? handleSend : undefined}
        />

        {/* Bottom action row */}
        <View style={styles.actions}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
              <Text style={styles.actionIcon}>📎</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
              <Text style={styles.actionIcon}>🌐</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
              <Text style={styles.actionIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Mic / send button */}
          <TouchableOpacity
            style={[styles.sendBtn, disabled && styles.sendBtnDisabled]}
            onPress={text.trim() ? handleSend : onVoice}
            disabled={disabled}
            accessibilityLabel={text.trim() ? 'Enviar' : 'Dictar por voz'}
          >
            <Text style={styles.sendBtnIcon}>
              {text.trim() ? '↑' : '🎙'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  container: {
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  input: {
    fontSize: 15,
    color: '#f1f5f9',
    minHeight: 44,
    maxHeight: 100,
    lineHeight: 22,
    paddingBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2d2d2f',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  separator: {
    width: 1,
    height: 16,
    backgroundColor: '#3d3d3f',
    marginHorizontal: 2,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: '#374151',
    shadowOpacity: 0,
  },
  sendBtnIcon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
});
