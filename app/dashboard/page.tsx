/**
 * /dashboard — Página principal autenticada.
 * Server Component — accede directamente a la sesión.
 * Ticket: AUT-110
 */

import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { nombre, rol, orgId } = session.user;

  return (
    <main style={{ padding: 32 }}>
      <h1>Dashboard SmartCow</h1>
      <p>Bienvenido, {nombre}</p>
      <dl>
        <dt>Rol</dt>
        <dd>{rol}</dd>
        <dt>Organización ID</dt>
        <dd>{orgId}</dd>
      </dl>
    </main>
  );
}
