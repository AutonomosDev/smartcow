import React from 'react';
import ChatBaseScreen, { ChatConfig } from './ChatBaseScreen';

const config: ChatConfig = {
  avatarLabel: 'AB',
  name: 'AgroBrain',
  subtitle: 'Nutrición y recetas TMR · en línea',
  alertDot: false,
  placeholder: 'Consulta de nutrición, recetas...',
  dateSep: 'Hoy · 10:15',
  messages: [
    {
      id: '1',
      from: 'user',
      text: 'El silaje de maíz subió 18%. ¿Cómo ajusto la receta?',
      time: '10:15',
    },
    {
      id: '2',
      from: 'ai',
      text: 'Con ese aumento puedo sustituir parcialmente por heno de avena sin bajar MS. Te propongo un ajuste que mantiene el costo en rango.',
      time: '10:16',
      artifact: {
        type: 'kpi',
        title: '🌾 Receta ajustada — Engorda Angus V2',
        kpis: [
          { val: '$1.82', lbl: 'Costo/kg',   color: 'ok' },
          { val: '63%',   lbl: 'MS objetivo' },
          { val: '-4%',   lbl: 'Silaje', color: 'ok' },
        ],
        rows: [
          { label: 'Silaje maíz',  value: '42% → 38%', color: 'ok' },
          { label: 'Heno avena',   value: '8% → 12%',  color: 'ok' },
          { label: 'Concentrado', value: 'sin cambio' },
        ],
      },
    },
    {
      id: '3',
      from: 'user',
      text: 'Aplica el cambio a todos los corrales Angus',
      time: '10:18',
    },
    {
      id: '4',
      from: 'ai',
      text: 'Receta Engorda Angus V2 actualizada y aplicada a Corrales 1, 2 y 4 (110 animales). El batch de mañana ya usa la nueva fórmula.',
      time: '10:18',
    },
  ],
};

export default function AgroBrainChatScreen() {
  return <ChatBaseScreen config={config} />;
}
