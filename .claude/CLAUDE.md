## ZONAS CONGELADAS — NO TOCAR SIN AUTORIZACIÓN EXPLÍCITA DE CESAR

- `app/login/page.tsx` — UI diseñada por AG (commit 7913929). NUNCA modificar layout, estilos ni estructura visual. Solo se puede tocar la lógica de auth interna (handleCredentialsSignIn, handleGoogleSignIn). Cualquier cambio visual requiere autorización explícita.

---

## WHAT — Stack y estructura

- Next.js 16 (App Router), React 19, TypeScript strict
- PostgreSQL + **Drizzle ORM** (`drizzle-orm` + `drizzle-kit`) — NO raw queries
- **NextAuth v5** (JWT strategy, cookie `__session`, 8h) — `auth.config.ts`
- OpenRouter API (modelo `google/gemma-4-31b-it`) — chat ganadero SSE
- TailwindCSS v4, Radix UI, Recharts, Framer Motion
- Firebase App Hosting (Cloud Run Gen1, us-central1) — deploy via CI push a `main`

## WHY — Reglas no deducibles del código

**ORM y DB**
- ORM: Drizzle. NUNCA usar `pg` directamente — todo pasa por `db` de `src/db/client.ts`
- Schema fuente de verdad: `src/db/schema/index.ts` (18 tablas)
- Tablas dominio: `animales`, `pesajes`, `partos`, `lotes`, `inseminaciones`, `ecografias`, `areteos`, `bajas`, `medieros`, `potreros`, `movimientos_potrero`
- Tablas base: `organizaciones`, `fundos`, `users`, `user_fundos`
- Migraciones: `npm run db:migrate` (drizzle-kit) — NO modificar SQL a mano
- Push solo en dev: `npm run db:push` — en prod siempre migrate

**Auth — NextAuth v5 (migrado desde Firebase, AUT-215)**
- `auth.config.ts` → NextAuth config: CredentialsProvider (bcryptjs) + GoogleProvider (OAuth)
- JWT strategy, cookie `__session` HttpOnly 8h (mismo nombre que Firebase para compat con middleware)
- `src/lib/auth.ts` → `auth()` wrapper: en dev retorna DEV_SESSION, en prod usa NextAuth session
- `src/lib/with-auth.ts` → `withAuth()` para server actions, `withAuthBearer()` para mobile REST
- `src/lib/mobile-jwt.ts` → JWT HS256 firmado con AUTH_SECRET para app Expo
- DEV_SESSION hardcodeado: orgId=1, predios=[11,7,9,8,10,6,5], rol=admin_org
- `src/lib/firebase/` ya no existe — Firebase Auth eliminado

**Auth — DEV BYPASS ACTIVO**
- `NODE_ENV === 'development'` → `auth()` retorna `DEV_SESSION` sin verificar cookie

**Auth — roles y withAuth()**
- Toda server action que toque datos DEBE usar `withAuth()`
- Jerarquía: `viewer < operador < veterinario < admin_fundo < admin_org < superadmin`
- Roles válidos en DB enum: `admin`, `operador`, `veterinario`, `viewer`, `admin_org`, `superadmin`
  ⚠️ `admin_fundo` NO existe en el enum de prod — usar `admin`

**Asistente ganadero (chat)**
- Modelo: `google/gemma-4-31b-it` via OpenRouter (`OPENROUTER_API_KEY`) — ⚠️ PROHIBIDO CAMBIAR SIN APROBACIÓN DE CÉSAR
- Endpoint: `app/api/chat/route.ts` — SSE streaming, OpenAI-compatible SDK apuntando a OpenRouter
- Tools disponibles: `query_animales`, `query_pesajes`, `query_partos`, `query_indices_reproductivos`, `registrar_pesaje`, `registrar_parto`
- `ejecutarTool()` en `src/lib/claude.ts` valida `predio_id` contra `prediosPermitidos` del usuario
- Tools de escritura (`registrar_*`) requieren `rolRank >= 1` (operador)
- EID = tag electrónico RFID | DIIO = identificador visual del arete — no intercambiar
- Pesos en kg | Fechas en YYYY-MM-DD
- Componentes chat: `src/components/chat/chat-panel.tsx`, `chat-sidebar.tsx`, `message-renderer.tsx`
- UI input: `src/components/ui/ai-prompt-box.tsx` — sin sufijos de versión

