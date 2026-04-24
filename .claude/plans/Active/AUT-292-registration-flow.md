# AUT-292 — User Registration Flow

**Estado**: Plan aprobado 2026-04-22 · Resend verified · listo para Russell
**Size**: M/L (6-8h). Primer chunk (a) signup+verify email ~3h dispatcheado a Russell.
**Parent context**: Complemento de AUT-113 (Google Sign-In), sobre base auth de AUT-215 (NextAuth v5)
**Linear**: https://linear.app/autonomos-lab/issue/AUT-292

## Objetivo

Self-service signup web con trial auto-creado por usuario y verificación email. Un formulario corto (email + password + nombre) crea una nueva organización trial + usuario admin_org + dispara email de verificación. Onboarding wizard post-verify captura datos de operación (región, tamaño masa, módulos feedlot/crianza). Google SSO path separado: auto-create user + org sin verify. Scope acotado al registro — el onboarding es skippable y no bloquea uso.

## Decisiones tomadas

- Verificación: solo email (no SMS, no captcha en MVP)
- Rate-limit: Redis key `signup:ip:{ip}`, 5/hora · 20/día, response 429 con retry-after
- Flujo: 2 pasos (signup con verify → onboarding wizard post-login)
- Org model: cada signup credentials crea una organización nueva (trial) con el user como `admin_org`. NO se mete a org 99 (esa es demo Google SSO)
- Google SSO: callback auto-crea user + org nuevo (skip verify) y redirige directo al wizard. Coordinar con AUT-113 abierto.
- bcrypt rounds: 10 (consistente con auth.config.ts actual)
- verify_token: 32 bytes `crypto.randomBytes().toString('hex')`, TTL 24h, single-use (borrar o marcar usado tras verify)
- Sesión: solo post-verify. No auto-login tras signup.
- UI: `/register` y `/onboarding` seguir design system del `/login` (FROZEN ZONE) sin modificarlo

## Decisiones finales
- Email provider: **Resend** (2026-04-22)
  - Free tier 3k/mes, 100/día
  - Sender: noreply@smartcow.cl (requiere SPF+DKIM+DMARC)
  - Migration a SMTP posible futuro (solo cambia transport)

## Arquitectura

### Paso 1 — Signup

**UI**: `app/register/page.tsx` — form con email / password / nombre. Link "ya tienes cuenta → /login".

**Endpoint**: `POST /api/auth/register`

```
1. rate-limit check (signup:ip:{ip})
2. validar body (zod: email formato, password min 8, nombre no vacío)
3. SELECT users WHERE email = ? → si existe, 409 "email ya registrado"
4. bcrypt.hash(password, 10)
5. transacción:
   a. INSERT organizaciones (nombre='Trial {nombre}', plan='free', usage_cap_usd='5.00', modulos={})
      → returning id
   b. INSERT users (org_id=newOrgId, email, password_hash, nombre,
                    rol='admin_org', verified=false, verify_token,
                    verify_token_expires_at=now+24h)
      → returning id
   c. (NO insert a user_predios — admin_org ve todos los predios de su org sin registro explícito,
       per src/db/schema/users.ts:42 y auth.config.ts:51)
6. sendVerifyEmail(email, verify_token)
7. response 200 { message: 'revisa tu email' }
8. NO setear cookie __session
```

**Nota**: el ticket dice `user_fundos` pero el repo usa `user_predios`. Y admin_org no lo requiere (ver auth.config.ts:51-60). Skip ese INSERT.

### Paso 1.5 — Verify

**Endpoint**: `GET /api/auth/verify?token=xxx`

```
1. SELECT users WHERE verify_token = ? AND verify_token_expires_at > now()
2. si no match → redirect /login?error=token-invalido
3. UPDATE users SET verified=true, verify_token=null, verify_token_expires_at=null
4. redirect /login?flash=email-verificado
```

**Endpoint resend**: `POST /api/auth/resend` — rate-limited (`resend:ip:{ip}` 3/hora), regenera verify_token y reenvía.

**Página**: `app/verify/page.tsx` — solo fallback UI si el usuario llega sin token (mensaje "revisa tu email, o reenviar"). El trabajo real lo hace el route handler.

### Paso 2 — Onboarding Wizard

**UI**: `app/onboarding/page.tsx` — multi-step en single page (no routing por step), skippable. Se muestra al primer login si `organizaciones.config.onboarding_complete !== true`.

