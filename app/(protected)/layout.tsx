/**
 * app/(protected)/layout.tsx — Layout para rutas autenticadas.
 * Verifica sesión server-side via Firebase session cookie.
 */

import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-[#F4F6F5]">
      <main className="flex-1 w-full mx-auto flex flex-col relative pb-20 md:pb-0">
        {children}
      </main>
    </div>
  );
}
