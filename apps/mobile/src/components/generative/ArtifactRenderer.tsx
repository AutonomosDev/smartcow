import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { CloudRain, Sun, Cloud, Thermometer, DollarSign, Coins, CreditCard, Activity } from 'lucide-react-native';

const F = {
  regular: 'DMSans_400Regular',
  medium:  'DMSans_500Medium',
  bold:    'DMSans_600SemiBold',
};

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
      <Animated.View entering={FadeInUp.duration(300)} style={a.wrap}>
        {artifact.title && <View style={a.hdr}><Text style={a.title}>{artifact.title}</Text></View>}
        <View style={a.body}>
          {artifact.rows.map((r, i) => (
            <View key={i} style={[a.row, i < artifact.rows.length - 1 && { marginBottom: 4 }]}>
              <Text style={a.lbl}>{r.label}</Text>
              <Text style={[
                a.val, 
                r.color === 'ok' && { color: '#1e3a2f' }, 
                r.color === 'warn' && { color: '#e74c3c' }, 
                r.color === 'orange' && { color: '#f39c12' }
              ]}>
                {r.value}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>
    );
  }

  if (artifact.type === 'kpi') {
    return (
      <Animated.View entering={FadeInUp.duration(300)} style={a.wrap}>
        {artifact.title && <View style={a.hdr}><Text style={a.title}>{artifact.title}</Text></View>}
        <View style={a.body}>
          <View style={a.kpiRow}>
            {artifact.kpis.map((k, i) => (
              <View key={i} style={a.kpi}>
                <Text style={[a.kpiVal, k.color === 'ok' && { color: '#1e3a2f' }]}>{k.val}</Text>
                <Text style={a.kpiLbl}>{k.lbl}</Text>
              </View>
            ))}
          </View>
          {artifact.rows && artifact.rows.length > 0 && (
            <>
              <View style={a.divider} />
              {artifact.rows.map((r, i) => (
                <View key={i} style={[a.row, i < (artifact.rows?.length ?? 0) - 1 && { marginBottom: 4 }]}>
                  <Text style={a.lbl}>{r.label}</Text>
                  <Text style={[a.val, r.color === 'ok' && { color: '#1e3a2f' }]}>{r.value}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      </Animated.View>
    );
  }

  if (artifact.type === 'alerts') {
    return (
      <Animated.View entering={FadeInUp.duration(300)} style={a.wrap}>
        {artifact.title && <View style={a.hdr}><Text style={a.title}>{artifact.title}</Text></View>}
        <View style={a.body}>
          {artifact.items.map((item, i) => {
            const st = ALERT_STYLES[item.level] || ALERT_STYLES['Info'];
            return (
              <View key={i}>
                {i > 0 && <View style={a.divider} />}
                <View style={[a.alertRow, i < artifact.items.length - 1 && { marginBottom: 6 }]}>
                  <View style={[a.alertBadge, { backgroundColor: st.bg }]}>
                    <Text style={[a.alertBadgeTxt, { color: st.color }]}>{item.level}</Text>
                  </View>
                  <Text style={a.alertTxt}>{item.text}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </Animated.View>
    );
  }

  if (artifact.type === 'weather') {
    const { current_weather } = artifact.data;
    const isRaining = current_weather?.weathercode >= 51;
    return (
      <Animated.View entering={FadeInUp.duration(300)} style={a.wrap}>
        <View style={a.hdrWeather}>
          {isRaining ? <CloudRain color="#fff" size={14} /> : <Sun color="#fff" size={14} />}
          <Text style={a.title}>{artifact.title || 'Clima Predial'}</Text>
        </View>
        <View style={[a.body, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <View>
            <Text style={a.weatherTemp}>{current_weather?.temperature}°</Text>
            <Text style={a.weatherDesc}>Viento: {current_weather?.windspeed} km/h</Text>
          </View>
          <Thermometer color="#1e3a2f" size={32} opacity={0.2} />
        </View>
      </Animated.View>
    );
  }

  if (artifact.type === 'market') {
    const { uf, dolar, euro } = artifact.data;
    return (
      <Animated.View entering={FadeInUp.duration(300)} style={a.wrap}>
        <View style={a.hdrMarket}>
          <DollarSign color="#fff" size={14} />
          <Text style={a.title}>{artifact.title || 'Indicadores Económicos'}</Text>
        </View>
        <View style={a.body}>
          <View style={a.row}><Text style={a.lbl}>Valor UF:</Text><Text style={a.val}>${uf?.toLocaleString('es-CL')}</Text></View>
          <View style={a.divider} />
          <View style={a.row}><Text style={a.lbl}>Dólar (USD):</Text><Text style={a.val}>${dolar?.toLocaleString('es-CL')}</Text></View>
          <View style={a.divider} />
          <View style={a.row}><Text style={a.lbl}>Euro (EUR):</Text><Text style={a.val}>${euro?.toLocaleString('es-CL')}</Text></View>
        </View>
      </Animated.View>
    );
  }

  if (artifact.type === 'animal') {
    const profile = artifact.data;
    return (
      <Animated.View entering={FadeInUp.duration(300)} style={a.wrap}>
        <View style={a.hdrAnimal}>
          <Activity color="#fff" size={14} />
          <Text style={a.title}>{artifact.title || `Ficha: ${profile.diio}`}</Text>
        </View>
        <View style={a.body}>
          <View style={a.row}><Text style={a.lbl}>Raza / Tipo</Text><Text style={a.val}>{profile.raza} · {profile.tipoGanado}</Text></View>
          <View style={a.row}><Text style={a.lbl}>Sexo</Text><Text style={a.val}>{profile.sexo === 'H' ? 'Hembra' : 'Macho'}</Text></View>
          <View style={a.row}><Text style={a.lbl}>Estado</Text><Text style={[a.val, { color: '#1e3a2f' }]}>{profile.estado}</Text></View>
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={a.wrap}>
      <View style={a.hdr}><Text style={a.title}>Datos crudos</Text></View>
      <View style={a.body}>
        <Text style={a.alertTxt}>{JSON.stringify((artifact as any).data)}</Text>
      </View>
    </View>
  );
}

const a = StyleSheet.create({
  wrap:       { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#e8e5df', overflow: 'hidden', marginTop: 5, maxWidth: '92%' },
  hdr:        { backgroundColor: '#1e3a2f', paddingVertical: 7, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  hdrWeather: { backgroundColor: '#3498db', paddingVertical: 7, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  hdrMarket:  { backgroundColor: '#27ae60', paddingVertical: 7, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  hdrAnimal:  { backgroundColor: '#8e44ad', paddingVertical: 7, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  title:      { fontFamily: F.bold, fontSize: 10, color: '#fff' },
  body:       { padding: 10 },
  row:        { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  lbl:        { fontFamily: F.regular, fontSize: 10, color: '#888' },
  val:        { fontFamily: F.bold, fontSize: 10, color: '#1a1a1a' },
  divider:    { height: 0.5, backgroundColor: '#f0ede8', marginVertical: 5 },
  kpiRow:     { flexDirection: 'row', gap: 6, marginBottom: 6 },
  kpi:        { flex: 1, alignItems: 'center' },
  kpiVal:     { fontFamily: F.bold, fontSize: 15, color: '#1a1a1a' },
  kpiLbl:     { fontFamily: F.regular, fontSize: 9, color: '#bbb', marginTop: 1 },
  alertRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  alertBadge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 20, marginTop: 1 },
  alertBadgeTxt: { fontFamily: F.bold, fontSize: 8 },
  alertTxt:   { fontFamily: F.regular, fontSize: 10, color: '#555', flex: 1, lineHeight: 14 },
  weatherTemp:{ fontFamily: F.bold, fontSize: 24, color: '#1a1a1a' },
  weatherDesc:{ fontFamily: F.medium, fontSize: 11, color: '#888' },
});
