# Langfuse Self-Hosted — Setup en VPS (AUT-272)

Pasos para Cesar al hacer deploy del servicio Langfuse en Hostinger VPS (2.24.204.73).

## Pre-requisitos

- SSH access: `ssh smartcow-vps`
- Repo clonado en `/var/www/smartcow`
- Docker Compose funcionando (`docker compose ps` sin errores)

---

## 1. DNS (GoDaddy)

Crear A record en GoDaddy:

```
Nombre: langfuse
Tipo:   A
Valor:  2.24.204.73
TTL:    600
```

Verificar propagación: `dig langfuse.smartcow.cl +short`

---

## 2. Crear base de datos Langfuse en PostgreSQL

```bash
ssh smartcow-vps
cd /var/www/smartcow
docker compose exec db psql -U smartcow -c "CREATE DATABASE langfuse;"
```

---

## 3. Agregar env vars al VPS .env

Editar `/var/www/smartcow/.env` y agregar al final:

```bash
# Langfuse — service config
LANGFUSE_DATABASE_URL=postgresql://smartcow:TU_POSTGRES_PASSWORD@db:5432/langfuse
LANGFUSE_NEXTAUTH_SECRET=$(openssl rand -base64 32)
LANGFUSE_SALT=$(openssl rand -base64 32)
LANGFUSE_NEXTAUTH_URL=https://langfuse.smartcow.cl
```

Generar los valores con `openssl rand -base64 32` para cada secret.

---

## 4. Levantar el servicio Langfuse

```bash
docker compose up -d langfuse
```

Verificar que arrancó:

```bash
docker compose ps langfuse
docker compose logs langfuse --tail=50
```

Langfuse corre sus propias migrations al iniciar. Esperar ~60s hasta que el healthcheck pase.

---

## 5. Configurar nginx como reverse proxy

El VPS usa nginx (no Caddy). Agregar un server block al `nginx.conf`:

```nginx
server {
    listen 443 ssl;
    server_name langfuse.smartcow.cl;

    ssl_certificate     /etc/letsencrypt/live/smartcow.cl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smartcow.cl/privkey.pem;

    location / {
        proxy_pass http://langfuse:3000;
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

Luego recargar nginx:

```bash
docker compose exec nginx nginx -s reload
```

> Si el certificado SSL es wildcard `*.smartcow.cl`, ya cubre `langfuse.smartcow.cl`.
> Si no, obtener cert con: `certbot certonly --nginx -d langfuse.smartcow.cl`

---

## 6. Crear usuario admin en Langfuse

Abrir `https://langfuse.smartcow.cl` en el browser.

Crear cuenta admin (primer usuario = admin automáticamente):
- Email: cesar@autonomos.dev
- Password: elegir uno seguro

---

## 7. Obtener API Keys de Langfuse

En `https://langfuse.smartcow.cl`:
1. Settings → API Keys → Create new API key
2. Copiar `Secret Key` y `Public Key`

---

## 8. Agregar keys a la app en VPS .env

Agregar en `/var/www/smartcow/.env`:

```bash
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_HOST=http://langfuse:3000
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

**Langfuse no arranca:**
```bash
docker compose logs langfuse --tail=100
```
Causas comunes: `langfuse` DB no existe, env vars faltantes.

**Traces no llegan:**
- Verificar `LANGFUSE_SECRET_KEY` y `LANGFUSE_PUBLIC_KEY` en app .env
- Verificar `LANGFUSE_HOST=http://langfuse:3000` (red interna docker)
- `docker compose logs app | grep langfuse`

**DB connection error en Langfuse:**
- Verificar `LANGFUSE_DATABASE_URL` usa `@db:5432` (nombre del servicio docker, no localhost)
