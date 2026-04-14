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
