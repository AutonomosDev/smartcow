"use client";

/**
 * /login — Página de autenticación.
 * Reemplaza Firebase Client SDK con Next-Auth signIn()
 * Ticket: AUT-215
 */

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { SignIn2 } from "@/src/components/ui/clean-minimal-sign-in";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/chat";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCredentialsSignIn(email: string, password: string) {
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email o contraseña incorrectos");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setError("Error al iniciar sesión con Google");
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
      {/* Efecto de Brillo de Luz */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 lg:left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] lg:w-[1100px] h-[600px] lg:h-[1100px] bg-white rounded-full blur-[80px] lg:blur-[120px] opacity-80" />
        <div className="absolute top-1/2 left-1/2 lg:left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] lg:w-[800px] h-[400px] lg:h-[800px] bg-brand-light/10 rounded-full blur-[120px] lg:blur-[180px] mix-blend-soft-light" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-0 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8">
        {/* Ilustración vaca robótica */}
        <div className="absolute lg:relative inset-0 lg:inset-auto flex items-center justify-center lg:block z-0 lg:z-10 opacity-[0.05] lg:opacity-100 transition-all duration-1000 group pointer-events-none lg:pointer-events-auto">
          <div className="absolute inset-0 bg-radial-gradient from-brand-light/20 to-transparent opacity-40 blur-3xl rounded-full scale-90" />
          <div className="relative w-[340px] md:w-[500px] lg:w-[780px] aspect-square transition-all duration-700">
            <Image
              src="/cow_robot.png"
              alt="SmartCow Intelligence"
              fill
              className="object-contain transition-all duration-700"
              style={{
                maskImage: "linear-gradient(to right, black 50%, transparent 92%)",
                WebkitMaskImage: "linear-gradient(to right, black 50%, transparent 92%)",
              }}
              priority
            />
          </div>
        </div>

        {/* Formulario */}
        <div className="w-full max-w-[420px] relative z-20 animate-in fade-in slide-in-from-bottom-4 lg:slide-in-from-right-8 duration-700 delay-200">
          <Suspense
            fallback={
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-brand-light/20 border-t-brand-light animate-spin" />
                <p className="text-ink-meta text-[10px] uppercase tracking-tighter text-center">
                  Iniciando sesión segura...
                </p>
              </div>
            }
          >
            <LoginContent />
          </Suspense>
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center justify-center gap-2 text-center z-20 pointer-events-none opacity-30 lg:opacity-40">
        <p className="text-ink-meta text-[8px] uppercase tracking-widest">
          © 2026 SmartCow · AgroLab
        </p>
      </div>
    </div>
  );
}
