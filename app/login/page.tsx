"use client";

export const dynamic = "force-dynamic";

/**
 * /login — Página de autenticación.
 * Firebase Client SDK — email/password.
 */

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { clientAuth } from "@/src/lib/firebase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { SignIn2 } from "@/src/components/ui/clean-minimal-sign-in";

export default function LoginPage() {
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
    // Google sign-in: implementar con signInWithPopup si se necesita
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Panel izquierdo — Branding & "Vaca Agentic" */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-dark flex-col justify-between p-12 relative overflow-hidden">
        {/* Fondo con degradado radial para resaltar la vaca */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-brand-light)_0%,_transparent_70%)] opacity-5" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-inner bg-brand-light" />
            <span className="text-white text-xl font-bold tracking-tight">SmartCow</span>
          </div>
        </div>

        {/* Hero: Vaca Agentic */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 py-10">
          <div className="relative w-full max-w-[440px] aspect-square">
            <Image
              src="/cow_robot.png"
              alt="SmartCow Intelligence"
              fill
              className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
              priority
            />
          </div>
          <div className="text-center mt-6">
            <p className="text-brand-light text-sm font-bold uppercase tracking-widest mb-3">
              Plataforma Ganadera
            </p>
            <h1 className="text-white text-4xl font-bold leading-tight max-w-md mx-auto">
              Gestiona tu predio con inteligencia.
            </h1>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/30 text-xs">© 2026 SmartCow · Autónomos Lab</p>
        </div>
      </div>

      {/* Panel derecho — Formulario */}
      <div className="flex-1 flex items-center justify-center bg-farm-base">
        <SignIn2
          onSignIn={handleCredentialsSignIn}
          onGoogleSignIn={handleGoogleSignIn}
          loading={loading}
          externalError={error}
        />
      </div>
    </div>
  );
}
