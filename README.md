# smartcow_prod

Entorno de produccion — SmartCow

## Stack

- Runtime: Node.js / TypeScript
- Framework: Next.js (App Router)
- DB: PostgreSQL (Supabase)
- Auth: Supabase Auth
- Deploy: Vercel (production)

## Arquitectura

- `/app` — App Router pages y layouts
- `/components` — UI components
- `/lib` — helpers, db client, auth
- `/actions` — Server Actions
- `/types` — tipos compartidos

## Ramas

- `main` — rama de produccion (protegida)
- Solo merge via PR aprobado desde `smartcow_dev`

## Branch Protection (main)

- Require PR review antes de merge
- Require status checks: typecheck + tests
- No force push permitido
