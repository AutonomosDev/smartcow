# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Reglas criticas

**MODELO AI PROHIBIDO CAMBIAR** — El chat ganadero usa `claude-sonnet-4-6` (standard) / `claude-haiku` (light) via Anthropic SDK directo. PROHIBIDO cambiarlo sin aprobacion explicita de Cesar. **Excepcion autorizada (AUT-290)**: org 99 (trial/demo) rutea a `gemini-3.1-flash-lite-preview` via `src/lib/chat/llm-routing.ts` (pickProvider). Referencia operacional: `.claude/references/config/llm-routing-and-budget.yaml`. Migrado desde Gemma-4-31b/OpenRouter el 2026-04-20 (AUT-261). Esta regla tiene prioridad sobre cualquier otra.

**INFRA Y SEGURIDAD → YAML** — Fuente de verdad: `.claude/references/config/infra-and-security.yaml`. VPS, firewall, SSH, backups, GCP, env vars, puertos, DNS. Leer ANTES de afirmar cualquier cosa sobre infra.

**EL CODIGO MANDA** — El codigo en el repo es la fuente de verdad. Linear, docs y memoria son referencia secundaria. Leer el codigo primero; si la respuesta esta en el repo, no preguntar.

**LINEAR Y RUSSELL SON REFERENCIA, NO VERDAD** — Si Russell dice "completado" o Linear dice "Done", leer el codigo y verificar antes de creerlo.

**NO PREGUNTAR LO QUE SE PUEDE LEER** — `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/eas.json`, cualquier archivo del repo: leerlo antes de preguntar. Solo preguntar lo que esta fuera del repo (credenciales, decisiones de producto).

**EAS BUILD** — Verificar estado con `cd apps/mobile && npx eas-cli build:view <build-id>`. Lanzar builds con `--no-wait`. Nunca monitorear el proceso local con tail.

**ROUTER EN EVOLUCION** — `pickModel()` actual es heuristica simple (AUT-262, Done). AUT-287 IN PROGRESS está implementando router 4 capas (regex → intent → embeddings → sonnet) para bajar costo ~70%. Antes de refactorar `src/lib/router.ts` revisar el estado del ticket.

## Comandos

```bash
npm run dev                  # Dev server (Next.js, puerto 3003)
npm run build                # Production build
npm run typecheck            # TypeScript check — debe pasar antes de reportar done
npm run db:generate          # Generar migration desde schema
npm run db:migrate           # Aplicar migrations
npm run db:push              # Push schema directo (solo dev)
npm run db:studio            # Drizzle Studio UI (puerto 4983)
npm run mobile               # Metro bundler + iOS simulator (Metro en 8081)
npm run mobile:dev           # Next.js (3003) + Metro (8081) concurrentemente
npm run etl:precios-feria    # ETL boletines ODEPA/AFECH a tabla precios_feria
```

ETLs sin script npm se corren con `tsx` directo, ej: `npx tsx src/etl/import-agroapp-excel.ts <tipo> <file.xlsx>`.

Deploy web: `./deploy.sh` desde local (requiere SSH alias `smartcow-vps`). Hace git pull en VPS + docker compose rebuild. `./deploy.sh --migrate` para correr migrations. Detalle en `.claude/references/config/infra-and-security.yaml`.

No hay test suite — verificacion = `npm run typecheck`. Sin Jest, Vitest ni Playwright. Tampoco hay ESLint configurado (no `npm run lint`).

## Arquitectura

Monorepo con web (Next.js) en raiz y mobile (Expo) en `apps/mobile/`.

### Web — Next.js 16 (App Router)
- React 19, TypeScript strict, output `standalone`
- PostgreSQL + Drizzle ORM (`src/db/`) — NUNCA raw queries con `pg`
- NextAuth v5 (JWT strategy, cookie `__session`, 8h) — `auth.config.ts`
- Anthropic SDK (`@anthropic-ai/sdk`, modelo `claude-sonnet-4-6`) — chat ganadero SSE con prompt caching
- Google AI SDK (`@google/genai`, `gemini-3.1-flash-lite-preview`) — chat trial org 99 + `FORCE_GEMINI_ALL=1` (AUT-290, activo en prod)
- TailwindCSS v4, Radix UI, Recharts, Framer Motion
- Produccion: Hostinger VPS único (ver `.claude/references/config/infra-and-security.yaml`)

