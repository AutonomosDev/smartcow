/**
 * AI Prompt Box — multiline text input with send and voice buttons.
 * Expands up to 4 lines; stays above keyboard via parent KAV.
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
    if (!trimmed || disabled) {
      return;
    }
    onSend(trimmed);
    setText('');
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {onVoice ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onVoice}
            disabled={disabled}
            accessibilityLabel="Dictar por voz"
          >
            <Text style={[styles.iconText, disabled && styles.disabledText]}>🎙</Text>
          </TouchableOpacity>
        ) : null}
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Pregunta algo sobre tu campo..."
          placeholderTextColor="#94a3b8"
          multiline
          maxLength={1200}
          returnKeyType="default"
          editable={!disabled}
          onSubmitEditing={Platform.OS === 'ios' ? handleSend : undefined}
        />
        <TouchableOpacity
          style={[styles.sendButton, !text.trim() || disabled ? styles.sendButtonDisabled : null]}
          onPress={handleSend}
          disabled={!text.trim() || disabled}
          accessibilityLabel="Enviar mensaje"
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingLeft: 4,
    paddingRight: 4,
    paddingVertical: 4,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  iconText: {
    fontSize: 18,
  },
  disabledText: {
    opacity: 0.4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxHeight: 96, // ~4 lines
    lineHeight: 22,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1fae5',
  },
  sendIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
});
