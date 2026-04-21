## ZONAS CONGELADAS — NO TOCAR SIN AUTORIZACION EXPLICITA DE CESAR

- `app/login/page.tsx` — UI disenada por AG (commit 7913929). NUNCA modificar layout, estilos ni estructura visual. Solo se puede tocar la logica de auth interna (handleCredentialsSignIn, handleGoogleSignIn). Cualquier cambio visual requiere autorizacion explicita.

---

## WHY — Reglas no deducibles del codigo

**ORM y DB**
- ORM: Drizzle. NUNCA usar `pg` directamente — todo pasa por `db` de `src/db/client.ts`
- Schema fuente de verdad: `src/db/schema/index.ts` (ver archivo — no hardcodear numero de tablas)
- Tablas dominio conocidas: `animales`, `pesajes`, `partos`, `lotes`, `inseminaciones`, `ecografias`, `areteos`, `bajas`, `medieros`, `potreros`, `movimientos_potrero`
- Tablas base: `organizaciones`, `fundos`, `users`, `user_fundos`
- Migraciones: `npm run db:migrate` (drizzle-kit) — NO modificar SQL a mano
- Push solo en dev: `npm run db:push` — en prod siempre migrate
- Migration 0003: solo `0003_users_password_hash` esta en el journal. `0003_medieros_tipo_propiedad.sql` es huerfano (pendiente limpieza por otro agente)

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
- Modelo: `claude-sonnet-4-6` via Anthropic SDK directo — PROHIBIDO CAMBIAR SIN APROBACION DE CESAR (migrado desde Gemma-4-31b/OpenRouter el 2026-04-20, AUT-261)
- Endpoint: `app/api/chat/route.ts` — SSE streaming nativo Anthropic
- Tool principal de lectura: `query_db` (generico, consulta cualquier tabla por nombre + filtros)
- Tools de escritura (2): `registrar_pesaje`, `registrar_parto`
- Schema de tools: declarado en formato Google AI SDK (`CATTLE_TOOLS` en `src/lib/claude.ts`), convertido a Anthropic por `toAnthropicTools()` en route.ts
- `ejecutarTool()` en `src/lib/claude.ts` valida `predio_id` contra `prediosPermitidos` del usuario
- Tools de escritura requieren `rolRank >= 1` (operador)
- Routing: `pickModel()` en `src/lib/router.ts` elige tier light/standard/heavy segun heuristica
- Budget: `checkBudget()` / `highestAllowedTier()` en `src/lib/budget.ts`
- Observabilidad: `src/lib/langfuse.ts` — Langfuse traces por request
- EID = tag electronico RFID | DIIO = identificador visual del arete — no intercambiar
- Pesos en kg | Fechas en YYYY-MM-DD
- Componentes chat: `src/components/chat/chat-panel.tsx`, `chat-sidebar.tsx`, `message-renderer.tsx`
- UI input: `src/components/ui/ai-prompt-box.tsx` — sin sufijos de version
- Componentes huerfanos pendientes de eliminar (otro agente): `user-menu-modal`, `top-nav`
- `artifact-renderer` NO se elimina — lo importa `artifact-mapper` (dead code transitivo, dejarlo)

**Modulos**
- Feature flags por org: `feedlot`, `crianza`, etc. — stored en `organizaciones.modulos` (JSONB)
- Verificar con `withAuth({ modulo: 'feedlot' })` antes de exponer funcionalidad

**Infra de produccion — Hostinger VPS**

| Campo | Valor |
|-------|-------|
| VPS ID | 1591599 |
| IP publica | 2.24.204.73 |
| Hostname | srv1591599.hstgr.cloud |
| PTR | smartcow.cl |
| Plan | KVM 2 (2 vCPU, 8 GB RAM, 100 GB) |
| Datacenter | 24 |
| OS | Ubuntu 24.04 con template Docker |
| Estado | running |

- Deploy oficial: `./deploy.sh` (solo código) o `./deploy.sh --migrate` (código + migrations)
  - Requiere alias SSH `smartcow-vps` apuntando a 2.24.204.73
  - /var/www/smartcow debe ser clone git de AutonomosDev/smartcow (setup one-time: ver deploy.sh)
  - El script hace: git pull → docker compose build app → docker compose up -d
  - `--migrate` usa el stage `migrate` del Dockerfile (drizzle-kit incluido)
- Migrations en prod: `docker compose run --rm migrate` (stage Dockerfile separado)
  - Si __drizzle_migrations desincronizado: `docker compose exec -T app npx tsx scripts/sync-drizzle-tracking.ts`
- DB: PostgreSQL en VPS local (docker compose postgres service), .env en /var/www/smartcow/.env
- Secrets: en /var/www/smartcow/.env del VPS — NO commitear al repo. Backup antes de cualquier rsync.
- Staging: no existe aun — hoy solo existe prod (Hostinger VPS) y local
- `apphosting.yaml` en el repo: RESIDUO LEGACY — otro agente lo elimina

**LEGACY GCP (residual — no usar)**
- Firebase project `smartcow-c22fb`, Cloud SQL `smartcow-492119`, Cloud Run `us-central1` — todo migrado a Hostinger
- Secrets en GCP Secret Manager: `database-url`, `openrouter-api-key`, etc. — verificar si aun activos con Cesar
- `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` en env: residuo de Firebase Admin — ya no se usan

**Env vars relevantes**
- `DATABASE_URL` -> PostgreSQL connection string
- `NEXTAUTH_SECRET` / `AUTH_SECRET` -> Secreto JWT para NextAuth + mobile tokens
- `ANTHROPIC_API_KEY` -> Anthropic SDK (chat ganadero, modelo claude-sonnet-4-6)
- `GOOGLE_API_KEY` -> Google AI SDK (solo para declarar CATTLE_TOOLS, no para inferencia)
- `TAVILY_API_KEY` -> Web search (Tavily, 100 req/mes tier gratis)
- `REDIS_URL` -> Rate limiting (redis://localhost:6379)
- `LANGFUSE_SECRET_KEY` / `LANGFUSE_PUBLIC_KEY` -> Observabilidad LLM
- `NEXT_PUBLIC_MAPBOX_TOKEN` -> Mapas frontend
- `AGROAPP_USER` / `AGROAPP_PASSWORD` -> API externa AgroApp
- `OPENROUTER_API_KEY` -> LEGACY — ya no se usa (ver AUT-261)

**AgroApp**
- API externa: `http://agroapp.cl:8080/AgroAppWebV18/`
- Credenciales: `AGROAPP_USER`, `AGROAPP_PASSWORD` — verificar con Cesar donde estan en prod
- Integracion en `src/agroapp/`, ETL en `src/etl/import-agroapp-full.ts`

**Frontend**
- Tailwind v4: colores en `@theme` dentro de `globals.css`. `tailwind.config.ts` es dead code
- Radix UI para primitivos accesibles — no reinventar con divs

## HOW — Protocolo de verificacion

Antes de reportar "hecho":

1. Toque UI -> puppeteer screenshot. No describir como deberia verse.
2. Toque servidor -> curl o logs reales. No decir "parece correcto".
3. Bug diagnosis -> citar [archivo:linea] con evidencia. Sin cita = hipotesis invalida.
4. Instruccion directa -> ejecutarla PRIMERO, antes de cualquier otra cosa.
5. El usuario confirmo X como verificado -> aceptarlo. No re-hipotetizar sobre X.

PROHIBIDO: "recarga el browser", "verifica tu", "deberia funcionar", "parece correcto".

Verificacion = `npm run typecheck`. Nada mas.

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
