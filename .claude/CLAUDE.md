## ZONAS CONGELADAS — NO TOCAR SIN AUTORIZACIÓN EXPLÍCITA DE CESAR

- `app/login/page.tsx` — UI diseñada por AG (commit 7913929). NUNCA modificar layout, estilos ni estructura visual. Solo se puede tocar la lógica de auth interna (handleCredentialsSignIn, handleGoogleSignIn). Cualquier cambio visual requiere autorización explícita.

---

## WHAT — Stack y estructura

- Next.js 16 (App Router), React 19, TypeScript strict
- PostgreSQL + **Drizzle ORM** (`drizzle-orm` + `drizzle-kit`) — NO raw queries
- **Firebase Auth** (session cookie `__session`, NO NextAuth) — `src/lib/firebase/`
- OpenRouter API (modelo `google/gemma-3-27b-it`) — chat ganadero
- TailwindCSS v4, Radix UI, Recharts, Framer Motion
- Firebase App Hosting (Cloud Run Gen1, us-central1) — deploy via CI push a `main`

```
app/                    — App Router (layout, login, (protected)/*)
src/
  agroapp/             — Integración API externa AgroApp (JP Ferrada)
  components/          — UI components
  db/
    schema/index.ts    — 18 tablas Drizzle exportadas
    migrations/        — Drizzle Kit migrations
    client.ts          — db singleton
  etl/                 — Pipelines de importación datos
  lib/
    auth.config.ts     — NextAuth config (Edge-safe, sin bcrypt/pg)
    auth.ts            — NextAuth completo (Node runtime) + DEV mock
    claude.ts          — Cliente Anthropic + tools ganaderos + ejecutarTool()
    mobile-jwt.ts      — JWT para endpoints REST mobile
    modules.ts         — Feature flags de módulos por org
    queries/           — Drizzle queries reutilizables
    with-auth.ts       — withAuth() + withAuthBearer() guards
bin/smartcow           — CLI helper
```

## WHY — Reglas no deducibles del código

**ORM y DB**
- ORM: Drizzle. NUNCA usar `pg` directamente — todo pasa por `db` de `src/db/client.ts`
- Schema fuente de verdad: `src/db/schema/index.ts` (18 tablas)
- Tablas dominio: `animales`, `pesajes`, `partos`, `lotes`, `inseminaciones`, `ecografias`, `areteos`, `bajas`, `medieros`, `potreros`, `movimientos_potrero`
- Tablas base: `organizaciones`, `fundos`, `users`, `user_fundos`
- Migraciones: `npm run db:migrate` (drizzle-kit) — NO modificar SQL a mano
- Push solo en dev: `npm run db:push` — en prod siempre migrate

**Auth — Firebase session cookie (NO NextAuth)**
- `src/lib/firebase/client.ts` → Firebase Client SDK (browser) — `signInWithEmailAndPassword` / `signInWithPopup`
- `src/lib/firebase/admin.ts` → Firebase Admin SDK (server) — `applicationDefault()` en Cloud Run
- `app/api/auth/session/route.ts` → POST: recibe idToken → verifyIdToken → loadUserByFirebaseUid → createSessionCookie
- Cookie: `__session` HttpOnly, 8h, path=/
- `src/lib/auth.ts` → `auth()`: en dev retorna DEV_SESSION. En prod: verifySessionCookie → loadUserByFirebaseUid
- DEV_SESSION hardcodeado: orgId=1, predios=[11,7,9,8,10,6,5], rol=admin_org

**Auth — DEV BYPASS ACTIVO**
- `NODE_ENV === 'development'` → `auth()` retorna `DEV_SESSION` sin verificar cookie
- REVERTIR antes de deploy a staging/prod

**Auth — roles y withAuth()**
- Toda server action que toque datos DEBE usar `withAuth()`
- Jerarquía: `viewer < operador < veterinario < admin_fundo < admin_org < superadmin`
- Roles válidos en DB enum: `admin`, `operador`, `veterinario`, `viewer`, `admin_org`, `superadmin`
  ⚠️ `admin_fundo` NO existe en el enum de prod — usar `admin`

**Asistente ganadero (chat)**
- Modelo: `google/gemma-3-27b-it` via OpenRouter (`OPENROUTER_API_KEY`)
- Tools disponibles: `query_animales`, `query_pesajes`, `query_partos`, `query_indices_reproductivos`, `registrar_pesaje`, `registrar_parto`
- `ejecutarTool()` en `src/lib/claude.ts` valida `predio_id` contra `prediosPermitidos` del usuario
- Tools de escritura (`registrar_*`) requieren `rolRank >= 1` (operador)
- EID = tag electrónico RFID | DIIO = identificador visual del arete — no intercambiar
- Pesos en kg | Fechas en YYYY-MM-DD

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
- `OPENROUTER_API_KEY` → OpenRouter (modelo gemma-3-27b-it)
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
