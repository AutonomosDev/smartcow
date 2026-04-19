import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const C = {
  ink1:   '#1a1a1a',
  ink2:   '#666',
  ink3:   '#999',
  ink4:   '#bbb',
  ink5:   '#e0ddd8',
  blueFg: '#1a5276',
  green:  '#1e3a2f',
  leaf:   '#4a7a5e',
  warn:   '#c77a1a',
  warnBg: '#fdf0e6',
  okBg:   '#e6f3ec',
  infoBg: '#eaf0f7',
  rowBd:  '#ececec',
  blockBd: '#ede9e0',
  blockBg: '#fbfaf6',
};

const F = {
  regular: 'DMSans_400Regular',
  medium:  'DMSans_500Medium',
  bold:    'DMSans_600SemiBold',
  mono:    'JetBrainsMono_400Regular',
  monoMd:  'JetBrainsMono_500Medium',
};

type Row = { cells: (string | React.ReactNode)[]; bold?: boolean };

function Tag({ kind, children }: { kind: 'ok' | 'warn' | 'info'; children: string }) {
  const map = {
    ok:   { bg: C.okBg,   fg: C.green  },
    warn: { bg: C.warnBg, fg: C.warn   },
    info: { bg: C.infoBg, fg: C.blueFg },
  } as const;
  const c = map[kind];
  return (
    <View style={[g.tag, { backgroundColor: c.bg }]}>
      <Text style={[g.tagTxt, { color: c.fg }]}>{children}</Text>
    </View>
  );
}

function Block({ title, src, children }: { title: string; src: string; children: React.ReactNode }) {
  return (
    <View style={g.block}>
      <View style={g.blockHd}>
        <Text style={g.blockTitle}>{title}</Text>
        <Text style={g.blockSrc}>{src}</Text>
      </View>
      {children}
    </View>
  );
}

