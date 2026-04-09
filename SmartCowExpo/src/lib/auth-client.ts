/**
 * src/lib/auth-client.ts — Auth helpers para Expo (SecureStore + JWT)
 *
 * Flujo:
 *   login(email, password) → POST /api/mobile/auth/login → { token, user }
 *   El token se guarda en SecureStore y se incluye en cada fetch como Bearer.
 *
 * Requiere backend: app/api/mobile/auth/login/route.ts (AUT-pending)
 */

import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "smartcow_token";
const USER_KEY = "smartcow_user";

// ─── Ajustar según entorno ───────────────────────────────────────
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

// ─── Tipos ───────────────────────────────────────────────────────

export type UserRol =
  | "superadmin"
  | "admin_org"
  | "admin_fundo"
  | "operador"
  | "veterinario"
  | "viewer";

export interface MobileUser {
  id: string;
  email: string;
  nombre: string;
  orgId: number;
  fundos: number[];
  rol: UserRol;
  modulos: Record<string, boolean>;
}

interface LoginResponse {
  token: string;
  user: MobileUser;
}

// ─── Login ───────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<MobileUser> {
  const res = await fetch(`${API_BASE}/api/mobile/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error("Credenciales inválidas");
  }

  const data = (await res.json()) as LoginResponse;

  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));

  return data.user;
}

// ─── Logout ──────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

// ─── Token helpers ───────────────────────────────────────────────

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getStoredUser(): Promise<MobileUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as MobileUser;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return token !== null;
}

// ─── Fetch autenticado ───────────────────────────────────────────

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getToken();
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}
