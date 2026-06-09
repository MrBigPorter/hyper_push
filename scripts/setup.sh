#!/bin/bash
# ==========================================
# HyperPush — One-Click Setup Script
# ==========================================
# Usage:
#   bash <(curl -fsSL https://raw.githubusercontent.com/MrBigPorter/hyperpush/main/scripts/setup.sh)
#
# Features:
#   1. Prompt for domain, VPS IP, and other required info
#   2. Auto-generate all random secrets (JWT_SECRET, DB passwords, etc.)
#   3. Generate SSH deploy key pair
#   4. Create a complete .env file
#   5. Print next-step instructions
# ==========================================

set -e

# ─── Color Output ──────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ─── Check Dependencies ──────────────────────────
info "Checking dependencies..."

for cmd in openssl ssh-keygen curl; do
  if ! command -v "$cmd" &>/dev/null; then
    error "Missing dependency: $cmd"
    error "Install: brew install $cmd (macOS) or apt install $cmd (Linux)"
    exit 1
  fi
done
ok "All dependencies installed"

# ─── Prompt for Required Info ───────────────────
echo ""
echo "=========================================="
echo "  HyperPush Setup Wizard"
echo "=========================================="
echo ""

read -r -p "🌐 Enter your main domain (e.g., hyperpush.org): " CONSOLE_DOMAIN
read -r -p "🌍 Enter your CodePush subdomain (e.g., cp.hyperpush.org): " CODEPUSH_DOMAIN
read -r -p "🖥️  Enter your VPS IP address: " SERVER_IP
echo ""

# Optional: Configure Cloudflare
read -r -p "☁️  Configure Cloudflare Pages for frontend deployment? (y/N): " USE_CLOUDFLARE
USE_CLOUDFLARE=${USE_CLOUDFLARE:-N}

CLOUDFLARE_ACCOUNT_ID=""
CLOUDFLARE_API_TOKEN=""
if [[ "$USE_CLOUDFLARE" =~ ^[Yy]$ ]]; then
  read -r -p "   Cloudflare Account ID: " CLOUDFLARE_ACCOUNT_ID
  read -r -p "   Cloudflare API Token: " CLOUDFLARE_API_TOKEN
fi

# Optional: Configure GitHub Hot Fix
echo ""
echo "🔧 GitHub Hot Fix — one-click frontend re-deploy from HyperPush console"
echo "   Create a Personal Access Token first:"
echo "   → https://github.com/settings/tokens/new?scopes=repo&description=hyperpush-hotfix"
read -r -p "   Configure? (y/N): " USE_GITHUB_HOTFIX
USE_GITHUB_HOTFIX=${USE_GITHUB_HOTFIX:-N}

CODEPUSH_GITHUB_PAT=""
CODEPUSH_GITHUB_OWNER=""
if [[ "$USE_GITHUB_HOTFIX" =~ ^[Yy]$ ]]; then
  echo ""
  read -r -p "   GitHub Personal Access Token (classic, requires repo scope): " CODEPUSH_GITHUB_PAT
  read -r -p "   GitHub Repo Owner (your GitHub username, e.g., MrBigPorter): " CODEPUSH_GITHUB_OWNER
fi

# Optional: Configure reCAPTCHA
read -r -p "🔒 Configure Google reCAPTCHA v3? (y/N): " USE_RECAPTCHA
USE_RECAPTCHA=${USE_RECAPTCHA:-N}

RECAPTCHA_SECRET_KEY=""
VITE_RECAPTCHA_SITE_KEY=""
if [[ "$USE_RECAPTCHA" =~ ^[Yy]$ ]]; then
  read -r -p "   reCAPTCHA Secret Key: " RECAPTCHA_SECRET_KEY
  read -r -p "   reCAPTCHA Site Key: " VITE_RECAPTCHA_SITE_KEY
fi

echo ""
info "Generating configuration..."

# ─── Generate Random Secrets ────────────────────
JWT_SECRET=$(openssl rand -hex 64)
TOKEN_SECRET=$(openssl rand -hex 32)
TOTP_ENCRYPTION_KEY=$(openssl rand -hex 16)
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c24)
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c24)
GRAFANA_AUTH_SECRET=$(openssl rand -hex 32)
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c24)

# Compose derived values
DATABASE_URL="postgresql://hyperpush:${POSTGRES_PASSWORD}@db:5432/hyperpush"
PUBLIC_URL="https://${CODEPUSH_DOMAIN}/codepush"
CORS_ORIGINS="https://${CONSOLE_DOMAIN}"

ok "Random secrets generated"
ok "JWT_SECRET, TOKEN_SECRET, TOTP_ENCRYPTION_KEY, etc. auto-created"

# ─── Create .env File ───────────────────────────
mkdir -p /opt/hyperpush 2>/dev/null || true

cat > .env << ENVEOF
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
CONSOLE_DOMAIN="${CONSOLE_DOMAIN}"
PUBLIC_URL="${PUBLIC_URL}"
CORS_ORIGINS="${CORS_ORIGINS}"

# ─── Grafana SSO (Optional) ───────────────
GRAFANA_AUTH_SECRET="${GRAFANA_AUTH_SECRET}"
GRAFANA_ADMIN_PASSWORD="${GRAFANA_ADMIN_PASSWORD}"

