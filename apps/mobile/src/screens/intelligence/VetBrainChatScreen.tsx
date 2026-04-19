import React from 'react';
import ChatBaseScreen, { ChatConfig } from './ChatBaseScreen';

const config: ChatConfig = {
  avatarLabel: 'VB',
  name: 'VetBrain',
  subtitle: 'Asistente veterinario · en línea',
  placeholder: 'Consulta clínica, tratamientos...',
  dateSep: 'Hoy · 09:00',
  messages: [
    {
      id: '1',
      from: 'user',
      text: 'AR 078 lleva 3 días con GDP bajo 0.5 y se ve apagada',
      time: '09:00',
    },
    {
      id: '2',
      from: 'ai',
      text: 'Con ese perfil (GDP 0.5, decaimiento) lo más probable es un cuadro respiratorio o parasitario. Revisa temperatura y frecuencia respiratoria.',
      time: '09:01',
      artifacts: [{
        type: 'table',
        title: '🩺 Protocolo diagnóstico — AR 078',
        rows: [
          { label: 'Temperatura',     value: '>39.5°C → viral/bact', color: 'warn' },
          { label: 'Frec. resp.',     value: '>30/min → respiratorio', color: 'warn' },
          { label: 'Heces',           value: 'Líquidas → digestivo', color: 'orange' },
          { label: 'Último desparasit', value: '68 días · vencido', color: 'warn' },
        ],
      }],
    },
    {
      id: '3',
      from: 'user',
      text: 'Temperatura 40.1, respiración normal',
      time: '09:04',
    },
    {
      id: '4',
      from: 'ai',
      text: 'Probable BRD (complejo respiratorio bovino). Recomiendo oxitetraciclina 20 mg/kg IM hoy. Registra en ficha y revisa en 48 hrs.',
      time: '09:05',
    },
  ],
};

export default function VetBrainChatScreen() {
  return <ChatBaseScreen config={config} />;
}
