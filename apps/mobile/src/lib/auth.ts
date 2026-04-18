import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const TOKEN_KEY = '@smartcow:idToken';
const USER_KEY = '@smartcow:user';

// Espejo de SmartCowSession['user'] del backend (src/lib/auth.ts)
export type UserRol =
  | 'superadmin'
  | 'admin_org'
  | 'admin_fundo'
  | 'operador'
  | 'veterinario'
  | 'viewer';

export interface SmartCowUser {
  id: string;
  email: string;
  nombre: string;
  orgId: number;
  predios: number[];
  rol: UserRol;
  modulos: Record<string, boolean>;
}

export async function signIn(
  email: string,
  password: string
): Promise<SmartCowUser> {
  const res = await fetch(`${API_BASE_URL}/api/mobile/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { error?: string }).error ?? 'Error de autenticación';
    throw new Error(mapAuthError(msg));
  }

  const { user, token } = (await res.json()) as { user: SmartCowUser; token: string };

  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, token),
    AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
  ]);

  return user;
}

/**
 * Refresca el token actual silenciosamente via POST /api/mobile/auth/refresh.
 * El servidor acepta el token aunque lleve hasta 1h expirado.
 * Si el refresh tiene éxito guarda el nuevo token y lo retorna.
 * Si falla retorna null (el llamador debe hacer sign-out).
 */
export async function refreshIdToken(): Promise<string | null> {
  const currentToken = await getStoredToken();
  if (!currentToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/mobile/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: currentToken }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { token?: string; user?: SmartCowUser };
    if (!data.token) return null;

    const saveOps: Promise<void>[] = [AsyncStorage.setItem(TOKEN_KEY, data.token)];
    if (data.user) {
      saveOps.push(AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user)));
    }
    await Promise.all(saveOps);

    return data.token;
  } catch {
    return null;
  }
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredUser(): Promise<SmartCowUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as SmartCowUser;
}

export async function signOut(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_KEY),
    AsyncStorage.removeItem(USER_KEY),
  ]);
}

function mapAuthError(msg: string): string {
  if (msg.includes('Credenciales') || msg.includes('inválid')) {
    return 'Email o contraseña incorrectos';
  }
  return msg;
}
