# SmartCow

Plataforma ganadera — web (Next.js) + mobile (Expo) sobre PostgreSQL.

## Stack

- **Runtime**: Node.js / TypeScript strict
- **Web**: Next.js 16 (App Router), React 19, TailwindCSS v4, Radix UI
- **Mobile**: Expo ~54 / React Native 0.81 (New Architecture)
- **DB**: PostgreSQL + Drizzle ORM (self-hosted en VPS)
- **Auth**: NextAuth v5 (Credentials + Google SSO), JWT en cookie `__session`
- **Chat ganadero**: Anthropic SDK (`claude-sonnet-4-6`) — excepción trial org 99 vía Gemini (`gemini-3.1-flash-lite-preview`)
- **Observabilidad**: Langfuse self-hosted
- **Prod**: Hostinger VPS único (Docker Compose), detalle en `.claude/references/config/infra-and-security.yaml`

## Quickstart

```bash
npm install
npm run dev              # Web en :3003
npm run mobile:dev       # Web + Metro en :8081 concurrente
npm run typecheck        # Verificación
```

Deploy: `./deploy.sh` (requiere SSH alias `smartcow-vps`). `--migrate` para aplicar migrations.

## Estructura

- `app/` — App Router (pages, layouts, route handlers)
- `src/db/` — schema Drizzle, client, migrations
- `src/lib/` — auth, chat loops, router/budget, langfuse
- `src/components/` — UI (chat, dashboard, primitivos)
- `src/agroapp/`, `src/etl/` — integración y pipelines AgroApp / ODEPA
- `apps/mobile/` — app Expo

## Ramas

- `main` — producción (protegida, merge vía PR)
- `lf/<ticket>` — ramas de ejecución (Russell/agentes)

## Docs internas

Fuente de verdad para Claude Code: `CLAUDE.md` + `.claude/CLAUDE.md` + `.claude/references/config/*.yaml`.
