import React from 'react';
import { motion } from 'framer-motion';
import { CloudRain, Sun, Thermometer, DollarSign, Activity } from 'lucide-react';

export type ArtifactRow = { label: string; value: string; color?: 'ok' | 'warn' | 'orange' };
export type KpiItem     = { val: string; lbl: string; color?: 'ok' };
export type AlertItem   = { level: 'Urgente' | 'Atención' | 'Info'; text: string };

export type GenerativeArtifact =
  | { type: 'table';   title?: string; rows: ArtifactRow[] }
  | { type: 'kpi';     title?: string; kpis: KpiItem[]; rows?: ArtifactRow[] }
  | { type: 'alerts';  title?: string; items: AlertItem[] }
  | { type: 'weather'; title?: string; data: any }
  | { type: 'market';  title?: string; data: any }
  | { type: 'animal';  title?: string; data: any };

const ALERT_STYLES: Record<string, { bg: string; color: string }> = {
  Urgente:  { bg: '#fde8e8', color: '#c0392b' },
  Atención: { bg: '#fdf0e6', color: '#9b5e1a' },
  Info:     { bg: '#e6f0f8', color: '#1a5276' },
};

export function ArtifactRenderer({ artifact }: { artifact: GenerativeArtifact }) {
  if (artifact.type === 'table') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[92%] mt-3 bg-white rounded-xl border border-[#e8e5df] overflow-hidden"
      >
        {artifact.title && (
          <div className="bg-[#1e3a2f] py-2 px-3">
            <span className="text-white text-[11px] font-bold tracking-wide">{artifact.title}</span>
          </div>
        )}
        <div className="p-3">
          {artifact.rows.map((r, i) => (
            <div key={i} className={`flex justify-between items-center ${i < artifact.rows.length - 1 ? 'mb-2' : ''}`}>
              <span className="text-[#888] text-[11px] font-medium">{r.label}</span>
              <span className={`text-[11px] font-bold ${
                r.color === 'ok' ? 'text-[#1e3a2f]' : 
                r.color === 'warn' ? 'text-[#e74c3c]' : 
                r.color === 'orange' ? 'text-[#f39c12]' : 
                'text-[#1a1a1a]'
              }`}>
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (artifact.type === 'kpi') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[92%] mt-3 bg-white rounded-xl border border-[#e8e5df] overflow-hidden"
      >
        {artifact.title && (
          <div className="bg-[#1e3a2f] py-2 px-3">
            <span className="text-white text-[11px] font-bold tracking-wide">{artifact.title}</span>
          </div>
        )}
        <div className="p-3">
          <div className="flex gap-2 mb-3">
            {artifact.kpis.map((k, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <span className={`text-[16px] font-bold ${k.color === 'ok' ? 'text-[#1e3a2f]' : 'text-[#1a1a1a]'}`}>
                  {k.val}
                </span>
                <span className="text-[#bbb] text-[10px] mt-0.5">{k.lbl}</span>
              </div>
            ))}
          </div>
          {artifact.rows && artifact.rows.length > 0 && (
            <>
              <div className="h-[1px] bg-[#f0ede8] my-2" />
              {artifact.rows.map((r, i) => (
                <div key={i} className={`flex justify-between items-center ${i < artifact.rows!.length - 1 ? 'mb-2' : ''}`}>
                  <span className="text-[#888] text-[11px] font-medium">{r.label}</span>
                  <span className={`text-[11px] font-bold ${r.color === 'ok' ? 'text-[#1e3a2f]' : 'text-[#1a1a1a]'}`}>
                    {r.value}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </motion.div>
    );
  }

  if (artifact.type === 'alerts') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[92%] mt-3 bg-white rounded-xl border border-[#e8e5df] overflow-hidden"
      >
        {artifact.title && (
          <div className="bg-[#1e3a2f] py-2 px-3">
            <span className="text-white text-[11px] font-bold tracking-wide">{artifact.title}</span>
          </div>
        )}
        <div className="p-3">
          {artifact.items.map((item, i) => {
            const st = ALERT_STYLES[item.level] || ALERT_STYLES['Info'];
            return (
              <div key={i}>
                {i > 0 && <div className="h-[1px] bg-[#f0ede8] my-2" />}
                <div className="flex items-start gap-2">
                  <div className="px-2 py-0.5 rounded-full mt-0.5" style={{ backgroundColor: st.bg }}>
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: st.color }}>
                      {item.level}
                    </span>
                  </div>
                  <span className="text-[#555] text-[11px] flex-1 leading-snug">{item.text}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  if (artifact.type === 'weather') {
    const { current_weather } = artifact.data;
    const isRaining = current_weather?.weathercode >= 51;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[92%] mt-3 bg-white rounded-xl border border-[#e8e5df] overflow-hidden"
      >
        <div className="bg-[#3498db] py-2 px-3 flex items-center gap-2">
          {isRaining ? <CloudRain color="#fff" size={14} /> : <Sun color="#fff" size={14} />}
          <span className="text-white text-[11px] font-bold tracking-wide">{artifact.title || 'Clima Predial'}</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[#1a1a1a] text-2xl font-bold">{current_weather?.temperature}°</span>
            <span className="text-[#888] text-[12px] font-medium mt-1">Viento: {current_weather?.windspeed} km/h</span>
          </div>
          <Thermometer color="#1e3a2f" size={36} opacity={0.2} />
        </div>
      </motion.div>
    );
  }

  if (artifact.type === 'market') {
    const { uf, dolar, euro } = artifact.data;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[92%] mt-3 bg-white rounded-xl border border-[#e8e5df] overflow-hidden"
      >
        <div className="bg-[#27ae60] py-2 px-3 flex items-center gap-2">
          <DollarSign color="#fff" size={14} />
          <span className="text-white text-[11px] font-bold tracking-wide">{artifact.title || 'Indicadores Económicos'}</span>
        </div>
        <div className="p-3">
          <div className="flex justify-between items-center mb-1.5 mt-0.5">
            <span className="text-[#888] text-[11px] font-medium">Valor UF:</span>
            <span className="text-[#1a1a1a] text-[11px] font-bold">${uf?.toLocaleString('es-CL')}</span>
          </div>
          <div className="h-[1px] bg-[#f0ede8] my-2" />
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[#888] text-[11px] font-medium">Dólar (USD):</span>
            <span className="text-[#1a1a1a] text-[11px] font-bold">${dolar?.toLocaleString('es-CL')}</span>
          </div>
          <div className="h-[1px] bg-[#f0ede8] my-2" />
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[#888] text-[11px] font-medium">Euro (EUR):</span>
            <span className="text-[#1a1a1a] text-[11px] font-bold">${euro?.toLocaleString('es-CL')}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (artifact.type === 'animal') {
    const profile = artifact.data;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[92%] mt-3 bg-white rounded-xl border border-[#e8e5df] overflow-hidden"
      >
        <div className="bg-[#8e44ad] py-2 px-3 flex items-center gap-2">
          <Activity color="#fff" size={14} />
          <span className="text-white text-[11px] font-bold tracking-wide">{artifact.title || `Ficha: ${profile.diio}`}</span>
        </div>
        <div className="p-3">
          <div className="flex justify-between items-center mb-1.5 mt-0.5">
            <span className="text-[#888] text-[11px] font-medium">Raza / Tipo</span>
            <span className="text-[#1a1a1a] text-[11px] font-bold">{profile.raza} · {profile.tipoGanado}</span>
          </div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[#888] text-[11px] font-medium">Sexo</span>
            <span className="text-[#1a1a1a] text-[11px] font-bold">{profile.sexo === 'H' ? 'Hembra' : 'Macho'}</span>
          </div>
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[#888] text-[11px] font-medium">Estado</span>
            <span className="text-[#1e3a2f] text-[11px] font-bold">{profile.estado}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-[92%] mt-3 bg-white rounded-xl border border-[#e8e5df] overflow-hidden">
      <div className="bg-[#1e3a2f] py-2 px-3">
        <span className="text-white text-[11px] font-bold tracking-wide">Datos crudos</span>
      </div>
      <div className="p-3">
        <span className="text-[10px] text-[#555] font-mono break-words">{JSON.stringify(artifact.data)}</span>
      </div>
    </div>
  );
}
