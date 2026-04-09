/**
 * app/(tabs)/index.tsx — Home "Farm Tracker"
 * KPIs del fundo: animales, lotes, último pesaje
 */

import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Grid2X2, Weight, Bell, ChevronRight } from "lucide-react-native";
import { Colors } from "@/constants/colors";
import { getStoredUser, type MobileUser } from "@/src/lib/auth-client";
import { fetchKpis, fetchLotes, type FundoKpis } from "@/src/lib/api";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  onPress?: () => void;
}

function KpiCard({ label, value, sub, icon, onPress }: KpiCardProps) {
  return (
    <TouchableOpacity
      style={styles.kpiCard}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
    >
      <View style={styles.kpiIcon}>{icon}</View>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {sub && <Text style={styles.kpiSub}>{sub}</Text>}
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [kpis, setKpis] = useState<FundoKpis | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData(fId: number) {
    try {
      const data = await fetchKpis(fId);
      setKpis(data);
    } catch {
      // Sin datos — mantiene null
    }
  }

  useEffect(() => {
    getStoredUser().then((u) => {
      setUser(u);
      const fId = u?.fundos[0];
      if (fId) loadData(fId);
    });
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    const u = await getStoredUser();
    setUser(u);
    const fId = u?.fundos[0];
    if (fId) await loadData(fId);
    setRefreshing(false);
  }

  async function navigateToLotes() {
    const fundoId = user?.fundos[0];
    if (!fundoId) return;
    try {
      const lotes = await fetchLotes(fundoId);
      if (lotes.length > 0) {
        router.push(`/lotes/${lotes[0].id}`);
      }
    } catch {
      // fallback: no navegar si hay error
    }
  }

  const fundoId = user?.fundos[0] ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>SmartCow</Text>
          {fundoId > 0 && (
            <Text style={styles.headerSub}>Fundo #{fundoId}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
          <Bell size={20} color={Colors.ink.body} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.brand.dark}
          />
        }
      >
        <Text style={styles.sectionTitle}>Resumen del fundo</Text>

        <View style={styles.kpiGrid}>
          <KpiCard
            label="Lotes activos"
            value={kpis ? String(kpis.lotesActivos) : "—"}
            sub={kpis && kpis.lotesActivos > 0 ? "Ver todos" : "Sin lotes"}
            icon={<Grid2X2 size={22} color={Colors.brand.dark} />}
            onPress={kpis && kpis.lotesActivos > 0 ? navigateToLotes : undefined}
          />
          <KpiCard
            label="Último pesaje"
            value={
              kpis?.ultimoPesaje
                ? `${kpis.ultimoPesaje.pesoKg.toFixed(1)} kg`
                : "—"
            }
            sub={kpis?.ultimoPesaje?.fecha ?? "Sin datos"}
            icon={<Weight size={22} color={Colors.brand.dark} />}
          />
        </View>

        {/* Accesos rápidos */}
        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
        <View style={styles.quickList}>
          <TouchableOpacity
            style={styles.quickItem}
            onPress={() => router.push("/(tabs)/tasks")}
            activeOpacity={0.75}
          >
            <Text style={styles.quickLabel}>Ver tareas del día</Text>
            <ChevronRight size={16} color={Colors.ink.meta} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickItem}
            onPress={() => router.push("/(tabs)/chat")}
            activeOpacity={0.75}
          >
            <Text style={styles.quickLabel}>Consultar SmartCow IA</Text>
            <ChevronRight size={16} color={Colors.ink.meta} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.farm.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ink.meta + "20",
  },
  headerGreeting: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.ink.title,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.ink.meta,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.farm.base,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.ink.meta,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 8,
  },
  kpiGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.farm.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiIcon: {
    marginBottom: 12,
  },
  kpiLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.ink.meta,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: Colors.ink.title,
  },
  kpiSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.ink.meta,
    marginTop: 2,
  },
  quickList: {
    backgroundColor: Colors.farm.surface,
    borderRadius: 16,
    overflow: "hidden",
  },
  quickItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.farm.base,
  },
  quickLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.ink.title,
  },
});
