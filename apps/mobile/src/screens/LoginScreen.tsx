import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

const tokens = {
  color: { primary: '#1E3A2F', bg: '#f8f6f1', white: '#ffffff', danger: '#e74c3c', cream: '#e8e4dc', text: { primary: '#1E3A2F', muted: '#7a7a6e', secondary: '#555' } },
  font: { family: { regular: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold' }, size: { sm: 12, base: 15, xxl: 26 } },
  spacing: { xs: 8, sm: 8, md: 16, lg: 20, xl: 24 },
  radius: { card: 20, btn: 14 },
};

interface Props {
  navigation?: {
    canGoBack: () => boolean;
    goBack: () => void;
    navigate: (screen: string) => void;
  };
}

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Ingresa email y contraseña');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const canGoBack = navigation?.canGoBack?.() ?? false;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {canGoBack && (
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
          <ArrowLeft size={22} color={tokens.color.primary} />
        </TouchableOpacity>
      )}

      <View style={styles.card}>
        <Text style={styles.title}>smartCow</Text>
        <Text style={styles.subtitle}>Gestión ganadera inteligente</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={tokens.color.text.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        {/* Campo contraseña con ojo */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Contraseña"
            placeholderTextColor={tokens.color.text.muted}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(v => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {showPassword
              ? <EyeOff size={18} color={tokens.color.text.muted} />
              : <Eye size={18} color={tokens.color.text.muted} />
            }
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Botón ingresar */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={tokens.color.white} />
          ) : (
            <Text style={styles.btnText}>Ingresar</Text>
          )}
        </TouchableOpacity>

        {/* Botón Google */}
        <TouchableOpacity style={styles.googleBtn} disabled>
          <Text style={styles.googleBtnText}>Continuar con Google</Text>
          <Text style={styles.proximamente}>(próximamente)</Text>
        </TouchableOpacity>

        {/* Link registrarse */}
        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation?.navigate('Register')}
        >
          <Text style={styles.registerText}>
            ¿No tienes cuenta?{' '}
            <Text style={styles.registerTextBold}>Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.color.bg,
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.xl,
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: tokens.spacing.xl,
    zIndex: 10,
  },
  card: {
    backgroundColor: tokens.color.white,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.xl,
  },
  title: {
    fontFamily: tokens.font.family.semibold,
    fontSize: tokens.font.size.xxl,
    color: tokens.color.primary,
    marginBottom: tokens.spacing.xs,
  },
  subtitle: {
    fontFamily: tokens.font.family.regular,
    fontSize: tokens.font.size.base,
    color: tokens.color.text.secondary,
    marginBottom: tokens.spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderColor: tokens.color.cream,
    borderRadius: tokens.radius.btn,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm + 4,
    fontFamily: tokens.font.family.regular,
    fontSize: tokens.font.size.base,
    color: tokens.color.text.primary,
    marginBottom: tokens.spacing.md,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.color.cream,
    borderRadius: tokens.radius.btn,
    marginBottom: tokens.spacing.md,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm + 4,
    fontFamily: tokens.font.family.regular,
    fontSize: tokens.font.size.base,
    color: tokens.color.text.primary,
  },
  eyeBtn: {
    paddingHorizontal: tokens.spacing.md,
  },
  error: {
    fontFamily: tokens.font.family.regular,
    fontSize: tokens.font.size.sm,
    color: tokens.color.danger,
    marginBottom: tokens.spacing.md,
  },
  btn: {
    backgroundColor: tokens.color.primary,
    borderRadius: tokens.radius.btn,
    paddingVertical: tokens.spacing.md,
    alignItems: 'center',
    marginTop: tokens.spacing.xs,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontFamily: tokens.font.family.semibold,
    fontSize: tokens.font.size.base,
    color: tokens.color.white,
  },
  googleBtn: {
    borderWidth: 1,
    borderColor: tokens.color.cream,
    borderRadius: tokens.radius.btn,
    paddingVertical: tokens.spacing.md,
    alignItems: 'center',
    marginTop: tokens.spacing.md,
    opacity: 0.5,
  },
  googleBtnText: {
    fontFamily: tokens.font.family.medium,
    fontSize: tokens.font.size.base,
    color: tokens.color.text.primary,
  },
  proximamente: {
    fontFamily: tokens.font.family.regular,
    fontSize: tokens.font.size.sm,
    color: tokens.color.text.muted,
    marginTop: 2,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: tokens.spacing.lg,
  },
  registerText: {
    fontFamily: tokens.font.family.regular,
    fontSize: tokens.font.size.sm,
    color: tokens.color.text.muted,
  },
  registerTextBold: {
    fontFamily: tokens.font.family.semibold,
    color: tokens.color.primary,
  },
});
