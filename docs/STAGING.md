# Staging — SmartCow

Staging corre en el **mismo VPS** que prod (Hostinger 2.24.204.73), no en un segundo VPS, para no duplicar costo.

## Arquitectura

```
┌────────────────── VPS 2.24.204.73 ─────────────────────┐
│                                                         │
│  nginx (80/443)                                         │
│   ├── smartcow.cl         → app:3000                    │
│   └── staging.smartcow.cl → app-staging:3000            │
│                                                         │
│  docker-compose.yml (prod)                              │
│   ├── app          (Next.js, :3000 interno)             │
│   ├── db           (Postgres 16)                        │
│   ├── redis                                             │
│   └── nginx                                             │
│                                                         │
│  docker-compose.staging.yml (staging, comparte db prod) │
│   ├── app-staging  (Next.js, :3001 host → :3000 int.)   │
│   └── redis-staging                                     │
│                                                         │
│  Postgres (en container db):                            │
│   ├── smartcow           (user smartcow, prod)          │
│   └── smartcow_staging   (user smartcow_stg, staging)   │
└─────────────────────────────────────────────────────────┘
```

## Bootstrap (una vez, en el VPS)

1. **DNS** — agregar en el registrador de smartcow.cl:
   ```
   A  staging.smartcow.cl  →  2.24.204.73
   ```
   Esperar propagación antes del paso 3.

2. **DB staging** — correr `scripts/init-staging-db.sql` contra el pg de prod:
   ```bash
   # reemplazar <PASSWORD_STAGING> en el SQL antes de correrlo
   docker exec -i smartcow-db-1 psql -U postgres < scripts/init-staging-db.sql
   ```

3. **Certificado SSL** — tras propagar DNS:
   ```bash
   certbot --nginx -d staging.smartcow.cl
   ```

4. **.env staging** — copiar `.env.staging.example` a `.env.staging` y rellenar:
   ```bash
   cp .env.staging.example .env.staging
   $EDITOR .env.staging
   ```

5. **Levantar staging**:
   ```bash
   git fetch && git checkout staging
   docker compose --env-file .env.staging -f docker-compose.staging.yml up -d --build
   ```

6. **Migraciones + seed**:
   ```bash
   DATABASE_URL=$DATABASE_URL_STAGING npm run db:migrate
   DATABASE_URL=$DATABASE_URL_STAGING npx tsx src/etl/seed-staging.ts
   ```
   Login: `admin@staging.smartcow.cl` / `staging123`

7. **Reload nginx** para tomar el nuevo server block:
   ```bash
   docker exec smartcow-nginx-1 nginx -s reload
   ```

## Flujo de trabajo

```
feature/<ticket>  →  staging  →  verify en staging.smartcow.cl  →  main (prod)
```

- Branch `staging` siempre deployable.
- Merges a `staging` se aplican al VPS con:
  ```bash
  cd /path/to/smartcow
  git fetch && git checkout staging && git pull
  docker compose --env-file .env.staging -f docker-compose.staging.yml up -d --build
  ```
- Cuando staging pasa verificación, PR `staging → main`.

## Seed

- `src/etl/seed-staging.ts` crea 1 org, 1 predio, 1 user admin, 3 animales. Idempotente: trunca y recrea.
- **Sin PII**: no copia datos de prod.
- Re-seed en cualquier momento:
  ```bash
  DATABASE_URL=$DATABASE_URL_STAGING npx tsx src/etl/seed-staging.ts
  ```

## Mobile

Perfil `preview` en [apps/mobile/eas.json](../apps/mobile/eas.json) ya apunta a `https://staging.smartcow.cl` — builds de preview consumen staging automáticamente.
