# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Reglas criticas

**MODELO AI PROHIBIDO CAMBIAR** — El chat ganadero usa `claude-sonnet-4-6` via Anthropic SDK directo. PROHIBIDO cambiarlo sin aprobacion explicita de Cesar. Referencia operacional: `.claude/references/config/llm-routing-and-budget.yaml`. Migrado desde Gemma-4-31b/OpenRouter el 2026-04-20 (AUT-261). Esta regla tiene prioridad sobre cualquier otra.

**EL CODIGO MANDA** — El codigo en el repo es la fuente de verdad. Linear, docs y memoria son referencia secundaria. Leer el codigo primero; si la respuesta esta en el repo, no preguntar.

**LINEAR Y RUSSELL SON REFERENCIA, NO VERDAD** — Si Russell dice "completado" o Linear dice "Done", leer el codigo y verificar antes de creerlo.

**NO PREGUNTAR LO QUE SE PUEDE LEER** — `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/eas.json`, cualquier archivo del repo: leerlo antes de preguntar. Solo preguntar lo que esta fuera del repo (credenciales, decisiones de producto).

**EAS BUILD** — Verificar estado con `cd apps/mobile && npx eas-cli build:view <build-id>`. Lanzar builds con `--no-wait`. Nunca monitorear el proceso local con tail.

## Comandos

```bash
npm run dev          # Dev server (Next.js, puerto 3003)
npm run build        # Production build
npm run typecheck    # TypeScript check — debe pasar antes de reportar done
npm run db:generate  # Generar migration desde schema
npm run db:migrate   # Aplicar migrations
npm run db:push      # Push schema directo (solo dev)
npm run db:studio    # Drizzle Studio UI (puerto 4983)
npm run mobile       # Metro bundler + iOS simulator (Metro en 8081)
npm run mobile:dev   # Next.js (3003) + Metro (8081) concurrentemente
```

Deploy web: SOLO via CI/CD (push a `main`). Flujo exacto de prod: confirmar con Cesar (VPS Hostinger — ver `.claude/CLAUDE.md`).

## Arquitectura

Monorepo con web (Next.js) en raiz y mobile (Expo) en `apps/mobile/`.

### Web — Next.js 16 (App Router)
- React 19, TypeScript strict, output `standalone`
- PostgreSQL + Drizzle ORM (`src/db/`) — NUNCA raw queries con `pg`
- NextAuth v5 (JWT strategy, cookie `__session`, 8h) — `auth.config.ts`
- Anthropic SDK (`@anthropic-ai/sdk`, modelo `claude-sonnet-4-6`) — chat ganadero SSE con prompt caching
- TailwindCSS v4, Radix UI, Recharts, Framer Motion
- Produccion: Hostinger VPS (ver `.claude/CLAUDE.md`)

### Mobile — Expo ~54.0.33 / React Native 0.81.5 / React 19.1.0
- New Architecture habilitada
- NativeWind 4.2.3, React Navigation
- Auth via JWT Bearer tokens (`src/lib/mobile-jwt.ts` server-side)
- EAS Build configurado (`apps/mobile/eas.json`)
- SSE client: `apps/mobile/src/lib/sseClient.ts`
- Token refresh: `app/api/mobile/auth/refresh/route.ts`

### Estructura clave

```
app/                        — App Router pages
  login/page.tsx            — Login (FROZEN — solo logica auth interna)
  (protected)/              — Rutas autenticadas (dashboard, chat, animales, etc.)
  api/chat/route.ts         — Chat SSE endpoint (Anthropic SDK + tool use)
  api/auth/                 — NextAuth handlers
  api/mobile/auth/refresh/  — Token refresh para app mobile
auth.config.ts              — NextAuth v5: Credentials + Google SSO
middleware.ts               — Protege rutas: verifica cookie o Bearer token
src/
  db/
    schema/index.ts         — Tablas Drizzle (fuente de verdad del schema — ver archivo)
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
  agroapp/                  — Integracion API externa AgroApp
  etl/                      — Pipelines de importacion datos
apps/mobile/                — App Expo (React Native)
  src/lib/sseClient.ts      — SSE client para chat ganadero mobile
packages/                   — Shared packages
```

### Flujo de auth

1. **Web**: Login -> NextAuth (Credentials o Google) -> JWT en cookie `__session` -> `auth()` en server components -> `withAuth()` en server actions
2. **Mobile**: Login -> `POST /api/mobile/auth` -> JWT Bearer token -> `withAuthBearer()` en route handlers
3. **Dev**: `auth()` retorna `DEV_SESSION` sin verificar cookie (NODE_ENV=development)
4. **Middleware** (Edge): solo verifica presencia de cookie/Bearer, no decodifica JWT

### Flujo del chat ganadero

1. Client POST `/api/chat` con messages + predio_id
2. `withAuth()`/`withAuthBearer()` valida sesion y acceso al predio
3. Anthropic (claude-sonnet-4-6) procesa con CATTLE_TOOLS
4. Schema de tools definido con Google AI SDK (@google/genai), convertido a formato OpenAI function calling por `toOpenAITools()` en `src/lib/claude.ts`
5. `ejecutarTool()` ejecuta tools contra la DB via Drizzle
6. Respuesta SSE: text_delta, tool_use, tool_result, done

### Roles y permisos
- Jerarquia: `viewer(0) < operador(1) < veterinario(2) < admin_fundo(3) < admin_org(4) < superadmin(5)`
- `withAuth({ rolMinimo, modulo, predioId })` para server actions
- Tools de escritura (registrar_pesaje, registrar_parto) requieren rol >= operador

### AgroApp — estado de migracion
- API externa: `http://agroapp.cl:8080/AgroAppWebV18/`
- Integracion en `src/agroapp/`, ETL en `src/etl/`
- Importadas: ventas, tratamientos, traslados — `src/etl/import-agroapp-full.ts`
- Pendientes: pesajes, partos, inseminaciones, ecografias, animales, catalogos, areteos, bajas

## Linear
- Team: Autonomos Dev — ID: `b0184c23-f78a-4035-bd78-74b75481292c`
- `list_teams` falla — usar siempre el ID directo

## Roles del equipo
- **Cesar** -> decisiones producto y diseno. Unica aprobacion valida.
- **Toto** -> analisis, critica, estrategia. NUNCA escribe codigo.
- **AG (Claude Code)** -> implementacion.
