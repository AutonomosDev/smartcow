#!/usr/bin/env bash
# deploy.sh — Full production deploy to Hostinger VPS
#
# Prerequisites:
#   - SSH alias "smartcow-vps" configured in ~/.ssh/config pointing to 2.24.204.73
#   - /var/www/smartcow must be a git clone of the repo (see setup below)
#
# Usage:
#   ./deploy.sh            # deploy latest main
#   ./deploy.sh --migrate  # deploy + run drizzle migrations
#
# VPS git setup (one-time, run manually as root):
#   ssh smartcow-vps
#   cp /var/www/smartcow/.env /tmp/smartcow.env.bak
#   git clone https://github.com/AutonomosDev/smartcow.git /tmp/smartcow-clone
#   rsync -a --exclude='.env' /tmp/smartcow-clone/ /var/www/smartcow/
#   cp /tmp/smartcow.env.bak /var/www/smartcow/.env
#   cd /var/www/smartcow && git status  # should be clean

set -euo pipefail

VPS="smartcow-vps"
REMOTE_DIR="/var/www/smartcow"
MIGRATE="${1:-}"

echo "🚀  Deploying smartcow to production VPS…"

ssh "$VPS" bash -s << EOF
  set -euo pipefail
  cd $REMOTE_DIR

  echo "📥  Pulling latest main…"
  git pull origin main

  echo "🔨  Building app container…"
  docker compose build app

  echo "▶️   Restarting app…"
  docker compose up -d app

  echo "✅  App restarted"
EOF

if [[ "$MIGRATE" == "--migrate" ]]; then
  echo "🗄️   Running drizzle migrations…"
  ssh "$VPS" bash -s << EOF
    set -euo pipefail
    cd $REMOTE_DIR
    docker compose run --rm migrate
EOF
  echo "✅  Migrations applied"
fi

echo ""
echo "🎉  Deploy complete"
echo "    https://smartcow.cl/login"
