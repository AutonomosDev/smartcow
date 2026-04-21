# Langfuse v3 Self-Hosted — Setup en VPS (AUT-278)

Stack distribuido: langfuse-web + langfuse-worker + clickhouse + minio + redis-langfuse.
VPS: 2.24.204.73 (smartcow-vps). Ref oficial: https://github.com/langfuse/langfuse/blob/main/docker-compose.yml

## Arquitectura v3

```
langfuse-web    → UI/API (puerto interno 3000, nginx proxy)
langfuse-worker → procesamiento async de eventos
clickhouse      → backend de traces/analítica
minio           → event sourcing + media (S3-compatible)
redis-langfuse  → queue + cache (dedicado, con password)
db (postgres)   → metadata (DB langfuse separada de smartcow)
```

> v2 era monolítico (`langfuse/langfuse:3` = web only).
> v3 requiere worker separado y ClickHouse + MinIO obligatorios.

---

## Pre-requisitos

- SSH access: `ssh smartcow-vps`
- Repo clonado en `/var/www/smartcow`
- Docker Compose funcionando (`docker compose ps` sin errores)

---

## 1. DNS (GoDaddy)

Crear A record:

```
Nombre: langfuse
Tipo:   A
Valor:  2.24.204.73
TTL:    600
```

Verificar: `dig langfuse.smartcow.cl +short`

---

## 2. Crear base de datos Langfuse en PostgreSQL

```bash
ssh smartcow-vps
cd /var/www/smartcow
docker compose exec db psql -U smartcow -c "CREATE DATABASE langfuse;"
```

---

## 3. Generar secrets y agregar env vars al VPS .env

```bash
ssh smartcow-vps
cd /var/www/smartcow
```

Agregar al final de `/var/www/smartcow/.env`:

```bash
# ── Langfuse v3 — service config ──────────────────────────────
LANGFUSE_DATABASE_URL=postgresql://smartcow:TU_POSTGRES_PASSWORD@db:5432/langfuse
LANGFUSE_NEXTAUTH_URL=https://langfuse.smartcow.cl
LANGFUSE_NEXTAUTH_SECRET=$(openssl rand -base64 32)
LANGFUSE_SALT=$(openssl rand -base64 32)
LANGFUSE_ENCRYPTION_KEY=$(openssl rand -hex 32)

# ── ClickHouse ─────────────────────────────────────────────────
CLICKHOUSE_USER=clickhouse
CLICKHOUSE_PASSWORD=$(openssl rand -base64 20)
CLICKHOUSE_URL=http://clickhouse:8123
CLICKHOUSE_MIGRATION_URL=clickhouse://clickhouse:9000
CLICKHOUSE_CLUSTER_ENABLED=false

# ── MinIO (S3-compatible) ──────────────────────────────────────
MINIO_ROOT_USER=minio
MINIO_ROOT_PASSWORD=$(openssl rand -base64 20)
LANGFUSE_S3_EVENT_UPLOAD_BUCKET=langfuse
LANGFUSE_S3_EVENT_UPLOAD_REGION=us-east-1
LANGFUSE_S3_EVENT_UPLOAD_ACCESS_KEY_ID=minio
LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY=MISMO_QUE_MINIO_ROOT_PASSWORD
LANGFUSE_S3_EVENT_UPLOAD_ENDPOINT=http://minio:9000
LANGFUSE_S3_EVENT_UPLOAD_FORCE_PATH_STYLE=true
LANGFUSE_S3_MEDIA_UPLOAD_BUCKET=langfuse
LANGFUSE_S3_MEDIA_UPLOAD_REGION=us-east-1
LANGFUSE_S3_MEDIA_UPLOAD_ACCESS_KEY_ID=minio
LANGFUSE_S3_MEDIA_UPLOAD_SECRET_ACCESS_KEY=MISMO_QUE_MINIO_ROOT_PASSWORD
LANGFUSE_S3_MEDIA_UPLOAD_ENDPOINT=http://minio:9000
LANGFUSE_S3_MEDIA_UPLOAD_FORCE_PATH_STYLE=true

# ── Redis dedicado Langfuse ─────────────────────────────────────
LANGFUSE_REDIS_AUTH=$(openssl rand -base64 20)
```

