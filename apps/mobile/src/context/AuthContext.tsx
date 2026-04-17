import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  SmartCowUser,
  getStoredUser,
  signIn as authSignIn,
  signOut as authSignOut,
} from '../lib/auth';
import { DEFAULT_PREDIO_ID } from '../lib/config';

interface AuthContextValue {
  user: SmartCowUser | null;
  /** Primer predio del usuario autenticado. Fallback a DEFAULT_PREDIO_ID. */
  predioId: number;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SmartCowUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión persitida al abrir la app
  useEffect(() => {
    if (__DEV__) {
      // En dev: hacer login real para obtener token válido
      authSignIn('admin@smartcow.cl', 'SmartCow2026!')
        .then(setUser)
        .catch(() => {
          // Fallback si el servidor no está disponible
          setUser({
            id: '5',
            email: 'cesar@autonomos.dev',
            nombre: 'JP Dev',
            orgId: 1,
            predios: [11, 7, 9, 8, 10, 6, 5],
            rol: 'admin_org',
            modulos: { feedlot: true, crianza: true },
          });
        })
        .finally(() => setLoading(false));
      return;
    }
    getStoredUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const predioId = user?.predios?.[0] ?? DEFAULT_PREDIO_ID;

  const signIn = async (email: string, password: string) => {
    const u = await authSignIn(email, password);
    setUser(u);
  };

  const signOut = async () => {
    await authSignOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, predioId, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
