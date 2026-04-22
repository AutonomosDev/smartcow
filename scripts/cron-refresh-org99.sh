#!/usr/bin/env bash
# scripts/cron-refresh-org99.sh — AUT-290 Fase C.2
#
# Refresh nocturno org 99 (demo). Invalida cache + re-clona datos org 1 → 99.
# Diseñado para correr en el VPS via crontab a las 00:00 CLT.
#
# Crontab (hora del VPS, típicamente UTC):
#   # 00:00 CLT = 03:00 UTC (horario de invierno Chile UTC-3)
#   # En horario de verano (UTC-4), sería 04:00 UTC
#   0 3 * * * /var/www/smartcow/scripts/cron-refresh-org99.sh >> /var/log/smartcow-refresh.log 2>&1
#
# Requisitos en VPS:
#   - /var/www/smartcow debe ser el repo clonado
#   - docker compose corriendo (servicio "db" disponible)
#   - DATABASE_URL en /var/www/smartcow/.env

set -euo pipefail

REPO_DIR="/var/www/smartcow"
ENV_FILE="${REPO_DIR}/.env"

cd "$REPO_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[cron-refresh-org99] ERROR: $ENV_FILE no existe"
  exit 1
fi

# Cargar DATABASE_URL sin exportar todo el .env
DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d '=' -f 2- | tr -d '"')

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[cron-refresh-org99] ERROR: DATABASE_URL no definida"
  exit 1
fi

echo "[cron-refresh-org99] $(date -u +%Y-%m-%dT%H:%M:%SZ) iniciando refresh"

# Correr seed en container node:20-alpine con el repo montado.
# --network smartcow_default para alcanzar el servicio "db" por DNS.
docker run --rm \
  -v "${REPO_DIR}:/app" \
  -w /app \
  --network smartcow_default \
  -e "DATABASE_URL=${DATABASE_URL}" \
  node:20-alpine \
  sh -c 'npx --yes tsx scripts/seed-synthetic-dataset.ts --refresh'

echo "[cron-refresh-org99] $(date -u +%Y-%m-%dT%H:%M:%SZ) refresh OK"
