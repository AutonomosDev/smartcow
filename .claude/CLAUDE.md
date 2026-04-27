## ZONAS CONGELADAS — NO TOCAR SIN AUTORIZACION EXPLICITA DE CESAR

- `app/login/page.tsx` — UI disenada por AG (commit 7913929). NUNCA modificar layout, estilos ni estructura visual. Solo se puede tocar la logica de auth interna (handleCredentialsSignIn, handleGoogleSignIn). Cualquier cambio visual requiere autorizacion explicita.

---

## WHY — Reglas no deducibles del codigo

**Blockers vivos (revisar antes de tocar zona)**
- AUT-255 IN PROGRESS — usuarios admin_org sin predios asignados → POST `/api/chat` retorna 400 (`predio_id=0` rechazado por validacion). NO refactorar `withAuth`/`withAuthBearer` mientras este abierto.
- AUT-287 IN PROGRESS — router 4 capas en construccion. Cambios a `src/lib/router.ts` o `pickModel()` deben coordinarse.
- AUT-298 IN REVIEW — re-import tratamientos con trazabilidad SAG (~74.8k filas). Esperar merge antes de tocar `src/etl/import-agroapp-excel.ts` para tipo=tratamientos.

**ORM y DB**
- ORM: Drizzle. NUNCA usar `pg` directamente — todo pasa por `db` de `src/db/client.ts`
- Schema fuente de verdad: `src/db/schema/index.ts` (ver archivo — no hardcodear numero de tablas)
- Tablas dominio conocidas: `animales`, `pesajes`, `partos`, `lotes`, `inseminaciones`, `ecografias`, `areteos`, `bajas`, `medieros`, `potreros`, `movimientos_potrero`
- Tablas base: `organizaciones`, `fundos`, `users`, `user_fundos`
- Migraciones: `npm run db:migrate` (drizzle-kit) — NO modificar SQL a mano
- Push solo en dev: `npm run db:push` — en prod siempre migrate
- Migration 0003: solo `0003_users_password_hash` esta en el journal. `0003_medieros_tipo_propiedad.sql` es huerfano (ver "Pendientes de limpieza" abajo)

**Auth — NextAuth v5 (migrado desde Firebase, AUT-215)**
- `auth.config.ts` -> NextAuth config: CredentialsProvider (bcryptjs) + GoogleProvider (OAuth)
- JWT strategy, cookie `__session` HttpOnly 8h (mismo nombre que Firebase para compat con middleware)
- `src/lib/auth.ts` -> `auth()` wrapper: en dev retorna DEV_SESSION, en prod usa NextAuth session
- `src/lib/with-auth.ts` -> `withAuth()` para server actions, `withAuthBearer()` para mobile REST
- `src/lib/mobile-jwt.ts` -> JWT HS256 firmado con AUTH_SECRET para app Expo
- DEV_SESSION hardcodeado: orgId=1, predios=[11,7,9,8,10,6,5], rol=admin_org, modulos={ feedlot: true, crianza: true } — `src/lib/auth.ts:36-47`
- `src/lib/firebase/` ya no existe — Firebase Auth eliminado

**Auth — DEV BYPASS ACTIVO**
- `NODE_ENV === 'development'` -> `auth()` retorna `DEV_SESSION` sin verificar cookie

**Auth — roles y withAuth()**
- Toda server action que toque datos DEBE usar `withAuth()`
- Jerarquia: `viewer < operador < veterinario < admin_fundo < admin_org < superadmin`
- Roles validos en DB enum: `admin`, `operador`, `veterinario`, `viewer`, `admin_fundo`, `admin_org`, `superadmin` — `src/db/schema/users.ts:5` y `src/lib/with-auth.ts:15-21`

