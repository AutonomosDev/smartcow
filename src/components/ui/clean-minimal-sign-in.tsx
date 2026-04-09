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
    <div className="min-h-screen w-full flex items-center justify-center bg-white rounded-xl z-1">
      <div className="w-full max-w-sm bg-gradient-to-b from-sky-50/50 to-white rounded-3xl shadow-xl shadow-opacity-10 p-8 flex flex-col items-center border border-blue-100 text-black">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white mb-6 shadow-lg shadow-opacity-5">
          <LogIn className="w-7 h-7 text-black" />
        </div>
        
        <h2 className="text-2xl font-semibold mb-2 text-center">
          Ingresar con email
        </h2>
        
        <p className="text-gray-500 text-sm mb-6 text-center">
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
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm"
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
              className="w-full pl-10 pr-10 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-black text-sm"
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="w-full flex flex-col items-end gap-1">
            {(error || externalError) && (
              <div className="text-sm text-red-500 text-right w-full">
                {error || externalError}
              </div>
            )}
            <button 
              type="button"
              className="text-xs hover:underline font-medium text-gray-600"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-b from-gray-700 to-gray-900 text-white font-medium py-2 rounded-xl shadow hover:brightness-105 cursor-pointer transition mb-4 mt-2 disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="flex items-center w-full my-2">
          <div className="flex-grow border-t border-dashed border-gray-200"></div>
          <span className="mx-2 text-xs text-gray-400">O ingresa con</span>
          <div className="flex-grow border-t border-dashed border-gray-200"></div>
        </div>

        <div className="flex gap-3 w-full justify-center mt-2">
          <button 
            type="button"
            onClick={onGoogleSignIn}
            disabled={loading}
            className="flex items-center justify-center w-full h-12 rounded-xl border bg-white hover:bg-gray-100 transition grow disabled:opacity-50"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-6 h-6 mr-2"
            />
            <span className="text-sm font-medium">Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export { SignIn2 };
