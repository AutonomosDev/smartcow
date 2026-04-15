/**
 * auth.config.ts — DEPRECATED
 *
 * This file was part of a partial migration to NextAuth v5 that has been rolled back.
 * The project uses Firebase Auth (session cookie __session) as configured in CLAUDE.md.
 *
 * See: src/lib/firebase/admin.ts + src/lib/firebase/client.ts
 * Session handling: app/api/auth/session/route.ts
 */

// Stub exports to keep imports from breaking during rebuild
export const handlers = { GET: undefined, POST: undefined };
export const auth = async () => null;
export const signIn = async () => {};
export const signOut = async () => {};
