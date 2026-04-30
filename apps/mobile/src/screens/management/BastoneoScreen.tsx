/**
 * BastoneoScreen — lectura de EID via bastón Tru-Test XRS2i en modo HID Bluetooth.
 *
 * Cómo funciona:
 *  - El bastón XRS2i emparejado al Android emite el EID como teclado Bluetooth.
 *  - Cada lectura llega como string seguido de Enter (onSubmitEditing).
 *  - showSoftInputOnFocus={false} evita que se abra el teclado virtual.
 *  - El TextInput está siempre con foco mientras la pantalla está visible.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { api, ApiError } from '../../lib/api';

const F = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
};

const BG = '#f8f6f1';
const INK = '#0F1B14';
const INK_2 = '#43524A';
const INK_3 = '#7A8880';
const LINE = '#E6E8E2';
const ACCENT = '#0F4C2A';
const RED = '#B0413E';
const RED_SOFT = '#F8E5E2';
const AMBER = '#B7791F';
const AMBER_SOFT = '#FBF1DD';
const GREEN = '#2E7D4F';
const GREEN_SOFT = '#E8F2EC';

interface AnimalLookup {
  found: true;
  animal: {
    id: number;
    diio: string | null;
    eid: string;
    sexo: 'M' | 'H' | null;
    fechaNacimiento: string | null;
    edadMeses: number | null;
    estado: string | null;
    moduloActual: string | null;
    raza: string | null;
    predio: { id: number; nombre: string | null };
  };
  ultimoPesaje: { pesoKg: number; fecha: string } | null;
  alertas: Array<{ tipo: string; mensaje: string }>;
}

type Estado =
  | { kind: 'esperando' }
  | { kind: 'consultando'; eid: string }
  | { kind: 'encontrado'; data: AnimalLookup }
  | { kind: 'no_encontrado'; eid: string }
  | { kind: 'error'; eid: string; message: string };

export default function BastoneoScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [buffer, setBuffer] = useState('');
  const [estado, setEstado] = useState<Estado>({ kind: 'esperando' });

  const refocus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(refocus, 100);
      return () => clearTimeout(t);
    }, [refocus])
  );

  const lookup = useCallback(async (eid: string) => {
    setEstado({ kind: 'consultando', eid });
    try {
      const data = await api.get<AnimalLookup>(
        `/api/mobile/animales/eid/${encodeURIComponent(eid)}`
      );
      setEstado({ kind: 'encontrado', data });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setEstado({ kind: 'no_encontrado', eid });
      } else {
        setEstado({
          kind: 'error',
          eid,
          message: err instanceof Error ? err.message : 'Error desconocido',
        });
      }
    }
  }, []);

  const onSubmit = useCallback(() => {
    const eid = buffer.trim();
    setBuffer('');
    if (!eid) return;
    lookup(eid);
    setTimeout(refocus, 50);
  }, [buffer, lookup, refocus]);

  const reset = useCallback(() => {
    setBuffer('');
    setEstado({ kind: 'esperando' });
    setTimeout(refocus, 50);
  }, [refocus]);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ArrowLeft size={22} color={INK} />
        </TouchableOpacity>
        <Text style={s.title}>Bastoneo</Text>
        <TouchableOpacity onPress={reset} style={s.backBtn}>
          <RefreshCw size={20} color={INK_2} />
        </TouchableOpacity>
      </View>

      {/* Hidden input that captures HID keystrokes from the stick */}
      <TextInput
        ref={inputRef}
        value={buffer}
        onChangeText={setBuffer}
        onSubmitEditing={onSubmit}
        showSoftInputOnFocus={false}
        autoFocus
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        blurOnSubmit={false}
        keyboardType="default"
        returnKeyType="done"
        style={s.hiddenInput}
        accessibilityLabel="Captura EID del bastón"
      />

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="always"
        onTouchEnd={refocus}
      >
        {estado.kind === 'esperando' && (
          <View style={s.waiting}>
            <Text style={s.waitingEmoji}>📡</Text>
            <Text style={s.waitingTitle}>Esperando lectura</Text>
            <Text style={s.waitingSub}>Apunta el bastón al arete electrónico</Text>
            {buffer.length > 0 && (
              <Text style={s.bufferHint}>recibiendo: {buffer}</Text>
            )}
          </View>
        )}

        {estado.kind === 'consultando' && (
          <View style={s.waiting}>
            <ActivityIndicator color={ACCENT} size="large" />
            <Text style={s.waitingTitle}>Buscando animal…</Text>
            <Text style={s.eidMono}>{estado.eid}</Text>
          </View>
        )}

        {estado.kind === 'no_encontrado' && (
          <View style={s.notFound}>
            <Text style={s.notFoundEmoji}>❓</Text>
            <Text style={s.notFoundTitle}>EID no encontrado</Text>
            <Text style={s.eidMono}>{estado.eid}</Text>
            <Text style={s.notFoundSub}>
              No está en tus predios o no existe en la base.
            </Text>
            <TouchableOpacity onPress={reset} style={s.primaryBtn}>
              <Text style={s.primaryBtnText}>Volver a leer</Text>
            </TouchableOpacity>
          </View>
        )}

        {estado.kind === 'error' && (
          <View style={s.notFound}>
            <Text style={s.notFoundEmoji}>⚠️</Text>
            <Text style={s.notFoundTitle}>Error de consulta</Text>
            <Text style={s.eidMono}>{estado.eid}</Text>
            <Text style={s.notFoundSub}>{estado.message}</Text>
            <TouchableOpacity onPress={reset} style={s.primaryBtn}>
              <Text style={s.primaryBtnText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {estado.kind === 'encontrado' && (
          <AnimalCard data={estado.data} onReset={reset} />
        )}
      </ScrollView>
    </View>
  );
}

function AnimalCard({
  data,
  onReset,
}: {
  data: AnimalLookup;
  onReset: () => void;
}) {
  const { animal, ultimoPesaje, alertas } = data;
  const sexoLabel = animal.sexo === 'H' ? 'Hembra' : animal.sexo === 'M' ? 'Macho' : '—';
  const edadLabel =
    animal.edadMeses != null
      ? animal.edadMeses < 24
        ? `${animal.edadMeses} m`
        : `${Math.floor(animal.edadMeses / 12)} a ${animal.edadMeses % 12} m`
      : '—';

  return (
    <View style={s.card}>
      <View style={s.cardHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.diio}>DIIO {animal.diio ?? '—'}</Text>
          <Text style={s.eidLine}>EID {animal.eid}</Text>
        </View>
        <View
          style={[
            s.estadoPill,
            animal.estado === 'baja' ? s.estadoPillBaja : s.estadoPillOk,
          ]}
        >
          <Text
            style={[
              s.estadoPillText,
              animal.estado === 'baja'
                ? { color: RED }
                : { color: GREEN },
            ]}
          >
            {animal.estado === 'baja' ? 'Baja' : 'Activo'}
          </Text>
        </View>
      </View>

      <View style={s.kvGrid}>
        <KV label="Predio" value={animal.predio.nombre ?? '—'} />
        <KV label="Sexo" value={sexoLabel} />
        <KV label="Edad" value={edadLabel} />
        <KV label="Raza" value={animal.raza ?? '—'} />
      </View>

      <View style={s.divider} />

      {ultimoPesaje ? (
        <View style={s.pesoBlock}>
          <Text style={s.pesoLabel}>Último peso</Text>
          <View style={s.pesoRow}>
            <Text style={s.pesoValue}>{ultimoPesaje.pesoKg}</Text>
            <Text style={s.pesoUnit}>kg</Text>
          </View>
          <Text style={s.pesoFecha}>{formatFecha(ultimoPesaje.fecha)}</Text>
        </View>
      ) : (
        <Text style={s.sinPeso}>Sin pesajes registrados</Text>
      )}

      {alertas.length > 0 && (
        <>
          <View style={s.divider} />
          {alertas.map((a, i) => (
            <View
              key={`${a.tipo}-${i}`}
              style={[
                s.alerta,
                a.tipo === 'baja' ? s.alertaRed : s.alertaAmber,
              ]}
            >
              <Text
                style={[
                  s.alertaText,
                  a.tipo === 'baja' ? { color: RED } : { color: AMBER },
                ]}
              >
                {a.mensaje}
              </Text>
            </View>
          ))}
        </>
      )}

      <TouchableOpacity onPress={onReset} style={s.primaryBtn}>
        <Text style={s.primaryBtnText}>Leer siguiente animal</Text>
      </TouchableOpacity>
    </View>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.kvItem}>
      <Text style={s.kvLabel}>{label}</Text>
      <Text style={s.kvValue}>{value}</Text>
    </View>
  );
}