**Módulos**
- Feature flags por org: `feedlot`, `crianza`, etc. — stored en `organizaciones.modulos` (JSONB)
- Verificar con `withAuth({ modulo: 'feedlot' })` antes de exponer funcionalidad

**Infra GCP — FROZEN ZONE**
- Firebase project (App Hosting + Auth): `smartcow-c22fb` (sender: 588259089189)
- Cloud SQL project: `smartcow-492119`, instancia: `smartcow-492119:southamerica-west1:smartcow-db`
- Cloud Run service: `smartcow`, region `us-central1`, SA: `firebase-app-hosting-compute@smartcow-c22fb.iam.gserviceaccount.com`
- DB password: en secret `database-url` v3 (`projects/smartcow-c22fb/secrets/database-url`)
- DB IP pública: `34.176.238.2` — Cloud SQL tiene `0.0.0.0/0` autorizado (Cloud Run no tiene IP fija)
- App Hosting NO soporta `cloudSqlInstances` en apphosting.yaml — campo ignorado
- Secrets en GCP Secret Manager proyecto `smartcow-c22fb`:
  `database-url`, `openrouter-api-key`, `agroapp-user`, `agroapp-password`,
  `firebase-client-email`, `firebase-private-key`, `sentry-dsn-web`
- Firebase client vars públicas en `apphosting.yaml` (no en secrets)

**Env vars**
- `DATABASE_URL` → IP directa: `postgresql://postgres:PASS@34.176.238.2:5432/smartcow`
- `NEXTAUTH_SECRET` / `AUTH_SECRET` → Secreto JWT para NextAuth + mobile tokens
- `GOOGLE_API_KEY` → Google AI SDK (Gemini, para tool declarations en claude.ts)
- `OPENROUTER_API_KEY` → OpenRouter (modelo gemma-4-31b-it, chat principal)
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` → `smartcow-c22fb`
- `GCP_PROJECT_ID` → `smartcow-c22fb`
- Ver `apphosting.yaml` para estado completo de vars en prod

**AgroApp**
- API externa: `http://agroapp.cl:8080/AgroAppWebV18/`
- Credenciales: `AGROAPP_USER=jferrada`, `AGROAPP_PASSWORD` pendiente en GCP
- Integración en `src/agroapp/`

**Frontend**
- Tailwind v4: colores en `@theme` dentro de `globals.css`. `tailwind.config.ts` es dead code
- Radix UI para primitivos accesibles — no reinventar con divs

## HOW — Protocolo de verificación

Antes de reportar "hecho":

1. Toqué UI → puppeteer screenshot. No describir cómo debería verse.
2. Toqué servidor → curl o logs reales. No decir "parece correcto".
3. Bug diagnosis → citar [archivo:línea] con evidencia. Sin cita = hipótesis inválida.
4. Instrucción directa → ejecutarla PRIMERO, antes de cualquier otra cosa.
5. El usuario confirmó X como verificado → aceptarlo. No re-hipotetizar sobre X.

PROHIBIDO: "recarga el browser", "verifica tú", "debería funcionar", "parece correcto".

Verificación = `npm run typecheck`. Nada más.

## Comandos

```bash
npm run dev          # Dev server (puerto 3003 por convención)
npm run build        # Production build
npm run typecheck    # TypeScript check — debe pasar antes de reportar done
npm run db:generate  # Generar migration desde schema
npm run db:migrate   # Aplicar migrations
npm run db:push      # Push schema directo (solo dev)
npm run db:studio    # Drizzle Studio UI
```

Deploy: SOLO via CI/CD (`.github/`). NO manual.
