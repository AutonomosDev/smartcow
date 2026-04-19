import React, { useState, useRef, useEffect } from 'react';
import ChatBaseScreen, { ChatConfig } from './ChatBaseScreen';
import { mapToolResultToArtifact } from '../../components/generative/artifact-mapper';
import { API_BASE_URL, DEFAULT_PREDIO_ID } from '../../lib/config';
import { getStoredToken, getStoredUser } from '../../lib/auth';

export default function SmartCowChatScreen() {
  const [messages, setMessages] = useState<ChatConfig['messages']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [predioId, setPredioId] = useState<number>(DEFAULT_PREDIO_ID);

  useEffect(() => {
    getStoredUser().then((user) => {
      if (user?.predios?.length) {
        setPredioId(user.predios[0]);
      }
    });
  }, []);

  const conversationId = useRef<number | null>(null);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsgId = Date.now().toString();
    const userMessage = {
      id: userMsgId,
      from: 'user' as const,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const aiMsgId = (Date.now() + 1).toString();
    const aiMessageTemplate = {
      id: aiMsgId,
      from: 'ai' as const,
      text: 'Procesando...',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, aiMessageTemplate]);

    try {
      const token = await getStoredToken();
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/api/chat`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      let processedIndex = 0;
      let finalContent = '';
      let artifacts: any[] = [];

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3 || xhr.readyState === 4) {
          const responseText = xhr.responseText;
          if (!responseText) return;

          // Parsear solo el segmento nuevo completo (en base a \n\n o \n)
          // Dado que podemos recibir fragmentos cortados, un buffer más seguro:
          const newChunk = responseText.substring(processedIndex);
          const lines = newChunk.split('\n');
          
          // Actualizar processedIndex ANTES de procesar para no reprocesar
          const lastNewline = responseText.lastIndexOf('\n');
          if (lastNewline > processedIndex) {
            processedIndex = lastNewline + 1;
          }

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);
              if (event.type === 'text_delta') {
                finalContent += event.delta;
              } else if (event.type === 'tool_result' && event.tool && event.result) {
                const artifact = mapToolResultToArtifact({ tool: event.tool, result: event.result });
                if (artifact) {
                  artifacts.push(artifact);
                }
              }
            } catch (e) {
              // skip fragmentos JSON incompletos
            }
          }
          setMessages((prev) => {
            const copy = [...prev];
            const lastIdx = copy.length - 1;
            if (copy[lastIdx].from === 'ai' && copy[lastIdx].id === aiMsgId) {
              copy[lastIdx] = {
                ...copy[lastIdx],
                text: finalContent || 'Procesando...',
                artifacts: [...artifacts],
              };
            }
            return copy;
          });
        }
        
        if (xhr.readyState === 4) {
          setIsLoading(false);
          if (xhr.status !== 200) {
            setMessages((prev) => {
              const copy = [...prev];
              const lastIdx = copy.length - 1;
              if (copy[lastIdx].id === aiMsgId) {
                copy[lastIdx].text = 'Ups, ocurrió un error de conexión al consultar a SmartCow.';
              }
              return copy;
            });
          }
        }
      };

      xhr.onerror = () => {
        setIsLoading(false);
        setMessages((prev) => {
          const copy = [...prev];
          const lastIdx = copy.length - 1;
          if (copy[lastIdx].id === aiMsgId) {
            copy[lastIdx].text = 'Ups, ocurrió un error de red al consultar a SmartCow.';
          }
          return copy;
        });
      };

      xhr.send(JSON.stringify({
        messages: [...messages, userMessage].map((m) => ({
          role: m.from === 'ai' ? 'assistant' : 'user',
          content: m.text,
        })),
        predio_id: predioId,
        reasoning_mode: false,
      }));

    } catch (err) {
      setIsLoading(false);
    }
  };

  const config: ChatConfig = {
    avatarSource: require('../../../assets/cow_robot.png'),
    name: 'SmartCow AI',
    subtitle: 'Fundo San Pedro · en línea',
    placeholder: isLoading ? 'Conectando...' : 'Preguntá algo a SmartCow…',
    dateSep: 'Hoy',
    slashChips: ['/feedlot', '/FT', '/vaquillas', '/partos', '/tratamientos', '/ventas'],
    messages,
    onSend: handleSend,
  };

  return <ChatBaseScreen config={config} />;
}