function formatFecha(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  backBtn: { padding: 6 },
  title: { fontFamily: F.bold, fontSize: 17, color: INK },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    top: 0,
    left: 0,
  },
  scroll: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'flex-start',
  },

  waiting: { alignItems: 'center', marginTop: 80, gap: 12 },
  waitingEmoji: { fontSize: 56 },
  waitingTitle: { fontFamily: F.bold, fontSize: 20, color: INK },
  waitingSub: { fontFamily: F.regular, fontSize: 14, color: INK_3, textAlign: 'center' },
  bufferHint: {
    marginTop: 16,
    fontFamily: F.mono,
    fontSize: 12,
    color: INK_3,
    backgroundColor: LINE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  notFound: { alignItems: 'center', marginTop: 60, gap: 10 },
  notFoundEmoji: { fontSize: 56 },
  notFoundTitle: { fontFamily: F.bold, fontSize: 20, color: INK },
  notFoundSub: { fontFamily: F.regular, fontSize: 14, color: INK_3, textAlign: 'center', maxWidth: 280 },

  eidMono: {
    fontFamily: F.mono,
    fontSize: 14,
    color: INK_2,
    backgroundColor: LINE,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: LINE,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  diio: { fontFamily: F.bold, fontSize: 22, color: INK, letterSpacing: -0.3 },
  eidLine: { fontFamily: F.mono, fontSize: 12, color: INK_3, marginTop: 2 },
  estadoPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  estadoPillOk: { backgroundColor: GREEN_SOFT },
  estadoPillBaja: { backgroundColor: RED_SOFT },
  estadoPillText: { fontFamily: F.bold, fontSize: 11, letterSpacing: 0.4 },

  kvGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kvItem: { width: '47%' },
  kvLabel: { fontFamily: F.medium, fontSize: 11, color: INK_3, textTransform: 'uppercase', letterSpacing: 0.4 },
  kvValue: { fontFamily: F.bold, fontSize: 15, color: INK, marginTop: 2 },

  divider: { height: 1, backgroundColor: LINE, marginVertical: 16 },

  pesoBlock: { alignItems: 'center' },
  pesoLabel: { fontFamily: F.medium, fontSize: 11, color: INK_3, textTransform: 'uppercase', letterSpacing: 0.4 },
  pesoRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  pesoValue: { fontFamily: F.bold, fontSize: 44, color: INK, letterSpacing: -1.5 },
  pesoUnit: { fontFamily: F.medium, fontSize: 18, color: INK_3 },
  pesoFecha: { fontFamily: F.regular, fontSize: 13, color: INK_3, marginTop: 2 },
  sinPeso: { fontFamily: F.regular, fontSize: 14, color: INK_3, textAlign: 'center', paddingVertical: 12 },

  alerta: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  alertaRed: { backgroundColor: RED_SOFT },
  alertaAmber: { backgroundColor: AMBER_SOFT },
  alertaText: { fontFamily: F.medium, fontSize: 13 },

  primaryBtn: {
    marginTop: 18,
    backgroundColor: ACCENT,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: { fontFamily: F.bold, fontSize: 15, color: '#fff' },
});
