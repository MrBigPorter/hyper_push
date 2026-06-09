#!/bin/sh
# ==========================================
# HyperPush — Docker Entrypoint
# ==========================================
# Purpose: Auto-fill missing env vars on container start
# - If JWT_SECRET is not set, auto-generate one
# - If POSTGRES_PASSWORD is not set, auto-generate one
# - If DATABASE_URL is not set, compose from POSTGRES_PASSWORD
# - And so on
#
# Safety: Only fills MISSING values, never overwrites existing ones
# ==========================================

set -e

# ─── Helper Functions ────────────────────────────
warn() { echo "[ENTRYPOINT] WARN: $1"; }
info() { echo "[ENTRYPOINT] INFO: $1"; }

# ─── Check if .env Exists ──────────────────────
if [ -f /app/.env ]; then
  info "Loading .env file..."
  set -a
  . /app/.env
  set +a
fi

# ─── Auto-Generate Missing Config ──────────────
GENERATED=0

# JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -hex 64)
  warn "JWT_SECRET not set, auto-generated"
  GENERATED=1
fi

# TOKEN_SECRET
if [ -z "$TOKEN_SECRET" ]; then
  TOKEN_SECRET=$(openssl rand -hex 32)
  warn "TOKEN_SECRET not set, auto-generated"
  GENERATED=1
fi

# TOTP_ENCRYPTION_KEY
if [ -z "$TOTP_ENCRYPTION_KEY" ]; then
  TOTP_ENCRYPTION_KEY=$(openssl rand -hex 16)
  warn "TOTP_ENCRYPTION_KEY not set, auto-generated"
  GENERATED=1
fi

# POSTGRES_PASSWORD
if [ -z "$POSTGRES_PASSWORD" ]; then
  POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c24)
  warn "POSTGRES_PASSWORD not set, auto-generated"
  GENERATED=1
fi

# MYSQL_ROOT_PASSWORD
if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
  MYSQL_ROOT_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c24)
  warn "MYSQL_ROOT_PASSWORD not set, auto-generated"
  GENERATED=1
fi

# GRAFANA_AUTH_SECRET
if [ -z "$GRAFANA_AUTH_SECRET" ]; then
  GRAFANA_AUTH_SECRET=$(openssl rand -hex 32)
  warn "GRAFANA_AUTH_SECRET not set, auto-generated"
  GENERATED=1
fi

# GRAFANA_ADMIN_PASSWORD
if [ -z "$GRAFANA_ADMIN_PASSWORD" ]; then
  GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c24)
  warn "GRAFANA_ADMIN_PASSWORD not set, auto-generated"
  GENERATED=1
fi

# DATABASE_URL (compose from POSTGRES_PASSWORD)
if [ -z "$DATABASE_URL" ]; then
  DATABASE_URL="postgresql://hyperpush:${POSTGRES_PASSWORD}@db:5432/hyperpush"
  warn "DATABASE_URL not set, auto-composed from POSTGRES_PASSWORD"
  GENERATED=1
fi

# ─── Optional Feature Warnings ─────────────────
if [ -z "$CODEPUSH_GITHUB_PAT" ] || [ -z "$CODEPUSH_GITHUB_OWNER" ]; then
  warn "CODEPUSH_GITHUB_PAT or CODEPUSH_GITHUB_OWNER not set — Hot Fix unavailable"
fi

if [ -z "$RECAPTCHA_SECRET_KEY" ]; then
  info "RECAPTCHA_SECRET_KEY not set — reCAPTCHA disabled (RECAPTCHA_ENABLED=false)"
  RECAPTCHA_ENABLED=false
fi

if [ -z "$CODEPUSH_DOMAIN" ]; then
  warn "CODEPUSH_DOMAIN not set — set the domain for correct download URLs"
fi

# ─── Export All Variables ───────────────────────
export JWT_SECRET
export TOKEN_SECRET
export TOTP_ENCRYPTION_KEY
export POSTGRES_PASSWORD
export MYSQL_ROOT_PASSWORD
export GRAFANA_AUTH_SECRET
export GRAFANA_ADMIN_PASSWORD
export DATABASE_URL
export RECAPTCHA_ENABLED

# ─── If New Values Were Generated, Write .env ──
if [ "$GENERATED" -eq 1 ]; then
  info "Writing auto-generated values to /app/.env..."

  cat > /app/.env << ENVEOF
# ==========================================
# HyperPush — Auto-generated Configuration
# Generated: $(date)
# ==========================================

# ─── Database ─────────────────────────────
DATABASE_URL="${DATABASE_URL}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD}"

# ─── Auth Secrets ─────────────────────────
JWT_SECRET="${JWT_SECRET}"
TOKEN_SECRET="${TOKEN_SECRET}"
TOTP_ENCRYPTION_KEY="${TOTP_ENCRYPTION_KEY}"

# ─── Domain ──────────────────────────────
CODEPUSH_DOMAIN="${CODEPUSH_DOMAIN}"
PUBLIC_URL="https://${CODEPUSH_DOMAIN}/codepush"
CORS_ORIGINS="https://${CONSOLE_DOMAIN}"

# ─── Grafana SSO (Optional) ───────────────
GRAFANA_AUTH_SECRET="${GRAFANA_AUTH_SECRET}"
GRAFANA_ADMIN_PASSWORD="${GRAFANA_ADMIN_PASSWORD}"

# ─── reCAPTCHA ───────────────────────────
RECAPTCHA_SECRET_KEY="${RECAPTCHA_SECRET_KEY}"
RECAPTCHA_ENABLED=${RECAPTCHA_ENABLED:-false}

# ─── Application ─────────────────────────
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
ENVEOF
  info "/app/.env updated"
fi

# ─── Execute Original Command ──────────────────
info "Starting NestJS..."
exec "$@"