# ─── reCAPTCHA ───────────────────────────
ENVEOF

if [[ "$USE_RECAPTCHA" =~ ^[Yy]$ ]]; then
  cat >> .env << ENVEOF
RECAPTCHA_SECRET_KEY="${RECAPTCHA_SECRET_KEY}"
RECAPTCHA_ENABLED=true
ENVEOF
else
  cat >> .env << ENVEOF
RECAPTCHA_ENABLED=false
ENVEOF
fi

cat >> .env << ENVEOF

# ─── GitHub Hot Fix (Optional) ─────────────
ENVEOF

if [[ "$USE_GITHUB_HOTFIX" =~ ^[Yy]$ ]]; then
  cat >> .env << ENVEOF
CODEPUSH_GITHUB_PAT="${CODEPUSH_GITHUB_PAT}"
CODEPUSH_GITHUB_OWNER="${CODEPUSH_GITHUB_OWNER}"
ENVEOF
fi

cat >> .env << ENVEOF

# ─── Application ─────────────────────────
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
ENVEOF

ok ".env file created"

# ─── Generate SSH Deploy Key ───────────────────
SSH_KEY_PATH="$HOME/.ssh/hyperpush-deploy"
if [ ! -f "$SSH_KEY_PATH" ]; then
  mkdir -p "$HOME/.ssh"
  ssh-keygen -t ed25519 -C "hyperpush-deploy" -f "$SSH_KEY_PATH" -N "" &>/dev/null
  ok "SSH deploy key generated: ${SSH_KEY_PATH}"
else
  warn "SSH key already exists, skipping: ${SSH_KEY_PATH}"
fi

# ─── Print Next-Steps ──────────────────────────
echo ""
echo "=========================================="
echo "  ✅ Setup Complete! Next steps:"
echo "=========================================="
echo ""

echo -e "${YELLOW}1. Install public key on VPS:${NC}"
echo "   ssh-copy-id -i ${SSH_KEY_PATH}.pub root@${SERVER_IP}"
echo ""

echo -e "${YELLOW}2. Verify SSH connection:${NC}"
echo "   ssh -i ${SSH_KEY_PATH} root@${SERVER_IP} \"echo SSH_OK\""
echo ""

echo -e "${YELLOW}3. Add these secrets to GitHub:${NC}"
echo "   (Settings → Secrets and variables → Actions)"
echo ""

# Determine which secrets are required
cat << TABLE
   ┌─────────────────────────┬──────────────────────────────────────────┐
   │ Secret                  │ Value                                   │
   ├─────────────────────────┼──────────────────────────────────────────┤
   │ SSH_HOST                │ ${SERVER_IP}                              │
   │ SSH_PORT                │ 22                                       │
   │ SSH_USERNAME            │ root                                     │
   │ SSH_PRIVATE_KEY         │ (contents of ${SSH_KEY_PATH})             │
   │ CODEPUSH_DOMAIN         │ ${CODEPUSH_DOMAIN}                        │
   │ CONSOLE_DOMAIN          │ ${CONSOLE_DOMAIN}                         │
TABLE

if [[ "$USE_CLOUDFLARE" =~ ^[Yy]$ ]]; then
  cat << TABLE
   │ CLOUDFLARE_ACCOUNT_ID   │ ${CLOUDFLARE_ACCOUNT_ID}                    │
   │ CLOUDFLARE_API_TOKEN    │ ${CLOUDFLARE_API_TOKEN}                     │
TABLE
fi

if [[ "$USE_RECAPTCHA" =~ ^[Yy]$ ]]; then
  cat << TABLE
   │ RECAPTCHA_SECRET_KEY    │ ${RECAPTCHA_SECRET_KEY}                    │
   │ VITE_RECAPTCHA_SITE_KEY │ ${VITE_RECAPTCHA_SITE_KEY}                 │
TABLE
fi

cat << TABLE
   └─────────────────────────┴──────────────────────────────────────────┘

TABLE

echo -e "${YELLOW}4. Commit everything and push to main:${NC}"
echo ""
echo "   git add ."
echo '   git commit -m "chore: initial configuration"'
echo "   git push origin main"
echo ""
echo -e "${GREEN}GitHub Actions will auto-deploy to the VPS!${NC}"
echo ""

echo "=========================================="
echo "  📋 Setup Summary"
echo "=========================================="
echo "  Main Domain:   ${CONSOLE_DOMAIN}"
echo "  CodePush:      ${CODEPUSH_DOMAIN}"
echo "  VPS IP:        ${SERVER_IP}"
echo "  DB Password:   ${POSTGRES_PASSWORD}"
echo "  JWT Secret:    ${JWT_SECRET:0:16}...${JWT_SECRET: -16}"
echo "  Deploy Key:    ${SSH_KEY_PATH}"
echo "=========================================="
echo ""
info "Copy .env to VPS:"
echo "   scp -i ${SSH_KEY_PATH} .env root@${SERVER_IP}:/opt/hyperpush/.env"
echo ""
ok "Setup complete! Happy deploying 🚀"
