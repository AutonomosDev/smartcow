/**
 * NextAuth v5 route handler.
 * Maneja /api/auth/signin, /api/auth/callback, /api/auth/session, etc.
 * Ticket: AUT-110
 */

import { handlers } from "@/src/lib/auth";

export const { GET, POST } = handlers;
