import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, FIREBASE_API_KEY } from './config';

const TOKEN_KEY = '@smartcow:idToken';
const REFRESH_KEY = '@smartcow:refreshToken';
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

interface FirebaseSignInResponse {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  email: string;
}

interface FirebaseRefreshResponse {
  id_token: string;
  refresh_token: string;
}

export async function signIn(
  email: string,
  password: string
): Promise<SmartCowUser> {
  // Paso 1: Firebase REST Auth
  const firebaseRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/auth:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  if (!firebaseRes.ok) {
    const err = await firebaseRes.json().catch(() => ({}));
    const msg: string = (err as { error?: { message?: string } }).error?.message ?? 'Error de autenticación';
    throw new Error(mapFirebaseError(msg));
  }

  const firebaseData = (await firebaseRes.json()) as FirebaseSignInResponse;

  // Paso 2: Validar con backend SmartCow y obtener datos del usuario
  const smartcowRes = await fetch(`${API_BASE_URL}/api/mobile/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: firebaseData.idToken }),
  });

  if (!smartcowRes.ok) {
    const err = await smartcowRes.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? 'Usuario no autorizado en SmartCow');
  }

  const { user } = (await smartcowRes.json()) as { user: SmartCowUser };

  // Paso 3: Persistir token + user
  await Promise.all([
    AsyncStorage.setItem(TOKEN_KEY, firebaseData.idToken),
    AsyncStorage.setItem(REFRESH_KEY, firebaseData.refreshToken),
    AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
  ]);

  return user;
}

export async function refreshIdToken(): Promise<string | null> {
  const refreshToken = await AsyncStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return null;

  const res = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
    }
  );

  if (!res.ok) {
    await signOut();
    return null;
  }

  const data = (await res.json()) as FirebaseRefreshResponse;
  await AsyncStorage.setItem(TOKEN_KEY, data.id_token);
  await AsyncStorage.setItem(REFRESH_KEY, data.refresh_token);
  return data.id_token;
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
    AsyncStorage.removeItem(REFRESH_KEY),
    AsyncStorage.removeItem(USER_KEY),
  ]);
}

function mapFirebaseError(code: string): string {
  switch (code) {
    case 'EMAIL_NOT_FOUND':
    case 'INVALID_PASSWORD':
    case 'INVALID_LOGIN_CREDENTIALS':
      return 'Email o contraseña incorrectos';
    case 'USER_DISABLED':
      return 'Cuenta deshabilitada';
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return 'Demasiados intentos. Intenta más tarde';
    default:
      return 'Error de autenticación';
  }
}
