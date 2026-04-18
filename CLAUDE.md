# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Reglas críticas

**MODELO AI PROHIBIDO CAMBIAR** — El chat ganadero usa `google/gemma-4-31b-it` via OpenRouter. PROHIBIDO cambiarlo sin aprobación explícita de César. Esta regla tiene prioridad sobre cualquier otra.

**EL CÓDIGO MANDA** — El código en el repo es la fuente de verdad. Linear, docs y memoria son referencia secundaria. Leer el código primero; si la respuesta está en el repo, no preguntar.

**LINEAR Y RUSSELL SON REFERENCIA, NO VERDAD** — Si Russell dice "completado" o Linear dice "Done", leer el código y verificar antes de creerlo.

**NO PREGUNTAR LO QUE SE PUEDE LEER** — `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/eas.json`, cualquier archivo del repo: leerlo antes de preguntar. Solo preguntar lo que está fuera del repo (credenciales, decisiones de producto).

**EAS BUILD** — Verificar estado con `cd apps/mobile && npx eas-cli build:view <build-id>`. Lanzar builds con `--no-wait`. Nunca monitorear el proceso local con tail.

## Comandos

```bash
npm run dev          # Dev server (puerto 3003)
npm run build        # Production build
npm run typecheck    # TypeScript check — debe pasar antes de reportar done
npm run db:generate  # Generar migration desde schema
npm run db:migrate   # Aplicar migrations
npm run db:push      # Push schema directo (solo dev)
npm run db:studio    # Drizzle Studio UI
npm run mobile       # Metro + iOS simulator
npm run mobile:dev   # Next.js + Metro concurrently
```

Deploy web: SOLO via CI/CD (push a `main` → Firebase App Hosting). NO manual.

## Arquitectura

Monorepo con web (Next.js) en raíz y mobile (Expo) en `apps/mobile/`.

### Web — Next.js 16 (App Router)
- React 19, TypeScript strict, output `standalone`
- PostgreSQL + Drizzle ORM (`src/db/`) — NUNCA raw queries con `pg`
- NextAuth v5 (JWT strategy, cookie `__session`, 8h) — `auth.config.ts`
- OpenRouter API (modelo `google/gemma-4-31b-it`) — chat ganadero SSE
- TailwindCSS v4, Radix UI, Recharts, Framer Motion
- Firebase App Hosting (Cloud Run, us-central1)

### Mobile — Expo 54 / React Native 0.81.5
- New Architecture habilitada
- NativeWind 4.2.3, React Navigation
- Auth via JWT Bearer tokens (`src/lib/mobile-jwt.ts` server-side)
- EAS Build configurado (`apps/mobile/eas.json`)

### Estructura clave

```
app/                        — App Router pages
  login/page.tsx            — Login (FROZEN — solo lógica auth interna)
  (protected)/              — Rutas autenticadas (dashboard, chat, animales, etc.)
  api/chat/route.ts         — Chat SSE endpoint (OpenRouter + tool use)
  api/auth/                 — NextAuth handlers
auth.config.ts              — NextAuth v5: Credentials + Google SSO
middleware.ts               — Protege rutas: verifica cookie o Bearer token
src/
  db/
    schema/index.ts         — 18+ tablas Drizzle (fuente de verdad del schema)
    client.ts               — Pool + withPredioContext() para RLS
    migrations/             — Drizzle Kit migrations (NO editar SQL a mano)
  lib/
    auth.ts                 — auth() wrapper: DEV_SESSION en dev, NextAuth en prod
    with-auth.ts            — withAuth() + withAuthBearer() guards
    mobile-jwt.ts           — JWT HS256 para app mobile (usa AUTH_SECRET)
    claude.ts               — Tool definitions + ejecutarTool() para chat ganadero
    modules.ts              — Feature flags por org (feedlot, crianza)
    queries/                — Drizzle queries reutilizables
  components/
    chat/                   — Chat panel, sidebar, message renderer
    dashboard/              — Dashboard widgets
    ui/                     — Primitivos UI (ai-prompt-box, etc.)
  agroapp/                  — Integración API externa AgroApp
  etl/                      — Pipelines de importación datos
apps/mobile/                — App Expo (React Native)
packages/                   — Shared packages
```

### Flujo de auth

1. **Web**: Login → NextAuth (Credentials o Google) → JWT en cookie `__session` → `auth()` en server components → `withAuth()` en server actions
2. **Mobile**: Login → `POST /api/mobile/auth` → JWT Bearer token → `withAuthBearer()` en route handlers
3. **Dev**: `auth()` retorna `DEV_SESSION` sin verificar cookie (NODE_ENV=development)
4. **Middleware** (Edge): solo verifica presencia de cookie/Bearer, no decodifica JWT

### Flujo del chat ganadero

1. Client POST `/api/chat` con messages + predio_id
2. `withAuth()`/`withAuthBearer()` valida sesión y acceso al predio
3. OpenRouter (gemma-4-31b-it) procesa con CATTLE_TOOLS (formato OpenAI function calling)
4. `ejecutarTool()` ejecuta tools contra la DB vía Drizzle
5. Respuesta SSE: text_delta, tool_use, tool_result, done

### Roles y permisos
- Jerarquía: `viewer(0) < operador(1) < veterinario(2) < admin_fundo(3) < admin_org(4) < superadmin(5)`
- `withAuth({ rolMinimo, modulo, predioId })` para server actions
- Tools de escritura (registrar_pesaje, registrar_parto) requieren rol >= operador

## Linear
- Team: Autonomos Dev — ID: `b0184c23-f78a-4035-bd78-74b75481292c`
- `list_teams` falla — usar siempre el ID directo

## Roles del equipo
- **César** → decisiones producto y diseño. Única aprobación válida.
- **Toto** → análisis, crítica, estrategia. NUNCA escribe código.
- **AG (Claude Code)** → implementación.
