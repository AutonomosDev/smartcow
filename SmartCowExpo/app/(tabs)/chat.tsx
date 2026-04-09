/**
 * app/(tabs)/chat.tsx — Chat IA con streaming SSE
 * Reutiliza el mismo endpoint /api/chat del backend Next.js
 */

import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Send } from "lucide-react-native";
import { Colors } from "@/constants/colors";
import { getToken, getStoredUser } from "@/src/lib/auth-client";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [fundoId, setFundoId] = useState(0);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    getStoredUser().then((u) => {
      if (u?.fundos[0]) setFundoId(u.fundos[0]);
    });
  }, []);

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          fundoId,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Error en el servidor");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as { text?: string };
              if (parsed.text) {
                accumulated += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, content: accumulated }
                      : m
                  )
                );
              }
            } catch {
              // línea SSE no JSON, ignorar
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, streaming: false } : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                content: "Error al conectar con el servidor.",
                streaming: false,
              }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  }

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.messageRowUser : styles.messageRowAssistant,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAssistant,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
            ]}
          >
            {item.content}
          </Text>
          {item.streaming && item.content.length === 0 && (
            <ActivityIndicator size="small" color={Colors.ink.meta} />
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SmartCow IA</Text>
        {fundoId > 0 && (
          <Text style={styles.headerSub}>Fundo #{fundoId}</Text>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Hola, soy SmartCow IA.{"\n"}¿En qué puedo ayudarte hoy?
            </Text>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Pregunta sobre tus lotes..."
            placeholderTextColor={Colors.ink.meta}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || streaming) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || streaming}
            activeOpacity={0.8}
          >
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.farm.base,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#111111",
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#e5e5e5",
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#666",
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  messageRow: {
    marginBottom: 12,
  },
  messageRowUser: {
    alignItems: "flex-end",
  },
  messageRowAssistant: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: Colors.brand.dark,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: Colors.farm.surface,
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: "#fff",
    fontFamily: "Inter_400Regular",
  },
  bubbleTextAssistant: {
    color: Colors.ink.title,
    fontFamily: "Inter_400Regular",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.ink.meta,
    textAlign: "center",
    lineHeight: 24,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.farm.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.ink.meta + "20",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.farm.base,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.ink.title,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
