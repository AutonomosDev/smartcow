import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { GiftedChat, IMessage, Bubble, InputToolbar, Send } from 'react-native-gifted-chat';

const F = {
  regular: 'DMSans_400Regular',
  medium:  'DMSans_500Medium',
  bold:    'DMSans_600SemiBold',
};

// ── Tipos ───────────────────────────────────────────────────────────────────

import { GenerativeArtifact, ArtifactRenderer } from '../../components/generative/ArtifactRenderer';

type Message = {
  id: string;
  from: 'user' | 'ai';
  text: string;
  time: string;
  artifacts?: GenerativeArtifact[];
};

export type ChatConfig = {
  avatarLabel: string;
  name: string;
  subtitle: string;
  alertDot?: boolean;
  placeholder: string;
  dateSep: string;
  messages: Message[];
  onSend?: (text: string) => void;
};

// ── Helpers de mapeo ─────────────────────────────────────────────────────────

function toGiftedMessages(messages: Message[]): IMessage[] {
  return messages.map((msg) => ({
    _id: msg.id,
    text: msg.text,
    createdAt: new Date(msg.time),
    user:
      msg.from === 'user'
        ? { _id: 'user' }
        : { _id: 'ai' },
  }));
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function ChatBaseScreen({ config }: { config: ChatConfig }) {
  useNavigation<any>();

  const giftedMessages = useMemo(
    () => toGiftedMessages(config.messages).reverse(),
    [config.messages],
  );

  function handleSend(newMessages: IMessage[]) {
    const text = newMessages[0]?.text;
    if (text && config.onSend) {
      config.onSend(text);
    }
  }

  // Renders artifacts below AI bubbles
  function renderMessageText(props: any) {
    const msgId = props.currentMessage?._id as string | undefined;
    const original = msgId
      ? config.messages.find((m) => m.id === msgId)
      : undefined;

    return (
      <View>
        <Text
          style={
            props.currentMessage?.user?._id === 'user'
              ? s.userTxt
              : s.aiTxt
          }
        >
          {props.currentMessage?.text}
        </Text>
        {original?.artifacts?.map((art, idx) => (
          <ArtifactRenderer key={idx} artifact={art} />
        ))}
      </View>
    );
  }

  function renderBubble(props: any) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: s.userBubble,
          left: s.aiBubble,
        }}
        textStyle={{
          right: s.userTxt,
          left: s.aiTxt,
        }}
        timeTextStyle={{
          right: s.userTime,
          left: s.aiTime,
        }}
        renderMessageText={renderMessageText}
      />
    );
  }

  function renderInputToolbar(props: any) {
    return (
      <InputToolbar
        {...props}
        containerStyle={s.inputBar}
        primaryStyle={s.inputPrimary}
      />
    );
  }

  function renderSend(props: any) {
    return (
      <Send {...props} containerStyle={s.sendBtnWrapper}>
        <View style={s.sendBtn}>
          <View style={s.sendArrow} />
        </View>
      </Send>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View style={s.hdr}>
        <View style={s.hdrRow}>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{config.avatarLabel}</Text>
          </View>
          <View style={s.hdrText}>
            <Text style={s.hdrName}>{config.name}</Text>
            <Text style={s.hdrSub}>{config.subtitle}</Text>
          </View>
          <View style={[s.dot, config.alertDot && s.dotAlert]} />
        </View>
      </View>

      {/* ── GiftedChat ── */}
      <GiftedChat
        messages={giftedMessages}
        onSend={handleSend}
        user={{ _id: 'user' }}
        textInputProps={{ placeholder: config.placeholder, placeholderTextColor: '#aaa' }}
        isSendButtonAlwaysVisible
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderSend={renderSend}
        renderAvatar={null}
        isUsernameVisible={false}
        renderDay={() => (
          <Text style={s.dateSep}>{config.dateSep}</Text>
        )}
        messagesContainerStyle={s.msgsContainer}
      />
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f1' },

  hdr: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ebe9e3',
    backgroundColor: '#f8f6f1',
  },
  hdrRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar:    { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1e3a2f', justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontFamily: F.bold, fontSize: 11, color: '#7ecfa0' },
  hdrText:   { flex: 1 },
  hdrName:   { fontFamily: F.bold, fontSize: 13, color: '#1a1a1a' },
  hdrSub:    { fontFamily: F.medium, fontSize: 9, color: '#1e3a2f' },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1e3a2f' },
  dotAlert:  { backgroundColor: '#e74c3c', width: 8, height: 8, borderRadius: 4 },

  msgsContainer: { backgroundColor: '#f8f6f1' },
  dateSep:       { fontFamily: F.regular, fontSize: 9, color: '#bbb', textAlign: 'center', marginVertical: 4 },

  // Burbujas
  userBubble: { backgroundColor: '#1e3a2f', borderRadius: 16, borderBottomRightRadius: 4 },
  aiBubble:   { backgroundColor: '#ffffff', borderRadius: 16, borderBottomLeftRadius: 4, borderWidth: 0.5, borderColor: '#e8e5df' },
  userTxt:    { fontFamily: F.regular, fontSize: 11, color: '#fff', lineHeight: 15 },
  aiTxt:      { fontFamily: F.regular, fontSize: 11, color: '#1a1a1a', lineHeight: 15 },
  userTime:   { fontFamily: F.regular, fontSize: 8, color: 'rgba(255,255,255,0.4)' },
  aiTime:     { fontFamily: F.regular, fontSize: 8, color: '#bbb' },

  // Input bar
  inputBar:      { backgroundColor: '#f8f6f1', borderTopWidth: 0.5, borderTopColor: '#ebe9e3' },
  inputPrimary:  { alignItems: 'center' },
  sendBtnWrapper:{ justifyContent: 'center', paddingRight: 6 },
  sendBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1e3a2f', justifyContent: 'center', alignItems: 'center' },
  sendArrow:     { width: 0, height: 0, borderLeftWidth: 9, borderLeftColor: '#fff', borderTopWidth: 5, borderTopColor: 'transparent', borderBottomWidth: 5, borderBottomColor: 'transparent', marginLeft: 2 },
});
