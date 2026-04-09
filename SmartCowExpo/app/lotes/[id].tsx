/**
 * app/lotes/[id].tsx — Detalle de Lote
 * Métricas biométricas + índice de conversión (Stanley Edition)
 */

import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, Weight, Droplets, Leaf, MessageSquare } from "lucide-react-native";
import { Colors } from "@/constants/colors";
import { fetchLoteDetalle, type LoteDetalle } from "@/src/lib/api";

interface MetricCard {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
}

function MetricTile({ label, value, unit, icon }: MetricCard) {
  return (
    <View style={styles.metricTile}>
      <View style={styles.metricIcon}>{icon}</View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricUnit}>{unit}</Text>
    </View>
  );
}

export default function LoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detalle, setDetalle] = useState<LoteDetalle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchLoteDetalle(Number(id))
      .then(setDetalle)
      .catch(() => setDetalle(null))
      .finally(() => setLoading(false));
  }, [id]);

  const gdpStr = detalle?.gdpKgDia != null
    ? `${detalle.gdpKgDia.toFixed(2)} kg/día`
    : "—";

  const metrics: MetricCard[] = [
    {
      label: "Promedio Peso",
      value: detalle?.avgPesoActualKg != null
        ? `${detalle.avgPesoActualKg.toFixed(1)}`
        : "—",
      unit: "kg / animal",
      icon: <Weight size={18} color={Colors.brand.dark} />,
    },
    {
      label: "Consumo Agua",
      value: "—",
      unit: "L / día",
      icon: <Droplets size={18} color={Colors.brand.dark} />,
    },
    {
      label: "Nivel Nutrición",
      value: "—",
      unit: "índice",
      icon: <Leaf size={18} color={Colors.brand.dark} />,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={Colors.ink.title} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            {detalle?.nombre ?? `Lote #${id}`}
          </Text>
          <Text style={styles.headerSub}>
            {detalle ? `${detalle.totalAnimales} animales · ${detalle.diasEnLote} días` : "Detalle de rendimiento"}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Índice de Conversión — Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Índice de Conversión (GDP)</Text>
          {loading ? (
            <ActivityIndicator color="#fff" style={{ marginVertical: 12 }} />
          ) : (
            <Text style={styles.heroValue}>{gdpStr}</Text>
          )}
          <Text style={styles.heroSub}>
            {detalle?.gdpKgDia != null
              ? `Ganancia diaria de peso · ${detalle.diasEnLote} días en lote`
              : "Sin datos de pesaje registrados aún"}
          </Text>
          <View style={styles.heroDivider} />
          <View style={styles.heroTabs}>
            <TouchableOpacity style={[styles.heroTab, styles.heroTabActive]}>
              <Text style={[styles.heroTabText, styles.heroTabTextActive]}>
                Resumen
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroTab}>
              <Text style={styles.heroTabText}>Notas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Grid de métricas */}
        <Text style={styles.sectionLabel}>Indicadores</Text>
        <View style={styles.metricsGrid}>
          {metrics.map((m) => (
            <MetricTile key={m.label} {...m} />
          ))}
        </View>

        {/* CTA Chat IA */}
        <TouchableOpacity
          style={styles.chatCta}
          onPress={() => router.push("/(tabs)/chat")}
          activeOpacity={0.85}
        >
          <MessageSquare size={18} color="#fff" />
          <Text style={styles.chatCtaText}>
            Consultar SmartCow IA sobre este lote
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* FAB Iniciar Pesaje */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <Weight size={18} color="#fff" />
        <Text style={styles.fabText}>Iniciar Pesaje</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.farm.base,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.farm.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ink.meta + "20",
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.farm.base,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.ink.title,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.ink.meta,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  heroCard: {
    backgroundColor: Colors.brand.dark,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  heroLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.brand.light,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  heroValue: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  heroSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#ffffff60",
    marginTop: 4,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "#ffffff20",
    marginVertical: 16,
  },
  heroTabs: {
    flexDirection: "row",
    gap: 8,
  },
  heroTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  heroTabActive: {
    backgroundColor: Colors.brand.light + "25",
  },
  heroTabText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#ffffff60",
  },
  heroTabTextActive: {
    color: Colors.brand.light,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.ink.meta,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  metricTile: {
    flex: 1,
    backgroundColor: Colors.farm.surface,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  metricIcon: {
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: Colors.ink.meta,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.ink.title,
  },
  metricUnit: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: Colors.ink.meta,
    marginTop: 2,
  },
  chatCta: {
    backgroundColor: Colors.brand.dark + "dd",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chatCtaText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#fff",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    backgroundColor: Colors.brand.light,
    borderRadius: 9999,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: Colors.brand.light,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    gap: 8,
  },
  fabText: {
    color: Colors.brand.dark,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
