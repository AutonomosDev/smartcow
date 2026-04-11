/**
 * /login — Página de autenticación.
 * Firebase Client SDK — email/password.
 */

"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
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
      // By-pass temporal para navegación del mockup en modo dev
      if (process.env.NODE_ENV === "development") {
        router.push(callbackUrl);
        return;
      }

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
      if (process.env.NODE_ENV === "development") {
        router.push(callbackUrl);
        return;
      }
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Panel izquierdo — Branding & "Vaca Agentic" */}
      <div className="hidden lg:flex lg:w-1/2 bg-white relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center">
          <Image
            src="/cow_robot.png"
            alt="SmartCow Intelligence"
            fill
            className="object-contain scale-110"
            priority
          />
        </div>
        {/* Soft fading to the right side starting from the middle */}
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-r from-transparent to-white pointer-events-none" />
      </div>

      {/* Panel derecho — Formulario */}
      <div className="flex-1 flex items-center justify-center bg-white relative z-10">
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