| Step | Campo | Tabla destino | Columna |
|------|-------|---------------|---------|
| 1 | Nombre fundo/organización (requerido) | `organizaciones` | `nombre` (UPDATE) |
| 2 | Tipo operación: Crianza / Feedlot / Mixto (requerido) | `organizaciones` | `modulos` (JSONB merge: `{feedlot: bool, crianza: bool}`) |
| 3 | Región Chile (requerido, select RM/O'Higgins/Maule/Biobío/Los Lagos/Los Ríos/etc) | `organizaciones` | `region` (NEW) |
| 4 | Tamaño masa `<100` / `100-500` / `500-2000` / `>2000` (requerido) | `organizaciones` | `tamano_masa` (NEW, varchar enum) |
| 5 | Teléfono `+56 9 XXXX XXXX` (opcional) | `users` | `telefono` (NEW) |
| 6 | RUT (opcional, requerido al pagar) | `organizaciones` | `rut` (YA EXISTE) |

**Endpoint**: `POST /api/onboarding` — withAuth rolMinimo=admin_org, UPDATE orgs + users, set `organizaciones.config.onboarding_complete=true`.

Skip button: marca `onboarding_complete=true` sin UPDATE de campos.

### Google SSO Path

Edit `auth.config.ts` callbacks.jwt cuando `account.provider === 'google'`:

```
si user existe por email → loadSmartCowUser → login normal
si no existe:
  crear org nueva (plan='free', modulos={}, nombre='Trial ' + nombre)
  INSERT users (verified=true, rol='admin_org', org_id=newOrgId, password_hash=null)
  NO crear trial en org 99 (ese path sigue para demo, pero signup real crea org propio)
  token.needs_onboarding = true → middleware/post-login redirige /onboarding
```

**Conflicto con AUT-289 / auth.config.ts actual**: hoy `createTrialUser()` mete Google SSO en org 99 con rol='trial'. Post AUT-292 la lógica se bifurca: si es cuenta demo (whitelist de emails) → org 99; si es real → nueva org. Decisión de producto: ¿todo Google SSO es trial 48h o real signup? **Coordinar con Cesar + AUT-113**.

### Rate-limit

- Redis client: `REDIS_URL` (ya en env, usado para rate-limit chat)
- Keys:
  - `signup:ip:{ip}:hour` — INCR + EXPIRE 3600, limit 5
  - `signup:ip:{ip}:day` — INCR + EXPIRE 86400, limit 20
  - `resend:ip:{ip}:hour` — INCR + EXPIRE 3600, limit 3
- 429 response con header `Retry-After: {seconds}`
- IP extraction: `x-forwarded-for` primero (nginx en VPS), fallback `req.headers.get('x-real-ip')`

## Archivos a crear

| Path | Propósito |
|------|-----------|
| `app/register/page.tsx` | Form UI signup (email, password, nombre) |
| `app/verify/page.tsx` | Landing si llegan sin token (fallback UI + reenviar) |
| `app/onboarding/page.tsx` | Wizard multi-step single-page |
| `app/api/auth/register/route.ts` | POST signup handler |
| `app/api/auth/verify/route.ts` | GET verify handler |
| `app/api/auth/resend/route.ts` | POST resend verify email |
| `app/api/onboarding/route.ts` | POST guardar wizard data |
| `src/lib/auth/register.ts` | Core logic signup (validación + transacción + token gen) |
| `src/lib/auth/email.ts` | Abstracción envío email (Resend SDK o SMTP), con stub dev |
| `src/lib/auth/rate-limit-signup.ts` | Redis limiter (signup + resend) |

## Archivos a editar

| Path | Cambio |
|------|--------|
| `src/db/schema/users.ts` | + `verified: boolean`, + `verifyToken: varchar(64)`, + `verifyTokenExpiresAt: timestamp`, + `telefono: varchar(32)` |
| `src/db/schema/organizaciones.ts` | + `region: varchar(64)`, + `tamanoMasa: varchar(16)` (enum-like via zod en app layer) |
| `auth.config.ts` | Google callback: bifurcar auto-create (org nueva vs org 99 demo). Credentials authorize: rechazar si `!user.verified` |
| `middleware.ts` | Opcional: si `token.needs_onboarding === true` y path !== `/onboarding` → redirect /onboarding |

## Migration

Generar con `npm run db:generate` tras editar schemas. Va a producir un archivo `src/db/migrations/NNNN_aut_292_registration.sql`:

```sql
ALTER TABLE users
  ADD COLUMN verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN verify_token VARCHAR(64),
  ADD COLUMN verify_token_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN telefono VARCHAR(32);

ALTER TABLE organizaciones
  ADD COLUMN region VARCHAR(64),
  ADD COLUMN tamano_masa VARCHAR(16);

-- Usuarios existentes pre-AUT-292: marcarlos verified=true (ya están en el sistema,
-- la verify policy aplica solo a signups nuevos).
UPDATE users SET verified = true WHERE creado_en < NOW();
```

**Importante**: correr el UPDATE retroactivo en la misma migration para no lockear a usuarios legacy fuera. Verificar con Cesar que está ok.

**Aplicar en prod**: `./deploy.sh --migrate` (ver `.claude/references/config/infra-and-security.yaml`).

## Setup Resend — COMPLETADO 2026-04-22
1. ✓ Cuenta Resend creada con autonomos.dev@gmail.com
2. ✓ Domain `smartcow.cl` agregado (domain_id 020eabe5-...)
3. ✓ DNS records propagados vía GoDaddy OAuth (descubrimiento: smartcow.cl está en GoDaddy, no Hostinger — NS ns53/54.domaincontrol.com)
4. ✓ Records en GoDaddy DNS: resend._domainkey (DKIM TXT), send (SPF TXT), send (MX 10 feedback-smtp.sa-east-1.amazonses.com)
5. ✓ Domain status: Verified (test send `id 4d2c7ae6-...` desde noreply@smartcow.cl OK)
6. ✓ API key `RESEND_API_KEY` generada (scope: restricted send-only)
7. ✓ Guardada en /var/www/smartcow/.env del VPS (perms 600 root, backup previo)
8. ✓ Passthrough en docker-compose.yml app service (commit pendiente)
9. ✓ Registrada en infra-and-security.yaml env_vars.required + external_services.resend

**Resultado**: dominio verificado 2026-04-22, sender `noreply@smartcow.cl` operativo. Russell puede usar `process.env.RESEND_API_KEY` directamente — no stub necesario.

## Criterios de aceptación

- [ ] Signup crea user + org trial + envía verify email
- [ ] Email único enforced (DB unique constraint ya existe + pre-check explícito para mensaje UX)
- [ ] Password bcrypt 10 rounds (consistente con auth.config.ts)
- [ ] Verify link funciona, token expira 24h, single-use
- [ ] Rate-limit Redis 5/h · 20/d por IP, 429 con Retry-After
- [ ] Google SSO crea user + org nuevo si no existe (path separado del demo org 99)
- [ ] Onboarding wizard guarda datos en `organizaciones` + `users.telefono`
- [ ] Onboarding skippable — no bloquea uso de la app
- [ ] Credentials login rechaza si `verified=false` (mensaje "verifica tu email")
- [ ] `npm run typecheck` verde
- [ ] UI `/register` y `/onboarding` consistentes con `/login` sin tocar la FROZEN ZONE
- [ ] Migration aplicada sin romper usuarios legacy (UPDATE retroactivo a verified=true)

## Split sugerido para Russell

Si Cesar prefiere incrementos por PR:

- **a) signup + verify email** (~3h) — schemas, migration, `/register`, `/api/auth/register`, `/api/auth/verify`, `src/lib/auth/register.ts`, `email.ts` (con stub si no hay provider), gate en credentials login (`verified=false` → reject)
- **b) onboarding wizard** (~2h) — `/onboarding`, `/api/onboarding`, middleware redirect, schema adds (region, tamano_masa)
- **c) Google SSO auto-create** (~2h) — edit `auth.config.ts`, coordinar con AUT-113
- **d) rate-limit + hardening** (~1h) — `rate-limit-signup.ts`, integrar en register + resend, tests manuales con curl