### Mobile — Expo ~54.0.33 / React Native 0.81.5 / React 19.1.0
- New Architecture habilitada
- NativeWind 4.2.3, React Navigation
- Auth via JWT Bearer tokens (`src/lib/mobile-jwt.ts` server-side)
- EAS Build configurado (`apps/mobile/eas.json`)
- SSE client: `apps/mobile/src/lib/sseClient.ts`
- Token refresh: `app/api/mobile/auth/refresh/route.ts`

### Estructura clave

```
app/                          — App Router pages
  login/page.tsx              — Login (FROZEN — solo logica auth interna)
  (protected)/                — Rutas autenticadas (dashboard, chat, animales, etc.)
  api/chat/route.ts           — Chat SSE endpoint (orquesta Anthropic o Gemini)
  api/auth/                   — NextAuth handlers
  api/mobile/auth/refresh/    — Token refresh para app mobile
auth.config.ts                — NextAuth v5: Credentials + Google SSO
middleware.ts                 — Protege rutas: verifica cookie o Bearer token
src/
  db/
    schema/index.ts           — Tablas Drizzle (fuente de verdad — ver archivo)
    client.ts                 — Pool + withPredioContext() para RLS
    migrations/               — Drizzle Kit migrations (NO editar SQL a mano)
  lib/
    auth.ts                   — auth() wrapper: DEV_SESSION en dev, NextAuth en prod
    with-auth.ts              — withAuth() + withAuthBearer() guards
    mobile-jwt.ts             — JWT HS256 para app mobile (usa AUTH_SECRET)
    claude.ts                 — Tool definitions (CATTLE_TOOLS) + ejecutarTool()
    modules.ts                — Feature flags por org (feedlot, crianza)
    queries/                  — Drizzle queries reutilizables
    chat/
      llm-routing.ts          — pickProvider() — anthropic vs google por email/org (AUT-290)
      gemini-loop.ts          — Tool loop Gemini (thoughtSignature preserved, Langfuse tracing AUT-291)
    intent/                   — Intercept pre-LLM: catalog.ts + handlers SQL-directo (AUT-287/288)
    cache.ts                  — Query cache pre-LLM (bypass: header X-Cache-Bypass: 1)
  components/
    chat/                     — Chat panel, sidebar, message renderer
    dashboard/                — Dashboard widgets
    ui/                       — Primitivos UI (ai-prompt-box, etc.)
  agroapp/                    — Integracion API externa AgroApp
  etl/                        — Pipelines de importacion datos
  lib/
    router.ts                 — LLM tier selection (pickModel)
    budget.ts                 — Budget enforcement (no downgrade si provider=google)
    langfuse.ts               — LLM observability traces
apps/mobile/                  — App Expo (React Native)
  src/lib/sseClient.ts        — SSE client para chat ganadero mobile
packages/                     — Shared packages
```

### Tablas DB adicionales (chat system)

- `conversaciones` — historial de sesiones de chat
- `chat_sessions` — metadata de sesion
- `chat_attachments` — PDFs/docs adjuntos al chat (trial org 99: bloqueado)
- `chat_usage` — tracking de tokens, costo, tier por request (incluye cache tokens para costo exacto)
- `chat_cache` — caché L2/L3 respuestas pre-LLM (`src/lib/cache.ts`, AUT-265)
- `slash_commands` — comandos guardados por usuario
- `user_tasks` — tareas generadas por IA
- `user_memory` — memoria persistente del usuario (embeddings, cargada en system prompt)
- `kb_documents` — base de conocimiento (PDFs/docs indexados, campo `expiresAt`)
- `precios_feria` — precios de mercado ODEPA (ETL externo)
- `proveedores` — ferias, criadores, intermediarios (AUT-296)

### Flujo de auth

1. **Web**: Login -> NextAuth (Credentials o Google) -> JWT en cookie `__session` -> `auth()` en server components -> `withAuth()` en server actions
2. **Mobile**: Login -> `POST /api/mobile/auth` -> JWT Bearer token -> `withAuthBearer()` en route handlers
3. **Dev**: `auth()` retorna `DEV_SESSION` sin verificar cookie (NODE_ENV=development)
4. **Middleware** (Edge): solo verifica presencia de cookie/Bearer, no decodifica JWT

