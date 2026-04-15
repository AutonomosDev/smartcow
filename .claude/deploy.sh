#!/bin/bash
# SmartCow — Deploy script
# Clonar repo, instalar deps, migrar DB, levantar con PM2
# Ejecutar como root en el VPS: bash /root/deploy.sh

set -e
echo "=== SmartCow Deploy ==="

export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 20

# ─── 1. Clonar repo ───────────────────────────────────────────────────────────
echo ">>> Clonando repo..."
cd /var/www/smartcow
git clone https://github.com/AutonomosCdM/smartcow.git . 2>/dev/null || git pull origin main

# ─── 2. Variables de entorno ──────────────────────────────────────────────────
echo ">>> Configurando .env.local..."
cat > /var/www/smartcow/.env.local <<'ENV'
DATABASE_URL=postgresql://smartcow:SC2026-db-prod@localhost:5432/smartcow
NEXTAUTH_SECRET=sc-jwt-secret-2026-prod-fundo-san-pedro
NEXTAUTH_URL=https://smartcow.cl
REDIS_URL=redis://localhost:6379
NODE_ENV=production
ENV

# ─── 3. Instalar dependencias ─────────────────────────────────────────────────
echo ">>> Instalando dependencias..."
cd /var/www/smartcow
npm install --legacy-peer-deps

# ─── 4. Migrar DB ─────────────────────────────────────────────────────────────
echo ">>> Ejecutando migraciones..."
npm run db:migrate

# ─── 5. Build Next.js ─────────────────────────────────────────────────────────
echo ">>> Build Next.js..."
npm run build

# ─── 6. Levantar con PM2 ─────────────────────────────────────────────────────
echo ">>> Levantando con PM2..."
pm2 delete smartcow 2>/dev/null || true
pm2 start npm --name smartcow -- start
pm2 save

echo ""
echo "=== DEPLOY COMPLETO ==="
echo "App: http://2.24.204.73:3000"
pm2 status
