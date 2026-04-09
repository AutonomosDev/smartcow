/**
 * app/(tabs)/tasks.tsx — Gestión de Tareas diarias
 * Stanley Edition: lista con prioridad Alta/Media/Baja
 */

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Droplets, Stethoscope, Sprout } from "lucide-react-native";
import { Colors } from "@/constants/colors";

type Priority = "high" | "medium" | "low";

interface Task {
  id: string;
  title: string;
  responsible: string;
  time: string;
  priority: Priority;
  icon: "droplet" | "health" | "rotation";
  done: boolean;
}

const MOCK_TASKS: Task[] = [
  {
    id: "1",
    title: "Control de agua — Potrero 3",
    responsible: "Operario 1",
    time: "08:00",
    priority: "high",
    icon: "droplet",
    done: false,
  },
  {
    id: "2",
    title: "Vacunación lote El Boldo",
    responsible: "Veterinario",
    time: "10:30",
    priority: "high",
    icon: "health",
    done: false,
  },
  {
    id: "3",
    title: "Rotación potrero norte",
    responsible: "Operario 2",
    time: "14:00",
    priority: "medium",
    icon: "rotation",
    done: false,
  },
  {
    id: "4",
    title: "Pesaje lote invernada",
    responsible: "Operario 1",
    time: "16:00",
    priority: "low",
    icon: "rotation",
    done: true,
  },
];

const PRIORITY_LABEL: Record<Priority, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const PRIORITY_COLOR: Record<Priority, string> = {
  high: Colors.priority.high,
  medium: Colors.priority.medium,
  low: Colors.priority.low,
};

function TaskIcon({ type }: { type: Task["icon"] }) {
  const color = Colors.brand.dark;
  if (type === "droplet") return <Droplets size={18} color={color} />;
  if (type === "health") return <Stethoscope size={18} color={color} />;
  return <Sprout size={18} color={color} />;
}

function TaskCard({ task }: { task: Task }) {
  return (
    <View style={[styles.taskCard, task.done && styles.taskCardDone]}>
      <View style={styles.taskIconBox}>
        <TaskIcon type={task.icon} />
      </View>
      <View style={styles.taskBody}>
        <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>
          {task.title}
        </Text>
        <Text style={styles.taskMeta}>
          {task.responsible} · {task.time}
        </Text>
      </View>
      <View
        style={[
          styles.priorityBadge,
          { backgroundColor: PRIORITY_COLOR[task.priority] + "20" },
        ]}
      >
        <Text
          style={[
            styles.priorityText,
            { color: PRIORITY_COLOR[task.priority] },
          ]}
        >
          {PRIORITY_LABEL[task.priority]}
        </Text>
      </View>
    </View>
  );
}

export default function TasksScreen() {
  const active = MOCK_TASKS.filter((t) => !t.done);
  const done = MOCK_TASKS.filter((t) => t.done);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tareas</Text>
        <Text style={styles.headerSub}>Hoy</Text>
      </View>

      {/* Stats strip */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{active.length}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {MOCK_TASKS.filter((t) => t.priority === "high").length}
          </Text>
          <Text style={styles.statLabel}>Urgentes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{done.length}</Text>
          <Text style={styles.statLabel}>Terminadas</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {active.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Pendientes</Text>
            {active.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </>
        )}
        {done.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>
              Terminadas
            </Text>
            {done.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </>
        )}
      </ScrollView>

      {/* FAB Nueva Tarea */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <Plus size={22} color="#fff" />
        <Text style={styles.fabText}>Nueva Tarea</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.farm.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ink.meta + "20",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.ink.title,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.ink.meta,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.brand.dark,
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#fff3",
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#ffffff99",
    marginTop: 2,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.ink.meta,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  taskCard: {
    backgroundColor: Colors.farm.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  taskCardDone: {
    opacity: 0.5,
  },
  taskIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.brand.light + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  taskBody: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.ink.title,
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
    color: Colors.ink.meta,
  },
  taskMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.ink.meta,
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    backgroundColor: Colors.brand.dark,
    borderRadius: 9999,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: Colors.brand.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  fabText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginLeft: 8,
  },
});
