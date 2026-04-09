/**
 * app/(tabs)/_layout.tsx — Tab navigator: Home / Tareas / Chat
 */

import { Tabs } from "expo-router";
import { LayoutDashboard, ClipboardList, MessageSquare } from "lucide-react-native";
import { Colors } from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brand.dark,
        tabBarInactiveTintColor: Colors.ink.meta,
        tabBarStyle: {
          backgroundColor: Colors.farm.surface,
          borderTopColor: Colors.ink.meta + "30",
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tareas",
          tabBarIcon: ({ color, size }) => (
            <ClipboardList size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat IA",
          tabBarIcon: ({ color, size }) => (
            <MessageSquare size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