> Nota: `LANGFUSE_S3_*_SECRET_ACCESS_KEY` debe ser igual a `MINIO_ROOT_PASSWORD`.
> Ejecutar cada `$(openssl rand ...)` por separado y pegar el valor literal.

---

## 4. Deploy — levantar stack Langfuse v3

```bash
ssh smartcow-vps
cd /var/www/smartcow

# Traer imagen nuevas
docker compose pull langfuse-web langfuse-worker clickhouse minio redis-langfuse

# Levantar en orden (depends_on se encarga del orden real)
docker compose up -d clickhouse minio redis-langfuse
# Esperar ~15s que clickhouse y minio pasen healthcheck
docker compose up -d langfuse-web langfuse-worker
```

Verificar healthchecks:

```bash
docker compose ps
docker compose logs langfuse-web --tail=50
docker compose logs langfuse-worker --tail=50
docker compose logs clickhouse --tail=20
```

Langfuse-web corre sus propias migrations al iniciar. Esperar ~90s hasta que el healthcheck pase (`/api/public/health`).

---

## 5. Configurar nginx como reverse proxy

El VPS usa nginx en docker compose. Actualizar `nginx.conf` para apuntar a `langfuse-web:3000`:

```nginx
server {
    listen 443 ssl;
    server_name langfuse.smartcow.cl;

    ssl_certificate     /etc/letsencrypt/live/smartcow.cl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smartcow.cl/privkey.pem;

    location / {
        proxy_pass http://langfuse-web:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name langfuse.smartcow.cl;
    return 301 https://$host$request_uri;
}
```

Recargar nginx:

```bash
docker compose exec nginx nginx -s reload
```

> Si el certificado SSL es wildcard `*.smartcow.cl`, ya cubre `langfuse.smartcow.cl`.
> Si no: `certbot certonly --nginx -d langfuse.smartcow.cl`

---

## 6. Crear usuario admin en Langfuse

Abrir `https://langfuse.smartcow.cl` en el browser.

Primer usuario creado = admin automáticamente:
- Email: cesar@autonomos.dev
- Password: elegir uno seguro

---

## 7. Obtener API Keys de Langfuse

En `https://langfuse.smartcow.cl`:
1. Settings → API Keys → Create new API key
2. Copiar `Secret Key` y `Public Key`

---

## 8. Agregar keys a la app en VPS .env

```bash
# En /var/www/smartcow/.env — ya debería existir de AUT-272, solo actualizar valores:
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_HOST=http://langfuse-web:3000
```

---

## 9. Reiniciar la app

```bash
docker compose restart app
```

---

## Verificación

- `https://langfuse.smartcow.cl` → UI funcionando
- Hacer una consulta en SmartCow chat
- En Langfuse → Traces → debe aparecer trace `chat.turn` con spans: `pickModel`, `cache_lookup`, `anthropic_call`, `tool:*`, `sse_emit`

---

## Troubleshooting

**`Error: CLICKHOUSE_URL is not configured`**
- Verificar que `CLICKHOUSE_URL` está en `/var/www/smartcow/.env`
- `docker compose exec langfuse-web env | grep CLICKHOUSE`

**Langfuse-web no arranca:**
```bash
docker compose logs langfuse-web --tail=100
```
Causas comunes: ClickHouse no disponible aún (esperar healthcheck), DB `langfuse` no existe, secrets vacíos.

**Langfuse-worker no procesa eventos:**
```bash
docker compose logs langfuse-worker --tail=100
```
Causa común: Redis auth incorrecta (`LANGFUSE_REDIS_AUTH` no coincide con el `--requirepass` del contenedor).

**MinIO bucket error:**
```bash
docker compose logs minio --tail=30
```
El entrypoint crea `/data/langfuse` automáticamente. Si falla, entrar al contenedor y crear manualmente.

**Traces no llegan desde la app:**
- Verificar `LANGFUSE_SECRET_KEY`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_HOST=http://langfuse-web:3000` en app .env
- `docker compose logs app | grep langfuse`

**Migración desde v2 (monolítico):**
Si había un contenedor `langfuse` corriendo (v2), hacer:
```bash
docker compose stop langfuse  # si aún existe
docker compose rm langfuse
docker compose up -d langfuse-web langfuse-worker clickhouse minio redis-langfuse
```
La DB postgres ya tiene los datos de v2. ClickHouse empezará vacío (traces históricos no migran — es esperado).