function Table({ header, rows, widths }: { header: string[]; rows: Row[]; widths: number[] }) {
  return (
    <View>
      <View style={[g.tr, g.thead]}>
        {header.map((h, i) => (
          <Text key={i} style={[g.th, { flex: widths[i] }, i > 0 && i < header.length - 1 ? g.numCol : null]} numberOfLines={1}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((r, ri) => (
        <View key={ri} style={[g.tr, ri === rows.length - 1 ? null : g.trBd]}>
          {r.cells.map((cell, i) => {
            const isNum = i > 0 && i < r.cells.length - 1;
            const style = [
              g.td,
              { flex: widths[i] },
              isNum ? g.numCol : null,
              r.bold ? g.tdBold : null,
            ];
            if (typeof cell === 'string') {
              return <Text key={i} style={style} numberOfLines={1}>{cell}</Text>;
            }
            return (
              <View key={i} style={[{ flex: widths[i] }, { flexDirection: 'row', alignItems: 'center' }]}>
                {cell}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function BarRow({ lbl, pct, val, color }: { lbl: string; pct: number; val: string; color: string }) {
  return (
    <View style={g.barRow}>
      <Text style={g.barLbl}>{lbl}</Text>
      <View style={g.barTrack}>
        <View style={[g.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={g.barVal}>{val}</Text>
    </View>
  );
}

export default function InformeMock() {
  return (
    <View>
      <Text style={g.h1}>Informe pesajes vaquillas FT — Los Aromos · abr 2026</Text>
      <Text style={g.lead}>
        4° pesaje del ciclo · <Text style={g.bold}>523 vaquillas</Text> · GDP fundo{' '}
        <Text style={g.bold}>1.14 kg/d</Text> (target 1.20). Tres lotes en rango, FT-3 en adaptación.
      </Text>

      <Block title="GDP por lote · pesaje 09-04-2026" src="Target 1.20 · n=523">
        <Table
          widths={[1.1, 1.1, 1.2, 1.1, 1.2, 1.3]}
          header={['Lote', 'Anim.', 'Peso', 'GDP', 'Δ tgt', 'Estado']}
          rows={[
            { cells: ['FT-1', '142', '318', '1.28', '+80 g', <Tag kind="ok">sobre</Tag>] },
            { cells: ['FT-2', '138', '302', '1.21', '+10 g', <Tag kind="ok">ok</Tag>] },
            { cells: ['FT-3', '127', '276', '0.94', '−260', <Tag kind="warn">bajo</Tag>] },
            { cells: ['FT-4', '116', '294', '1.15', '−50 g', <Tag kind="info">cerca</Tag>] },
            { cells: ['Fundo', '523', '298', '1.14', '−60 g', <Tag kind="info">prom</Tag>], bold: true },
          ]}
        />
      </Block>

      <Block title="GDP por lote · barras" src="kg/d · target 1.20">
        <View style={{ gap: 5 }}>
          <BarRow lbl="FT-1"   pct={100}  val="1.28" color={C.green} />
          <BarRow lbl="FT-2"   pct={94.5} val="1.21" color={C.leaf}  />
          <BarRow lbl="Target" pct={93.8} val="1.20" color={C.blueFg}/>
          <BarRow lbl="Fundo"  pct={89.1} val="1.14" color={C.blueFg}/>
          <BarRow lbl="FT-4"   pct={89.8} val="1.15" color={C.blueFg}/>
          <BarRow lbl="FT-3"   pct={73.4} val="0.94" color={C.warn}  />
        </View>
        <View style={g.legend}>
          <View style={g.legendItem}><View style={[g.legendDot, { backgroundColor: C.green  }]} /><Text style={g.legendTxt}>Sobre</Text></View>
          <View style={g.legendItem}><View style={[g.legendDot, { backgroundColor: C.leaf   }]} /><Text style={g.legendTxt}>En target</Text></View>
          <View style={g.legendItem}><View style={[g.legendDot, { backgroundColor: C.blueFg }]} /><Text style={g.legendTxt}>Cerca</Text></View>
          <View style={g.legendItem}><View style={[g.legendDot, { backgroundColor: C.warn   }]} /><Text style={g.legendTxt}>Bajo</Text></View>
        </View>
      </Block>

      <Block title="FT-3 · recuperación GDP" src="n=127 · ene–abr 2026">
        <View style={g.spark}>
          <View style={[g.sparkBar, { height: '15%', backgroundColor: C.warn }]} />
          <View style={[g.sparkBar, { height: '45%', backgroundColor: C.warn }]} />
          <View style={[g.sparkBar, { height: '78%', backgroundColor: C.leaf }]} />
          <View style={[g.sparkBar, { height: '96%', backgroundColor: C.green }]} />
        </View>
        <View style={g.sparkAxis}>
          <Text style={g.sparkAxisTxt}>ENE 0.00</Text>
          <Text style={g.sparkAxisTxt}>FEB 0.18</Text>
          <Text style={g.sparkAxisTxt}>MAR 0.54</Text>
          <Text style={g.sparkAxisTxt}>ABR 0.94</Text>
        </View>
      </Block>

      <Text style={g.h2}>Proyección salida Loncoche</Text>
      <Text style={g.p}>A ritmo actual, con target 360 kg:</Text>

      <Block title="ETA salida · 4 lotes feedlot" src="Target 360 kg">
        <Table
          widths={[1.0, 1.1, 1.0, 1.0, 1.4, 1.5]}
          header={['Lote', 'Hoy', 'Falta', 'Días', 'ETA', 'Estado']}
          rows={[
            { cells: ['FT-1', '318', '42',  '32',   '10 may', <Tag kind="ok">1er</Tag>] },
            { cells: ['FT-2', '302', '58',  '46',   '24 may', <Tag kind="ok">conf</Tag>] },
            { cells: ['FT-4', '294', '66',  '57',   '04 jun', <Tag kind="info">conf</Tag>] },
            { cells: ['FT-3', '276', '84',  '~92*', '~10 jul', <Tag kind="warn">si 1.15</Tag>] },
          ]}
        />
      </Block>

      <Text style={g.pSmall}>* FT-3 asume recuperación a 1.15 kg/d desde próximo pesaje. Si sigue en 0.94, suma +30 días.</Text>

      <Text style={g.h2}>Requiere decisión</Text>
      <Text style={g.p}>
        <Text style={g.bold}>FT-3: </Text>
        esperar 30 días al próximo pesaje antes de ajustar, o cambiar ya la ración concentrado +0.5 kg/d por cabeza. Raciones actuales en el feedlot están homologadas por los 4 lotes; subir sólo al FT-3 implica separar silos.
      </Text>
      <Text style={g.p}>
        <Text style={g.bold}>FT-1: </Text>
        confirmar disponibilidad de camiones Loncoche para primera semana de mayo.
      </Text>

      <Text style={g.h2sm}>Fuentes</Text>
      <Text style={g.pSmall}>Pesajes balanza Tru-Test · Planilla campo Raúl 09-04-2026 · Histórico pesajes 4 meses.</Text>
    </View>
  );
}

const g = StyleSheet.create({
  h1:     { fontFamily: F.bold, fontSize: 20, color: C.ink1, letterSpacing: -0.3, marginBottom: 8, lineHeight: 25 },
  lead:   { fontFamily: F.regular, fontSize: 13.5, color: C.blueFg, lineHeight: 20, marginBottom: 14 },
  h2:     { fontFamily: F.bold, fontSize: 14, color: C.ink1, marginTop: 18, marginBottom: 6 },
  h2sm:   { fontFamily: F.bold, fontSize: 11, color: C.ink2, marginTop: 18, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  p:      { fontFamily: F.regular, fontSize: 13, color: C.blueFg, lineHeight: 20, marginBottom: 6 },
  pSmall: { fontFamily: F.regular, fontSize: 11.5, color: C.ink2, lineHeight: 17, marginTop: 2, marginBottom: 2 },
  bold:   { fontFamily: F.bold },

  block: {
    marginVertical: 8,
    backgroundColor: C.blockBg,
    borderWidth: 1, borderColor: C.blockBd, borderRadius: 8,
    padding: 10,
  },
  blockHd: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8, paddingBottom: 6,
    borderBottomWidth: 0.5, borderBottomColor: C.ink5,
  },
  blockTitle: { fontFamily: F.medium, fontSize: 11, color: C.ink1, textTransform: 'uppercase', letterSpacing: 0.4, flex: 1 },
  blockSrc:   { fontFamily: F.mono,   fontSize: 9.5, color: C.ink3 },

  // Table
  thead:   { paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.ink5 },
  tr:      { flexDirection: 'row', paddingVertical: 7, alignItems: 'center' },
  trBd:    { borderBottomWidth: 0.5, borderBottomColor: C.rowBd },
  th:      { fontFamily: F.bold,    fontSize: 10, color: C.ink2, textTransform: 'uppercase', letterSpacing: 0.3 },
  td:      { fontFamily: F.regular, fontSize: 11.5, color: C.ink1 },
  tdBold:  { fontFamily: F.bold },
  numCol:  { textAlign: 'right', paddingHorizontal: 2 },

  // Tag
  tag:     { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3 },
  tagTxt:  { fontFamily: F.medium, fontSize: 9.5, letterSpacing: 0.2 },

  // Bars
  barRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLbl:   { fontFamily: F.monoMd, fontSize: 10, color: C.ink1, width: 42 },
  barTrack: { flex: 1, height: 14, backgroundColor: '#f0ede6', borderRadius: 3, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 3 },
  barVal:   { fontFamily: F.monoMd, fontSize: 10, color: C.ink1, width: 32, textAlign: 'right' },

  // Legend
  legend:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: C.ink5 },
  legendItem:{ flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:{ width: 8, height: 8, borderRadius: 2 },
  legendTxt:{ fontFamily: F.mono, fontSize: 9.5, color: C.ink2 },

  // Spark
  spark:    { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 90, paddingHorizontal: 12 },
  sparkBar: { width: 32, borderRadius: 2 },
  sparkAxis:{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 6, paddingHorizontal: 4 },
  sparkAxisTxt:{ fontFamily: F.mono, fontSize: 9, color: C.ink3 },
});