**Asistente ganadero (chat)**
- Modelo default: `claude-sonnet-4-6` via Anthropic SDK — PROHIBIDO CAMBIAR SIN APROBACION DE CESAR (migrado desde Gemma-4-31b/OpenRouter el 2026-04-20, AUT-261)
- Excepcion Gemini: AUT-290 activa ruta Gemini (`gemini-3.1-flash-lite-preview` via `@google/genai`) para org 99 o cuando `FORCE_GEMINI_ALL=1`. Los loops viven en `src/lib/chat/gemini-loop.ts` y `src/lib/chat/anthropic-loop.ts`, seleccionados en `src/lib/chat/llm-routing.ts`
- Endpoint: `app/api/chat/route.ts` — SSE streaming (delegado al loop correspondiente)
- Gemini 3.x exige preservar `thoughtSignature` en los Part de functionCall — iterar `candidates[0].content.parts` crudo, NO usar `chunk.functionCalls` (ver commit 0dd251f)
- Budget downgrade se skippea cuando `provider === "google"` (tier=trial no mapea a plan normal) — `app/api/chat/route.ts` commit 0a262e8
- Tool principal de lectura: `query_db` (generico, consulta cualquier tabla por nombre + filtros)
- Tools de escritura (2): `registrar_pesaje`, `registrar_parto`
- Schema de tools: declarado en formato Google AI SDK (`CATTLE_TOOLS` en `src/lib/claude.ts`), convertido a Anthropic por `toAnthropicTools()` en route.ts
- `ejecutarTool()` en `src/lib/claude.ts` valida `predio_id` contra `prediosPermitidos` del usuario
- Tools de escritura requieren `rolRank >= 1` (operador)
- `query_db` NUNCA retorna `users`, `organizaciones`, `sessions` — bloqueo en `ejecutarTool()` (AUT-275, prompt injection hardening)
- Respuesta del modelo NO debe incluir nombre del modelo, tier, ni env vars (AUT-280, system prompt rule)
- Rate limit `/api/chat`: 20 req/min por usuario via Redis (AUT-274)
- Cliente DEBE consumir evento SSE `artifact_block` para renderizar tablas/KPIs/alertas (fix AUT-258)
- Routing: `pickModel()` en `src/lib/router.ts` elige tier light/standard/heavy segun heuristica
- Budget: `checkBudget()` / `highestAllowedTier()` en `src/lib/budget.ts`
- Observabilidad: `src/lib/langfuse.ts` — Langfuse traces por request (AUT-291 agrega instrumentacion Gemini)
- EID = tag electronico RFID | DIIO = identificador visual del arete — no intercambiar
- Pesos en kg | Fechas en YYYY-MM-DD
- Componentes chat: `src/components/chat/chat-panel.tsx`, `chat-sidebar.tsx`, `message-renderer.tsx`
- UI input: `src/components/ui/ai-prompt-box.tsx` — sin sufijos de version
- Componentes huerfanos: `user-menu-modal`, `top-nav` (ver "Pendientes de limpieza" abajo)
- `artifact-renderer` NO se elimina — lo importa `artifact-mapper` (dead code transitivo intencional)

**Modulos**
- Feature flags por org: `feedlot`, `crianza`, etc. — stored en `organizaciones.modulos` (JSONB)
- Verificar con `withAuth({ modulo: 'feedlot' })` antes de exponer funcionalidad

**Infra y seguridad — ver `.claude/references/config/infra-and-security.yaml`**

Ese YAML es la fuente de verdad para VPS, contenedores, DNS, GCP, firewall, SSH, backups, env vars y deploy. Leerlo antes de afirmar cualquier cosa sobre infra.

Resumen operativo (detalle en YAML):
- VPS unico: Hostinger KVM 2, 2.24.204.73, alias SSH `smartcow-vps`. Self-hosted todo (app + db + redis + langfuse stack + nginx).
- Deploy: `./deploy.sh` (código) o `./deploy.sh --migrate` (código + migrations). CI/CD manual — no GitHub Actions. Git pull → `docker compose build app` → `docker compose up -d`.
- Migrations: `docker compose run --rm --profile migrate migrate` o stage `migrate` del Dockerfile. Si __drizzle_migrations desincronizado → `docker compose exec -T app npx tsx scripts/sync-drizzle-tracking.ts`.
- Staging: `docker-compose.staging.yml`. App 3001 / db-staging 5433 (ambos en loopback). DNS + cert activos. Seed desde prod: `bash scripts/sync-staging-from-prod.sh`.
- Secrets: `/var/www/smartcow/.env` en VPS (perms 600 root). NUNCA commitear. Backup antes de rsync.
- `apphosting.yaml` en el repo: RESIDUO LEGACY (ver "Pendientes de limpieza" abajo).

**Seguridad — hardening 2026-04-22 (detalle en YAML)**
- Firewall Hostinger activo (id 268254): solo 22/80/443 abiertos. Puertos 3000/3001/5433 en 127.0.0.1 — NUNCA exponer a 0.0.0.0.
- SSH: `prohibit-password` (solo keys), fail2ban con jail sshd (5 retries, 1h ban).
- SSL: Let's Encrypt auto-renew (smartcow.cl, www, langfuse, staging).
- Backups Postgres prod: diarios 03:15 UTC, retencion 7 dias, en `/var/backups/smartcow-postgres/`. **Off-site pendiente.**
- Secrets pendientes de rotacion (defaults `changeme`): `LANGFUSE_REDIS_AUTH`, `CLICKHOUSE_PASSWORD`, `MINIO_ROOT_PASSWORD`, `LANGFUSE_SALT`, `LANGFUSE_ENCRYPTION_KEY`. Solo accesibles desde red docker interna, pero higiene.
- Sin WAF, sin Cloudflare. Rate limit chat app-level via Redis.

