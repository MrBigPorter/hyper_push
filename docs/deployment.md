# 🚀 Deployment Guide

Deploy HyperPush to a VPS using Docker Compose. This guide covers hardware requirements, VPS setup, SSH configuration, GitHub Secrets, pipeline deployment, verification, and rollback.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [VPS Setup](#-vps-setup)
- [SSH Key Configuration](#-ssh-key-configuration)
- [GitHub Secrets Configuration](#-github-secrets-configuration)
- [Deployment Pipeline](#-deployment-pipeline)
- [Post-Deployment Verification](#-post-deployment-verification)
- [Rollback Procedure](#-rollback-procedure)
- [Troubleshooting](#-troubleshooting)

---

## 📋 Prerequisites

### Hardware Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disk | 20 GB SSD | 40 GB SSD |

```bash
# On the VPS:
nproc              # Check CPU cores
free -h            # Check RAM
df -h /            # Check disk space

# Verify
uname -m           # Should output: x86_64 or aarch64
```

### Network Requirements

| Port | Service | Purpose |
|------|---------|---------|
| `22` | SSH | Remote administration |
| `80` | HTTP | ACME HTTP challenge, redirect |
| `443` | HTTPS | Production traffic |

### Domain Requirements

| Domain | Records | Purpose |
|--------|---------|---------|
| `console.yourdomain.com` | `A → VPS_IP` | HyperPush frontend + API |

---

## 🖥️ VPS Setup

### 2.1 Create Deploy Directory

```bash
# On the VPS
sudo mkdir -p /opt/hyperpush
sudo chown -R $USER:$USER /opt/hyperpush
```

### 2.2 Verify Docker is Working

```bash
docker --version
docker compose version
docker info
```

### 2.3 Test Docker Compose (Optional)

```bash
cd /opt/hyperpush
docker run --rm hello-world
```

---

## 🔑 SSH Key Configuration

### 3.1 Generate Deploy Key

Generate a dedicated deploy key on your local machine:

```bash
ssh-keygen -t ed25519 -C "hyperpush-deploy" -f ~/.ssh/hyperpush-deploy
```

### 3.2 Install Public Key on VPS

**Option A** — Using `ssh-copy-id` (if password login is enabled):

```bash
ssh-copy-id -i ~/.ssh/hyperpush-deploy.pub <user>@<vps-ip>
```

**Option B** — Manual installation:

```bash
# On the VPS:
cat >> ~/.ssh/authorized_keys << 'EOF'
# Paste the public key content here
ssh-ed25519 AAAAC3... hyperpush-deploy
EOF

chmod 600 ~/.ssh/authorized_keys
```

**Option C** — Via VPS web console:

```bash
# On your local machine:
cat ~/.ssh/hyperpush-deploy.pub
# Copy the output, then paste it into ~/.ssh/authorized_keys on the VPS
```

### 3.3 Verify SSH Access

```bash
ssh -i ~/.ssh/hyperpush-deploy -p <port> <user>@<vps-ip> "echo SSH_OK"
# Expected output: SSH_OK
```

### 3.4 View Private Key for GitHub Secret

```bash
cat ~/.ssh/hyperpush-deploy
# Copy the entire output (including BEGIN and END lines)
# This will be added as SSH_PRIVATE_KEY in GitHub Secrets
```

---

## 🔒 GitHub Secrets Configuration

Add these secrets in GitHub → Settings → Secrets and variables → Actions:

| Secret | Description | Example / How to Generate |
|--------|-------------|---------------------------|
| `SSH_HOST` | VPS IP address | `123.123.123.123` |
| `SSH_PORT` | SSH port | `22` |
| `SSH_USERNAME` | SSH user | `root` |
| `SSH_PRIVATE_KEY` | Deploy SSH private key | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://hyperpush:password@db:5432/hyperpush` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `openssl rand -base64 24` |
| `MYSQL_ROOT_PASSWORD` | CodePush MySQL root password | `openssl rand -base64 24` |
| `JWT_SECRET` | JWT signing secret | `openssl rand -hex 64` |
| `TOKEN_SECRET` | Additional token signing secret | `openssl rand -hex 32` |
| `TOTP_ENCRYPTION_KEY` | AES-256-GCM key (32 hex chars) | `openssl rand -hex 16` |
| `GRAFANA_AUTH_SECRET` | Grafana SSO JWT signing secret (must match `infra-platform/.env`) | `openssl rand -hex 32` |
| `GRAFANA_ADMIN_PASSWORD` | Grafana admin password | `openssl rand -base64 24` |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA v3 secret | *(from Google reCAPTCHA admin)* |
| `VITE_RECAPTCHA_SITE_KEY` | Google reCAPTCHA v3 site key | *(from Google reCAPTCHA admin)* |
| `CODEPUSH_DOMAIN` | CodePush server domain | `cp.yourdomain.com` |
| `CONSOLE_DOMAIN` | HyperPush console domain | `console.yourdomain.com` |
| `SERVER_IP` | VPS IP address (duplicate for clarity) | `123.123.123.123` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID (for frontend deploy) | *(from Cloudflare dashboard)* |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | *(from Cloudflare dashboard)* |
| `VITE_API_URL` | Frontend API base URL | `https://console.yourdomain.com/graphql` |
| `VITE_MONITOR_URL` | Grafana/Monitor URL | `https://monitor.yourdomain.com` |

> **Note**: `GITHUB_TOKEN` is auto-provided by GitHub Actions — no need to create it manually.

Generate random secrets:

```bash
openssl rand -hex 64   # JWT_SECRET
openssl rand -hex 32   # TOKEN_SECRET / GRAFANA_AUTH_SECRET
openssl rand -hex 16   # TOTP_ENCRYPTION_KEY
openssl rand -base64 24 # POSTGRES_PASSWORD / MYSQL_ROOT_PASSWORD / GRAFANA_ADMIN_PASSWORD
```

---

## 📦 Deployment Pipeline

The deployment is handled by the [`deploy-vps.yml`](/.github/workflows/deploy-vps.yml) GitHub Actions workflow, triggered on pushes to `main`.

### Pipeline Flow

```mermaid
graph LR
    Push["Push to main"] --> Build["Build Docker Images"]
    Build --> PushRegistry["Push to GHCR<br/>ghcr.io/hyperpush-*:latest"]

    PushRegistry --> SSHSetup["Setup SSH Key<br/>Write + known_hosts"]
    SSHSetup --> SSHAuth["Verify SSH Auth<br/>ssh -o BatchMode=yes"]
    SSHAuth --> MkDir["mkdir -p /opt/hyperpush/deploy"]
    MkDir --> Tar["tar -cz compose files"]
    Tar --> SCP["scp transfer"]
    SCP --> Extract["ssh extract tar"]
    Extract --> DockerUp["docker compose up -d"]
```

### Pipeline Steps

1. **Build Docker images** — Multi-stage builds for `app` (NestJS) and `frontend` (Nginx), pushed to GHCR
2. **Setup SSH key** — Write the deploy key from `SSH_PRIVATE_KEY` to `~/.ssh/hyperpush-deploy` with `chmod 600`, add host to `known_hosts` via `ssh-keyscan`
3. **Verify SSH authentication** — Run `ssh -o BatchMode=yes ... "echo SSH_AUTH_OK"` to confirm the key works **before** attempting file transfer
4. **Ensure remote directory** — `mkdir -p /opt/hyperpush/deploy` on the VPS
5. **Sync files** — `tar` → `scp` → `ssh tar xzf` for atomic file transfer
6. **Deploy** — `docker compose up -d` on the VPS pulls the latest images and restarts services

### Deploy Commands Reference

| File | Purpose |
|------|---------|
| [`deploy-vps.yml`](/.github/workflows/deploy-vps.yml) | Complete VPS deployment workflow |
| [`ci.yml`](/.github/workflows/ci.yml) | PR checks (lint + typecheck) |
| [`compose.yml`](/compose.yml) | Base Docker Compose configuration |
| [`compose.codepush.yml`](/compose.codepush.yml) | CodePush services (MySQL 8.0, Redis 7) |
| [`deploy/compose.prod.yml`](/deploy/compose.prod.yml) | Production overrides (Nginx, env vars) |

---

> **ℹ️ Monitoring stack extracted to standalone project**
>
> The monitoring stack (Loki + Grafana + Promtail) has been extracted to a separate
> project at [`../infra-platform/`](../infra-platform/) (sibling of this repo).
>
> See its [`README.md`](../infra-platform/README.md) for setup and usage instructions.
> The `GRAFANA_ADMIN_PASSWORD` secret was removed from this project's secrets —
> manage it in the `infra-platform` project instead.

---

## ✅ Post-Deployment Verification

### 5.1 Check Containers

```bash
# On the VPS
cd /opt/hyperpush
docker compose ps

# Expected output (all running):
# NAME                          STATUS
# hyperpush-codepush-prod       Up
# hyperpush-app-prod            Up
# hyperpush-frontend-prod       Up
# hyperpush-nginx               Up
# hyperpush-mysql               Up
# hyperpush-redis               Up
```

### 5.2 Check Logs

```bash
# Check for errors
docker compose logs --tail=50 app | grep -i error
docker compose logs --tail=50 nginx | grep -i error

# Verify Nginx config
docker compose logs nginx | grep -i error
```

### 5.3 Test Endpoints

```bash
# GraphQL API (should return 200)
curl -s -o /dev/null -w "%{http_code}" https://console.yourdomain.com/graphql

# Frontend (should return 200)
curl -s -o /dev/null -w "%{http_code}" https://console.yourdomain.com

# CodePush server health
curl -s https://codepush.yourdomain.com
```

### 5.4 Verify Registration

Open `https://console.yourdomain.com` in a browser and register the first admin account.

---

## 🔙 Rollback Procedure

### Option A — Rollback to Previous Docker Images

```bash
# On the VPS
cd /opt/hyperpush

# Pull the previous stable version (replace :latest with :<previous-tag>)
docker compose pull app
docker compose pull frontend

# Restart
docker compose up -d
```

### Option B — Rollback via GitHub Actions

1. Go to GitHub → Actions → Deploy to VPS
2. Find the last successful run
3. Click **Re-run all jobs**

### Option C — Full Manual Rollback

```bash
# Stop all services
docker compose down

# Restore from backup
git checkout <previous-stable-tag>

# Restart
docker compose up -d
```

---

## 🔍 Troubleshooting

### SSH Authentication

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| `Permission denied (publickey)` | Public key not installed on VPS | Run `ssh-copy-id` or manually add to `~/.ssh/authorized_keys` |
| `ssh-keyscan failed` | DNS resolution or host unreachable | Verify `SSH_HOST` is correct and VPS is reachable |
| `key does not start with valid header` | Secret format incorrect | Ensure `SSH_PRIVATE_KEY` includes `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` |
| `Connection refused` | SSH server not running | Check `systemctl status sshd` on VPS |

### Docker

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| `permission denied` | User not in docker group | `sudo usermod -aG docker $USER && newgrp docker` |
| `no space left on device` | Docker disk full | `docker system prune -a` |
| `port already allocated` | Port conflict | Check `ss -tlnp` for port usage, update compose files |
| Image pull fails | GHCR authentication | Verify `GITHUB_TOKEN` secret has `read:packages` scope |

### Application

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| `Caddy certificate error` | DNS not propagated | Wait for DNS, or check Caddy logs |
| `Prisma error: table not found` | Migrations not run | `docker compose exec app npx prisma migrate deploy` |
| `401 Unauthorized` | JWT token expired | Log out and log in again |
| CodePush requests failing | Server API key invalid | Update the server's API key in the HyperPush console |
| GraphQL schema errors | Schema mismatch | Ensure backend/frontend are on same version |

### SSH Authentication Checklist

If the GitHub Actions pipeline fails with SSH errors:

1. ✅ Is the public key installed on the VPS?
   ```bash
   ssh <user>@<vps-ip> "cat ~/.ssh/authorized_keys | grep hyperpush"
   ```

2. ✅ Is the `SSH_PRIVATE_KEY` secret correctly formatted?
   - Must include `-----BEGIN OPENSSH PRIVATE KEY-----` header
   - Must include `-----END OPENSSH PRIVATE KEY-----` footer
   - Line breaks must be preserved

3. ✅ Is the SSH server configured correctly on VPS?
   ```bash
   sudo grep -E "^(PubkeyAuthentication|AuthorizedKeysFile|PasswordAuthentication)" /etc/ssh/sshd_config
   ```
   Expected:
   ```
   PubkeyAuthentication yes
   AuthorizedKeysFile .ssh/authorized_keys
   PasswordAuthentication no  (optional, recommended for security)
   ```

4. ✅ Can you SSH manually?
   ```bash
   ssh -i ~/.ssh/hyperpush-deploy -p <port> <user>@<vps-ip>
   ```
