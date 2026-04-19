import React, { useState, useRef, useEffect } from 'react';
import ChatBaseScreen, { ChatConfig, Message } from '../intelligence/ChatBaseScreen';
import { mapToolResultToArtifact } from '../../components/generative/artifact-mapper';
import { API_BASE_URL } from '../../lib/config';
import { getStoredToken } from '../../lib/auth';
import { useAuth } from '../../context/AuthContext';

export default function SmartCowChatScreen() {
  const { predioId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = Date.now().toString();
    const aiMsgId   = (Date.now() + 1).toString();

    const userMsg: Message = { id: userMsgId, from: 'user', text, time: now };
    const aiMsg:   Message = { id: aiMsgId,   from: 'ai',   text: '', time: now, isTyping: true };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setIsLoading(true);

    try {
      const token = await getStoredToken();
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/api/chat`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      let processedIndex = 0;
      let finalContent = '';
      let artifacts: ReturnType<typeof mapToolResultToArtifact>[] = [];

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3 || xhr.readyState === 4) {
          const responseText = xhr.responseText;
          if (!responseText) return;

          const newChunk = responseText.substring(processedIndex);
          const lines = newChunk.split('\n');
          const lastNL = responseText.lastIndexOf('\n');
          if (lastNL > processedIndex) processedIndex = lastNL + 1;

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;
            try {
              const event = JSON.parse(jsonStr);
              if (event.type === 'text_delta') {
                finalContent += event.delta;
              } else if (event.type === 'tool_result' && event.tool && event.result) {
                const art = mapToolResultToArtifact({ tool: event.tool, result: event.result });
                if (art) artifacts.push(art);
              }
            } catch {}
          }

          setMessages((prev) => {
            const copy = [...prev];
            const idx = copy.findIndex((m) => m.id === aiMsgId);
            if (idx !== -1) {
              copy[idx] = {
                ...copy[idx],
                text: finalContent || '',
                artifacts: artifacts.filter(Boolean) as any,
                isTyping: xhr.readyState !== 4,
              };
            }
            return copy;
          });

          if (xhr.readyState === 4 && xhr.status !== 200) {
            setMessages((prev) => {
              const copy = [...prev];
              const idx = copy.findIndex((m) => m.id === aiMsgId);
              if (idx !== -1) copy[idx] = { ...copy[idx], text: 'Error al consultar smartCow.', isTyping: false };
              return copy;
            });
          }
        }
      };

      xhr.onerror = () => {
        setIsLoading(false);
        setMessages((prev) => {
          const copy = [...prev];
          const idx = copy.findIndex((m) => m.id === aiMsgId);
          if (idx !== -1) copy[idx] = { ...copy[idx], text: 'Error de red.', isTyping: false };
          return copy;
        });
      };

      xhr.onload = () => setIsLoading(false);

      xhr.send(JSON.stringify({
        messages: [...messages, userMsg].map((m) => ({
          role: m.from === 'ai' ? 'assistant' : 'user',
          content: m.text,
        })),
        predio_id: predioId,
        reasoning_mode: false,
      }));

    } catch {
      setIsLoading(false);
    }
  };

  const config: ChatConfig = {
    avatarSource: require('../../../assets/cow_robot.png'),
    name: 'smartCow AI',
    subtitle: 'Fundo San Pedro · en línea',
    placeholder: isLoading ? 'Conectando...' : 'Preguntá algo a smartCow…',
    dateSep: 'Hoy',
    slashChips: ['/feedlot', '/FT', '/vaquillas', '/partos', '/tratamientos', '/ventas'],
    messages,
    onSend: handleSend,
  };

  return <ChatBaseScreen config={config} />;
}
