#!/usr/bin/env bash
# scripts/sync-staging-from-prod.sh — AUT-286
#
# Sincroniza DB staging desde snapshot de prod, anonimizando PII.
# Se corre en el VPS (donde viven ambos contenedores).
#
# Uso:
#   sudo bash scripts/sync-staging-from-prod.sh
#
# Asume:
#   - cwd = /var/www/smartcow
#   - docker-compose.yml (prod) y docker-compose.staging.yml levantados
#   - .env tiene POSTGRES_PASSWORD (prod) y POSTGRES_PASSWORD_STAGING
#
# Tiempo estimado: 2-5 min según tamaño DB.
# Cron sugerido: domingo 03:00 — `0 3 * * 0 /var/www/smartcow/scripts/sync-staging-from-prod.sh`

set -euo pipefail

cd "$(dirname "$0")/.."

# Cargar env
if [ -f .env ]; then
  # shellcheck disable=SC1091
  set -a; . .env; set +a
fi

: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD no está en .env}"
: "${POSTGRES_PASSWORD_STAGING:?POSTGRES_PASSWORD_STAGING no está en .env}"

DUMP_FILE="/tmp/smartcow-prod-$(date +%Y%m%d-%H%M%S).sql"
ANONYMIZE_SQL="scripts/anonymize-db.sql"

if [ ! -f "$ANONYMIZE_SQL" ]; then
  echo "❌ Missing $ANONYMIZE_SQL"
  exit 1
fi

echo "→ [1/5] Dump de prod → $DUMP_FILE"
docker compose exec -T db pg_dump -U smartcow --clean --if-exists smartcow > "$DUMP_FILE"
echo "   Dump: $(du -h "$DUMP_FILE" | cut -f1)"

echo "→ [2/5] Drop & recreate staging DB"
docker compose -f docker-compose.staging.yml exec -T db-staging psql -U smartcow -d postgres -c \
  "DROP DATABASE IF EXISTS smartcow;" > /dev/null
docker compose -f docker-compose.staging.yml exec -T db-staging psql -U smartcow -d postgres -c \
  "CREATE DATABASE smartcow OWNER smartcow;" > /dev/null

echo "→ [3/5] Restore en staging"
docker compose -f docker-compose.staging.yml exec -T db-staging \
  psql -U smartcow -d smartcow < "$DUMP_FILE" > /dev/null 2>&1 || true

echo "→ [4/5] Anonimizar PII"
docker compose -f docker-compose.staging.yml exec -T db-staging \
  psql -U smartcow -d smartcow < "$ANONYMIZE_SQL"

echo "→ [5/5] Cleanup dump"
rm -f "$DUMP_FILE"

echo "✓ Staging sincronizado desde prod — $(date)"
echo "  Validar: curl -sSo /dev/null -w '%{http_code}\n' https://staging.smartcow.cl/login"
