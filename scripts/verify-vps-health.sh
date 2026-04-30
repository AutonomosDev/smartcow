#!/usr/bin/env bash
# verify-vps-health.sh
# Health check post-upgrade para VPS smartcow (Hostinger 2.24.204.73).
# Verifica:
#   1. nginx del HOST inactivo (debe estar disabled+masked)
#   2. container smartcow-nginx-1 running
#   3. los 3 dominios responden HTTPS 2xx/3xx
#
# Uso: bash scripts/verify-vps-health.sh
# Requiere: alias SSH `smartcow-vps` configurado en ~/.ssh/config
#
# Origen: SMCOW-1 (post-mortem 2026-04-30) + SMCOW-2 (docs fix).

set -euo pipefail

RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
NC=$'\033[0m'

fail() {
  echo "${RED}❌ $1${NC}" >&2
  exit 1
}

ok() {
  echo "${GREEN}✓${NC} $1"
}

warn() {
  echo "${YELLOW}⚠ $1${NC}"
}

echo "── VPS health check · smartcow ──"

# 1. nginx del host debe estar inactivo
echo
echo "1/3 nginx host status..."
HOST_STATE=$(ssh -o ConnectTimeout=10 smartcow-vps 'systemctl is-active nginx 2>/dev/null || true')
case "$HOST_STATE" in
  inactive|failed)
    ok "nginx host: $HOST_STATE (correcto)"
    ;;
  active)
    fail "nginx host ACTIVO. Debe estar disabled+masked. Ejecutar: ssh smartcow-vps 'sudo systemctl stop nginx && sudo systemctl disable nginx && sudo systemctl mask nginx'"
    ;;
  *)
    warn "nginx host estado inesperado: $HOST_STATE"
    ;;
esac

# 2. container nginx running
echo
echo "2/3 container smartcow-nginx-1..."
CONTAINER_STATE=$(ssh -o ConnectTimeout=10 smartcow-vps "sudo docker ps --filter name=smartcow-nginx-1 --filter status=running --format '{{.Names}}'" || true)
if [[ "$CONTAINER_STATE" == "smartcow-nginx-1" ]]; then
  ok "container running"
else
  fail "container smartcow-nginx-1 NO está running. Ejecutar: ssh smartcow-vps 'cd /var/www/smartcow && sudo docker compose up -d nginx'"
fi

# 3. test HTTPS en los 3 dominios
echo
echo "3/3 SSL en dominios públicos..."
DOMAINS=(
  "https://smartcow.cl/login"
  "https://langfuse.smartcow.cl/"
  "https://staging.smartcow.cl/"
)
for url in "${DOMAINS[@]}"; do
  CODE=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "$url" || echo "000")
  case "$CODE" in
    2*|3*)
      ok "$url → HTTP $CODE"
      ;;
    *)
      fail "$url → HTTP $CODE (esperado 2xx/3xx)"
      ;;
  esac
done

echo
echo "${GREEN}✅ VPS health OK${NC}"