### Flujo del chat ganadero (6 capas en orden)

1. **Auth + Guards** — `withAuth()`/`withAuthBearer()` + bloqueo horario org 99 (00:00–05:59 CLT) + bloqueo adjuntos org 99
2. **Rate limit** — 20 req/min por usuario via Redis; fallback in-memory (`src/lib/rate-limit.ts`)
3. **Query cache** — `tryCache()` en `src/lib/cache.ts`. HIT → SSE inmediato con `done.cached=true`. Bypass: header `X-Cache-Bypass: 1` o si `webSearch=true`
4. **Intent intercept** — `tryIntercept()` en `src/lib/intent/`. L1 activo: regex contra `catalog.ts`, QUICK_HANDLERS ejecutan SQL directo sin LLM (costo=0, `chat_usage` escribe `modelId="intercept-L1"`). L2 pgvector y L3 haiku definidos, no implementados aún (AUT-287/288)
5. **Provider + tier routing** — `pickProvider()` selecciona anthropic vs google; `pickModel()` selecciona tier. Tier válidos en código: `light | standard | trial` (`heavy` eliminado en AUT-287, solo existe en YAML). Si provider=google, tier se fuerza a `"trial"` antes del budget check; budget downgrade se skippea para google
6. **LLM loop** — Anthropic: loop inline en `app/api/chat/route.ts` (max 8 iteraciones, prompt caching `cache_control: ephemeral` en system + tools). Gemini: `runGeminiLoop()` en `src/lib/chat/gemini-loop.ts` (iterar `candidates[0].content.parts` raw — NO usar `chunk.functionCalls` — para preservar `thoughtSignature`)

SSE events emitidos: `text_delta`, `tool_use`, `tool_result`, `artifact_block`, `done`, `error`, `model_selected`, `tier_downgraded`, `budget_warn`. El cliente DEBE consumir `artifact_block` para renderizar tablas/KPIs (AUT-258).

`CATTLE_TOOLS` declarados en formato Google AI SDK en `src/lib/claude.ts`. Para Anthropic, `toAnthropicTools()` normaliza `type` a minúsculas recursivamente. `ejecutarTool()` valida `predio_id` contra `prediosPermitidos`. `query_db` bloquea `users`, `organizaciones`, `sessions` (AUT-275). System prompt prohíbe al modelo revelar model/tier/env vars (AUT-280).

### LLM Routing y Budget

- **Tiers en código**: `light` (haiku), `standard` (sonnet-4-6, default), `trial` (gemini). `heavy` eliminado del código (AUT-287) pero aparece en YAML — ignorar YAML en este punto
- **Router** (`src/lib/router.ts`): `pickModel()` — LIGHT_REGEX (frases conversacionales cortas), TOOL_HINT_REGEX (términos dominio), webSearch → standard. Override: env `CHAT_FORCE_TIER`
- **Budget** (`src/lib/budget.ts`): `checkBudget()`, `canUseTier()`, `highestAllowedTier()` — planes Free/Pro/Enterprise
- **Tracking**: tabla `chat_usage` — org_id, user_id, model_id, tier, tokens_in/out, cost_usd, tool_calls, latency_ms
- **Observabilidad**: Langfuse (`src/lib/langfuse.ts`) — traces por request

### Roles y permisos
- Jerarquia: `trial(-1) < viewer(0) < operador(1) < veterinario(2) < admin_fundo(3) < admin_org(4) < superadmin(5)`
- `trial` = org 99 demo; `rolRank = -1`, bloqueado por cualquier `rolMinimo`. `trialUntil` en users tabla — `withAuth()` verifica expiración
- `withAuth({ rolMinimo, modulo, predioId })` para server actions
- Tools de escritura (registrar_pesaje, registrar_parto) requieren rol >= operador

### AgroApp — estado de migracion (actualizado 2026-04-21, AUT-283)
- API externa: `http://agroapp.cl:8080/AgroAppWebV18/`
- Integracion en `src/agroapp/`, ETL en `src/etl/`
- **Importadas en prod**: animales (7,404), pesajes (10,545), partos (5,522), tratamientos (32,727 — AUT-298 in review re-importa ~74.8k con trazabilidad SAG), inseminaciones (4,822), ecografias (2,732), areteos (1,384), bajas (1,429 via `animales.estado='baja'`), catalogos
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