**GCP — proyecto unico `smartcow-cl` (clean sweep 2026-04-22)**
- Eliminados: `smartcow-c22fb` (Firebase legacy), `smartcow-492119` (Cloud SQL legacy), `smartcow-web`, `smartedu-v1`, `gen-lang-client-0481252325`. En DELETE_REQUESTED, 30 dias de recovery — NO restaurar.
- APIs activas: `generativelanguage.googleapis.com`, `apikeys.googleapis.com`, `iap.googleapis.com`, `cloudapis.googleapis.com`.
- Credenciales vigentes:
  - Gemini API key (`GOOGLE_API_KEY`): restringida a `generativelanguage.googleapis.com` + IPs VPS (IPv4 2.24.204.73 + IPv6 /64).
  - OAuth Client web (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`): redirect `https://smartcow.cl/api/auth/callback/google`.
- Firebase Admin ya no se usa. `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` = env residuales, eliminar cuando se toquen.

**Env vars relevantes** (lista sanity — fuente canonica: `.claude/references/config/infra-and-security.yaml`)
- `DATABASE_URL` -> PostgreSQL connection string
- `NEXTAUTH_SECRET` / `AUTH_SECRET` -> Secreto JWT para NextAuth + mobile tokens
- `NEXTAUTH_URL` / `AUTH_TRUST_HOST` -> NextAuth config
- `ANTHROPIC_API_KEY` -> Anthropic SDK (chat ganadero default, claude-sonnet-4-6)
- `GOOGLE_API_KEY` -> Gemini inference (AUT-290 trial via `@google/genai`) + declaracion CATTLE_TOOLS. Restringida a generativelanguage.googleapis.com + IPs VPS.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` -> OAuth SSO (proyecto smartcow-cl)
- `FORCE_GEMINI_ALL` -> "1" fuerza toda peticion chat al loop Gemini (testing). Default 0. ACTIVO en prod desde 2026-04-22 — revertir post-testing AUT-290.
- `TAVILY_API_KEY` -> Web search (Tavily, 100 req/mes tier gratis)
- `REDIS_URL` -> Rate limiting app (redis://redis:6379 en docker)
- `LANGFUSE_SECRET_KEY` / `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_HOST` -> Observabilidad LLM (self-hosted en langfuse.smartcow.cl)
- `NEXT_PUBLIC_MAPBOX_TOKEN` -> Mapas frontend
- `AGROAPP_USER` / `AGROAPP_PASSWORD` -> API externa AgroApp
- `LINEAR_API_KEY` -> Linear MCP/scripts
- `OPENROUTER_API_KEY` -> LEGACY, eliminado (ver AUT-261)
- `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` -> LEGACY post-NextAuth

**AgroApp**
- API externa: `http://agroapp.cl:8080/AgroAppWebV18/`
- Credenciales: `AGROAPP_USER`, `AGROAPP_PASSWORD` — verificar con Cesar donde estan en prod
- Integracion en `src/agroapp/`, ETL en `src/etl/import-agroapp-full.ts`

**Frontend**
- Tailwind v4: colores en `@theme` dentro de `globals.css`. `tailwind.config.ts` es dead code (ver "Pendientes de limpieza" abajo)
- Radix UI para primitivos accesibles — no reinventar con divs

**Pendientes de limpieza** (NO eliminar dentro de tu ticket — deuda tecnica trackeada aparte)
- `apphosting.yaml` — residuo Firebase legacy
- Componentes huerfanos: `src/components/user-menu-modal`, `src/components/top-nav`
- Migration huerfana: `src/db/migrations/0003_medieros_tipo_propiedad.sql` (no en journal)
- `tailwind.config.ts` (Tailwind v4 usa `@theme` en globals.css)
- Env vars Firebase residuales: `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- NO tocar: `artifact-renderer` (lo importa `artifact-mapper`, dead code transitivo intencional)

## HOW — Protocolo de verificacion

Antes de reportar "hecho":

1. Toque UI -> puppeteer screenshot. No describir como deberia verse.
2. Toque servidor -> curl o logs reales. No decir "parece correcto".
3. Bug diagnosis -> citar [archivo:linea] con evidencia. Sin cita = hipotesis invalida.
4. Instruccion directa -> ejecutarla PRIMERO, antes de cualquier otra cosa.
5. El usuario confirmo X como verificado -> aceptarlo. No re-hipotetizar sobre X.

PROHIBIDO: "recarga el browser", "verifica tu", "deberia funcionar", "parece correcto".

Verificacion = `npm run typecheck`. Nada mas.
