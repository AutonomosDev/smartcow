"use client"

import * as React from "react"
import { useState } from "react";
import { LogIn, Lock, Mail } from "lucide-react";

interface SignIn2Props {
  onSignIn: (email: string, password: string) => Promise<void>;
  onGoogleSignIn?: () => void;
  loading?: boolean;
  externalError?: string | null;
}

const SignIn2 = ({ onSignIn, onGoogleSignIn, loading, externalError }: SignIn2Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignIn = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password) {
      setError("Por favor ingresa email y contraseña.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Por favor ingresa un email válido.");
      return;
    }
    setError("");
    await onSignIn(email, password);
  };

  return (
    <div className="w-full flex items-center justify-center relative z-10">
      {/* Caja de login sin bordes exteriores ni sombras pesadas */}
      <div className="w-full max-w-sm bg-gradient-to-b from-sky-50/50 to-white rounded-3xl p-8 flex flex-col items-center text-black">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white mb-6 shadow-sm border border-gray-50">
          <LogIn className="w-7 h-7 text-black" />
        </div>
        
        <h2 className="text-2xl font-semibold mb-2 text-center text-ink-title">
          Ingresar con email
        </h2>
        
        <p className="text-ink-meta text-sm mb-6 text-center">
          Gestiona tu predio con inteligencia. <br /> Todo en un solo lugar.
        </p>

        <form onSubmit={handleSignIn} className="w-full flex flex-col gap-3 mb-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              placeholder="Email"
              type="email"
              value={email}
              autoComplete="email"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-light/20 bg-gray-50/50 text-black text-sm transition-all"
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              placeholder="Contraseña"
              type="password"
              value={password}
              autoComplete="current-password"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-light/20 bg-gray-50/50 text-black text-sm transition-all"
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="w-full flex flex-col items-end gap-1">
            {(error || externalError) && (
              <div className="text-xs text-red-500 text-right w-full bg-red-50 p-2 rounded-lg border border-red-100/50 mb-2">
                {error || externalError}
              </div>
            )}
            <button 
              type="button"
              className="text-[11px] hover:text-brand-light font-medium text-ink-meta transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-dark text-white font-medium py-3 rounded-xl shadow-lg shadow-brand-dark/10 hover:brightness-110 cursor-pointer transition-all mb-4 mt-2 disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="flex items-center w-full my-4">
          <div className="flex-grow h-[1px] bg-gray-100"></div>
          <span className="mx-3 text-[10px] uppercase tracking-widest text-gray-300 font-bold">O ingresar con</span>
          <div className="flex-grow h-[1px] bg-gray-100"></div>
        </div>

        <div className="flex gap-3 w-full justify-center">
          <button 
            type="button"
            onClick={onGoogleSignIn}
            disabled={loading}
            className="flex items-center justify-center w-full h-12 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-all grow disabled:opacity-50"
          >
            <img
              src="/google.svg"
              alt="Google"
              className="w-5 h-5 mr-3"
            />
            <span className="text-sm font-semibold text-ink-title">Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export { SignIn2 };
