"use client";

/**
 * /login — Página de autenticación.
 * Diseño minimalista unificado con la vaca robótica y efecto de brillo.
 * Refinado: Vaca más grande, menos espacio, transición de transparencia desde el centro.
 */

import { Suspense, useState } from "react";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { clientAuth } from "@/src/lib/firebase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { SignIn2 } from "@/src/components/ui/clean-minimal-sign-in";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCredentialsSignIn(email: string, password: string) {
    setError(null);
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(clientAuth, email, password);
      const idToken = await credential.user.getIdToken();

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        setError("Email o contraseña incorrectos");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(clientAuth, provider);
      const idToken = await credential.user.getIdToken();

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Error al iniciar con Google");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      setError("Error al iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SignIn2
      onSignIn={handleCredentialsSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      loading={loading}
      externalError={error}
    />
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#FAFBFA]">
      {/* Efecto de Brillo de Luz — Unificado para evitar el tono "cremoso" conflictivo */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Luz principal: Blanco puro centrado en la vaca para igualar su fondo */}
        <div className="absolute top-1/2 left-1/2 lg:left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] lg:w-[1100px] h-[600px] lg:h-[1100px] bg-white rounded-full blur-[80px] lg:blur-[120px] opacity-80" />
        
        {/* Reflejo sutil de marca: Muy tenue para no "ensuciar" el blanco */}
        <div className="absolute top-1/2 left-1/2 lg:left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] lg:w-[800px] h-[400px] lg:h-[800px] bg-brand-light/10 rounded-full blur-[120px] lg:blur-[180px] mix-blend-soft-light" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-0 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8">
        
        {/* Lado Izquierdo: Ilustración — Vaca Robótica (Mas grande y con transición de transparencia) */}
        <div className="absolute lg:relative inset-0 lg:inset-auto flex items-center justify-center lg:block z-0 lg:z-10 opacity-[0.05] lg:opacity-100 transition-all duration-1000 group pointer-events-none lg:pointer-events-auto">
          {/* Aura sutil detrás de la vaca */}
          <div className="absolute inset-0 bg-radial-gradient from-brand-light/20 to-transparent opacity-40 blur-3xl rounded-full scale-90" />
          
          <div className="relative w-[340px] md:w-[500px] lg:w-[780px] aspect-square transition-all duration-700">
            <Image
              src="/cow_robot.png"
              alt="SmartCow Intelligence"
              fill
              className="object-contain transition-all duration-700"
              style={{
                maskImage: 'linear-gradient(to right, black 50%, transparent 92%)',
                WebkitMaskImage: 'linear-gradient(to right, black 50%, transparent 92%)'
              }}
              priority
            />
          </div>
        </div>

        {/* Lado Derecho: Formulario de Ingreso */}
        <div className="w-full max-w-[420px] relative z-20 animate-in fade-in slide-in-from-bottom-4 lg:slide-in-from-right-8 duration-700 delay-200">
          <Suspense fallback={
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-brand-light/20 border-t-brand-light animate-spin" />
              <p className="text-ink-meta text-[10px] uppercase tracking-tighter text-center">Iniciando sesión segura...</p>
            </div>
          }>
            <LoginContent />
          </Suspense>
        </div>
      </div>

      {/* Branding Footer Minimal */}
      <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center justify-center gap-2 text-center z-20 pointer-events-none opacity-30 lg:opacity-40">
        <p className="text-ink-meta text-[8px] uppercase tracking-widest">
          © 2026 SmartCow · AgroLab
        </p>
      </div>
    </div>
  );
}
