import React from 'react';
import ChatBaseScreen, { ChatConfig } from './ChatBaseScreen';

const config: ChatConfig = {
  avatarLabel: 'SC',
  name: 'SmartCow AI',
  subtitle: 'Fundo San Pedro · 3 alertas',
  placeholder: 'Escribe a SmartCow...',
  dateSep: 'Hoy · 07:00 — Resumen matutino',
  messages: [
    {
      id: '1',
      from: 'ai',
      text: 'Buenos días JP. 3 cosas que necesitan tu atención:',
      time: '07:00',
      artifacts: [{
        type: 'alerts',
        title: '🚨 Alertas del día — 14 abr',
        items: [
          { level: 'Urgente',  text: 'Bebedero Corral 3 vacío 13 hrs. 38 animales.' },
          { level: 'Atención', text: 'Stock concentrado: 3 días restantes.' },
          { level: 'Info',     text: 'MUE-00847: negativo Brucelosis. OK.' },
        ],
      }],
    },
    {
      id: '2',
      from: 'user',
      text: 'Manda a Jaime al bebedero ahora',
      time: '07:03',
    },
    {
      id: '3',
      from: 'ai',
      text: 'Tarea creada para Jaime: "Revisar bebedero Corral 3 — urgente". Notificado ahora. ¿Ordeno el concentrado también?',
      time: '07:03',
    },
  ],
};

export default function OwnBrainChatScreen() {
  return <ChatBaseScreen config={config} />;
}