Dependencias: (a) es base. (b), (c), (d) pueden ir en paralelo tras (a).

## Riesgos / notas

- **UI `/login` es FROZEN ZONE** (`src/components/login/*`, `app/login/page.tsx` — commit 7913929). `/register` y `/onboarding` deben replicar el design system sin alterar `/login`. Solo lógica interna de auth puede tocarse en login.
- **Google SSO auto-create** requiere coordinar con AUT-113 (rama `lf/aut-113` abierta). Actualmente `auth.config.ts:74-99` mete Google SSO en org 99 con rol=trial (AUT-289). Post AUT-292 bifurcar: demo (whitelist email o flag) → org 99, real signup → org nueva. Decisión producto pendiente con Cesar.
- **Email provider no elegido bloquea envío real** — stub con `console.log(verify_url)` en dev para desbloquear (a), (b). En prod requiere decisión.
- **Ticket dice `user_fundos`** — en el repo no existe esa tabla, es `user_predios`. Además admin_org no requiere registro en esa tabla (ver `auth.config.ts:51-60`). Skip ese INSERT.
- **Ticket dice agregar `rut` a organizaciones** — ya existe (`src/db/schema/organizaciones.ts:14`). No duplicar en migration.
- **RLS / withPredioContext**: como signup crea org nueva, primer login no tiene predios. Verificar que UI maneja `session.user.predios = []` sin romper (ya está cubierto en auth.config.ts pero probar).
- **Backup pre-migration**: aunque la migration es aditiva (solo ADD COLUMN + UPDATE), correr backup manual antes de aplicar en prod (backups automáticos son 03:15 UTC).
- **Sentry**: añadir breadcrumbs en `/api/auth/register` (registro exitoso, verify enviado, rate-limit hit) para triage.
