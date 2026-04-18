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
- Modelo: `google/gemma-4-31b-it` via OpenRouter (`OPENROUTER_API_KEY`) — PROHIBIDO CAMBIAR SIN APROBACION DE CESAR
- Endpoint: `app/api/chat/route.ts` — SSE streaming, OpenAI-compatible SDK apuntando a OpenRouter
- Tools de lectura (9): `query_animales`, `query_pesajes`, `query_partos`, `query_indices_reproductivos`, `query_toros`, `query_historial_animal`, `query_feedlot`, y 2 aliases adicionales — ver `src/lib/claude.ts`
- Tools de escritura (2): `registrar_pesaje`, `registrar_parto`
- Schema de tools: definido con Google AI SDK (@google/genai), convertido a formato OpenAI function calling por `toOpenAITools()` en `src/lib/claude.ts`
- `ejecutarTool()` en `src/lib/claude.ts` valida `predio_id` contra `prediosPermitidos` del usuario
- Tools de escritura requieren `rolRank >= 1` (operador)
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

- Deploy: asumir docker-compose + git pull + restart — flujo exacto a confirmar con Cesar
- DB: ubicacion a confirmar con Cesar (VPS local o Cloud SQL restante)
- Secrets: probablemente en .env del VPS — verificar con Cesar. NO commitear secrets al repo
- Staging: no existe aun — hoy solo existe prod (Hostinger VPS) y local
- `apphosting.yaml` en el repo: RESIDUO LEGACY — otro agente lo elimina

**LEGACY GCP (residual — no usar)**
- Firebase project `smartcow-c22fb`, Cloud SQL `smartcow-492119`, Cloud Run `us-central1` — todo migrado a Hostinger
- Secrets en GCP Secret Manager: `database-url`, `openrouter-api-key`, etc. — verificar si aun activos con Cesar
- `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` en env: residuo de Firebase Admin — ya no se usan

**Env vars relevantes**
- `DATABASE_URL` -> PostgreSQL connection string (ubicacion a confirmar con Cesar)
- `NEXTAUTH_SECRET` / `AUTH_SECRET` -> Secreto JWT para NextAuth + mobile tokens
- `GOOGLE_API_KEY` -> Google AI SDK (Gemini, para tool declarations en claude.ts)
- `OPENROUTER_API_KEY` -> OpenRouter (modelo gemma-4-31b-it, chat principal)

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
