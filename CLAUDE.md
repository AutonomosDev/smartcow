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

No hay test suite — verificacion = `npm run typecheck`. Sin Jest, Vitest ni Playwright.

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
  lib/
    router.ts               — LLM tier selection (pickModel)
    budget.ts               — Budget enforcement (checkBudget, highestAllowedTier)
    langfuse.ts             — LLM observability traces
apps/mobile/                — App Expo (React Native)
  src/lib/sseClient.ts      — SSE client para chat ganadero mobile
packages/                   — Shared packages
```

### Tablas DB adicionales (chat system)

- `conversaciones` — historial de sesiones de chat
- `chat_sessions` — metadata de sesion
- `chat_attachments` — PDFs/docs adjuntos al chat
- `chat_usage` — tracking de tokens, costo, tier por request
- `slash_commands` — comandos guardados por usuario
- `user_tasks` — tareas generadas por IA
- `user_memory` — memoria persistente del usuario (embeddings)
- `kb_documents` — base de conocimiento (PDFs/docs indexados)
- `precios_feria` — precios de mercado ODEPA (ETL externo)

### Flujo de auth

1. **Web**: Login -> NextAuth (Credentials o Google) -> JWT en cookie `__session` -> `auth()` en server components -> `withAuth()` en server actions
2. **Mobile**: Login -> `POST /api/mobile/auth` -> JWT Bearer token -> `withAuthBearer()` en route handlers
3. **Dev**: `auth()` retorna `DEV_SESSION` sin verificar cookie (NODE_ENV=development)
4. **Middleware** (Edge): solo verifica presencia de cookie/Bearer, no decodifica JWT

### Flujo del chat ganadero

1. Client POST `/api/chat` con messages + predio_id
2. `withAuth()`/`withAuthBearer()` valida sesion y acceso al predio
3. `checkRateLimit()` + `checkBudget()` / `highestAllowedTier()` — `src/lib/budget.ts`
4. `pickModel()` selecciona tier (light/standard/heavy) — `src/lib/router.ts`
5. Tools declarados en formato Google AI SDK (`CATTLE_TOOLS`), convertidos a Anthropic por `toAnthropicTools()` en `app/api/chat/route.ts`
6. Anthropic (claude-sonnet-4-6) procesa con CATTLE_TOOLS via SSE
7. `ejecutarTool()` ejecuta tools contra la DB via Drizzle, valida `predio_id`
8. `writeChatUsage()` trackea tokens/costo/tier en tabla `chat_usage`
9. Langfuse trace via `src/lib/langfuse.ts`
10. Respuesta SSE: text_delta, tool_use, tool_result, done

### LLM Routing y Budget

- **Tiers**: `light` (haiku), `standard` (sonnet-4-6, default), `heavy` (opus) — ver `.claude/references/config/llm-routing-and-budget.yaml`
- **Router** (`src/lib/router.ts`): `pickModel()` selecciona tier por heuristica (largo query, tool_calls, web_search)
- **Budget** (`src/lib/budget.ts`): `checkBudget()`, `canUseTier()`, `highestAllowedTier()` — planes Free/Pro/Enterprise
- **Tracking**: tabla `chat_usage` — org_id, user_id, model_id, tier, tokens_in/out, cost_usd, tool_calls, latency_ms
- **Observabilidad**: Langfuse (`src/lib/langfuse.ts`) — traces por request

### Roles y permisos
- Jerarquia: `viewer(0) < operador(1) < veterinario(2) < admin_fundo(3) < admin_org(4) < superadmin(5)`
- `withAuth({ rolMinimo, modulo, predioId })` para server actions
- Tools de escritura (registrar_pesaje, registrar_parto) requieren rol >= operador

### AgroApp — estado de migracion (actualizado 2026-04-21, AUT-283)
- API externa: `http://agroapp.cl:8080/AgroAppWebV18/`
- Integracion en `src/agroapp/`, ETL en `src/etl/`
- **Importadas en prod**: animales (7,404), pesajes (10,545), partos (5,522), tratamientos (32,727), inseminaciones (4,822), ecografias (2,732), areteos (1,384), bajas (1,429 via `animales.estado='baja'`), catalogos
- **Pendientes**:
  - `ventas` — requiere `AGROAPP_PASSWORD` en prod `.env` para `src/etl/import-ventas-detalle.ts`
  - `traslados` — no hay ETL (agregados por lote sin DIIO; `import-agroapp-excel.ts` tiene early-exit explicito)
- ETLs activos:
  - `src/etl/import-agroapp-excel.ts <tipo> <file.xlsx>` — bajas, partos, inseminaciones, pesajes, ganado, areteos, tratamientos
  - `src/etl/import-ventas-detalle.ts` — ventas via API AgroApp (requiere credenciales)
  - `src/etl/import-precios-feria.ts` — ODEPA precios_feria (14,196 rows, boletines AFECH)
- **Auditoría drift prod vs repo**: `DATABASE_URL=... npx tsx scripts/audit-schema-sync.ts`

## Linear
- Team: Autonomos Dev — ID: `b0184c23-f78a-4035-bd78-74b75481292c`
- `list_teams` falla — usar siempre el ID directo

## Roles del equipo
- **Cesar** -> decisiones producto y diseno. Unica aprobacion valida.
- **Toto** -> analisis, critica, estrategia. NUNCA escribe codigo.
- **AG (Claude Code)** -> implementacion.
