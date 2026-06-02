#!/usr/bin/env bash
# Launch SC Payslip standalone server bound to localhost for the Cloudflare tunnel.
# Cloudflare routes payslip.cheesy.cloud -> http://localhost:58412 (Access email in front).
set -uo pipefail
APP_DIR="/tmp/payslip-app"
export NODE_ENV=production
export PORT=58412
export HOSTNAME=127.0.0.1            # bind localhost ONLY (origin must not bypass Cloudflare Access)
if [ -z "${NEXTAUTH_SECRET:-}" ]; then
  export NEXTAUTH_SECRET="$(grep -E '^NEXTAUTH_SECRET=' "$APP_DIR/.env" | cut -d= -f2- | tr -d '"')"
fi
cd "$APP_DIR/.next/standalone"
exec node server.js
