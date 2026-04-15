#!/bin/bash
# SmartCow VPS Setup Script
# Ubuntu 24.04 LTS — KVM 2
# Ejecutar como root: bash setup.sh

set -e
echo "=== SmartCow VPS Setup ==="

# ─── 1. Sistema base ──────────────────────────────────────────────────────────
echo ">>> Actualizando sistema..."
apt-get update -qq && apt-get upgrade -y -qq

apt-get install -y -qq \
  curl wget git build-essential \
  nginx certbot python3-certbot-nginx \
  postgresql postgresql-contrib \
  redis-server \
  ufw fail2ban \
  htop unzip

# ─── 2. Node 20 vía NVM ───────────────────────────────────────────────────────
echo ">>> Instalando Node 20..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20
node --version

# PM2
npm install -g pm2
pm2 startup systemd -u root --hp /root

# ─── 3. PostgreSQL ────────────────────────────────────────────────────────────
echo ">>> Configurando PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

sudo -u postgres psql <<SQL
CREATE USER smartcow WITH PASSWORD 'SC2026-db-prod';
CREATE DATABASE smartcow OWNER smartcow;
GRANT ALL PRIVILEGES ON DATABASE smartcow TO smartcow;
SQL

# ─── 4. Redis ─────────────────────────────────────────────────────────────────
echo ">>> Configurando Redis..."
systemctl start redis-server
systemctl enable redis-server
# Bind solo localhost
sed -i 's/^bind 127.0.0.1 -::1/bind 127.0.0.1/' /etc/redis/redis.conf
systemctl restart redis-server

# ─── 5. Firewall ──────────────────────────────────────────────────────────────
echo ">>> Configurando firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw deny 5432/tcp   # PostgreSQL solo local
ufw deny 6379/tcp   # Redis solo local

# ─── 6. Nginx ─────────────────────────────────────────────────────────────────
echo ">>> Configurando Nginx..."
cat > /etc/nginx/sites-available/smartcow <<'NGINX'
server {
    listen 80;
    server_name smartcow.cl www.smartcow.cl;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/smartcow /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
systemctl enable nginx

# ─── 7. Directorio app ────────────────────────────────────────────────────────
echo ">>> Creando directorio app..."
mkdir -p /var/www/smartcow
cd /var/www/smartcow

# ─── 8. Versiones instaladas ──────────────────────────────────────────────────
echo ""
echo "=== SETUP COMPLETO ==="
echo "Node:       $(node --version)"
echo "NPM:        $(npm --version)"
echo "PM2:        $(pm2 --version)"
echo "PostgreSQL: $(psql --version)"
echo "Redis:      $(redis-server --version)"
echo "Nginx:      $(nginx -v 2>&1)"
echo ""
echo "DB URL: postgresql://smartcow:SC2026-db-prod@localhost:5432/smartcow"
echo "IP:     2.24.204.73"
echo "==========================="
