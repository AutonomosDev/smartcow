/**
 * app/api/auth/[...nextauth]/route.ts
 * Handler Next-Auth v5 — reemplaza Firebase session endpoint
 * Ticket: AUT-215
 */
import { handlers } from "@/auth.config";

export const { GET, POST } = handlers;
