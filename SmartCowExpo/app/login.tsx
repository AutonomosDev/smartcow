/**
 * app/login.tsx — Pantalla de login
 * Stanley Edition: fondo brand-dark + form crema
 */

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { login } from "@/src/lib/auth-client";
import { Colors } from "@/constants/colors";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError("Completa todos los campos");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace("/(tabs)");
    } catch {
      setError("Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {/* Header brand */}
      <View style={styles.header}>
        <View style={styles.logoBox} />
        <Text style={styles.logoText}>SmartCow</Text>
        <Text style={styles.tagline}>Plataforma Ganadera</Text>
        <Text style={styles.headline}>
          Gestiona tu fundo con inteligencia.
        </Text>
      </View>

      {/* Form card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.formWrapper}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bienvenido</Text>
            <Text style={styles.cardSubtitle}>
              Ingresa a tu cuenta para continuar.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="usuario@fundo.cl"
                placeholderTextColor={Colors.ink.meta}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.ink.meta}
                secureTextEntry
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Ingresar</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.dark,
  },
  header: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 32,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.brand.light,
    marginBottom: 32,
  },
  logoText: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  tagline: {
    color: Colors.brand.light,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  headline: {
    color: "#fff",
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    lineHeight: 34,
  },
  formWrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: Colors.farm.base,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.ink.title,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.ink.body,
    marginBottom: 28,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.ink.body,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.farm.surface,
    borderWidth: 1,
    borderColor: Colors.ink.meta + "50",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.ink.title,
  },
  errorText: {
    color: Colors.accent.warning,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: Colors.brand.dark,
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
