import { getStoredToken, refreshIdToken, signOut } from './auth';
import { API_BASE_URL } from './config';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let token = await getStoredToken();

  const makeRequest = (idToken: string | null) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        ...(options.headers ?? {}),
      },
    });

  let res = await makeRequest(token);

  // Token expirado — intentar refresh una sola vez
  if (res.status === 401) {
    token = await refreshIdToken();
    if (!token) {
      await signOut();
      throw new ApiError(401, 'Sesión expirada');
    }
    res = await makeRequest(token);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (body as { error?: string }).error ?? `Error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
};

// ─────────────────────────────────────────────
// Response types — espejo de los endpoints del backend
// ─────────────────────────────────────────────

export interface PredioKpis {
  totalAnimales: number;
  totalPesajes: number;
  totalPartos: number;
  totalEcografias: number;
  ultimoPesaje: { fecha: string; pesoKg: number } | null;
}

export interface LoteResumen {
  id: number;
  nombre: string;
  totalAnimales: number;
  fechaEntrada: string;
  fechaSalidaEstimada: string | null;
  objetivoPesoKg: number | null;
  estado: string;
}

export interface LoteDetalle {
  id: number;
  nombre: string;
  fechaEntrada: string;
  fechaSalidaEstimada: string | null;
  objetivoPesoKg: number | null;
  estado: string;
  totalAnimales: number;
  avgPesoActualKg: number | null;
  avgPesoEntradaKg: number | null;
  diasEnLote: number;
  gdpKgDia: number | null;
}
