import React from 'react';
import ChatBaseScreen, { ChatConfig } from './ChatBaseScreen';

const config: ChatConfig = {
  avatarLabel: 'SC',
  name: 'SmartCow AI',
  subtitle: 'Fundo San Pedro · en línea',
  alertDot: false,
  placeholder: 'Escribe a SmartCow...',
  dateSep: 'Hoy · 08:14',
  messages: [
    {
      id: '1',
      from: 'user',
      text: '¿Cómo van los lotes esta semana?',
      time: '08:14',
    },
    {
      id: '2',
      from: 'ai',
      text: 'Resumen de tus 4 lotes. Lote Central preocupa — GDP cayó esta semana.',
      time: '08:14',
      artifact: {
        type: 'table',
        title: '📊 GDP por lote — semana actual',
        rows: [
          { label: 'Lote Norte',   value: '1.8 kg/d ↑', color: 'ok' },
          { label: 'Lote Sur',     value: '1.5 kg/d →', color: 'ok' },
          { label: 'Lote Central', value: '0.8 kg/d ↓', color: 'warn' },
          { label: 'Wagyu',        value: '1.2 kg/d →', color: 'orange' },
        ],
      },
    },
    {
      id: '3',
      from: 'user',
      text: '¿Qué pasó en Lote Central?',
      time: '08:15',
    },
    {
      id: '4',
      from: 'ai',
      text: 'Bebedero vacío 2 días + cambio de receta el lunes. GDP cayó de 1.6 a 0.8. Sugiero volver a receta anterior.',
      time: '08:15',
    },
  ],
};

export default function SmartCowChatScreen() {
  return <ChatBaseScreen config={config} />;
}
