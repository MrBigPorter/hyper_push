#!/bin/bash
set -euo pipefail

# ==========================================
# HyperPush — Database Backup Script
# ==========================================
# Usage:
#   export MYSQL_ROOT_PASSWORD="your-password"
#   ./deploy/scripts/backup-db.sh
#
# Can be scheduled via cron on the host:
#   0 3 * * * cd /opt/hyperpush && ./deploy/scripts/backup-db.sh
# ==========================================

BACKUP_DIR="${BACKUP_DIR:-/var/backups/hyperpush}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# PostgreSQL container name
PG_CONTAINER="${PG_CONTAINER:-hyperpush-db}"
PG_USER="${PG_USER:-hyperpush}"
PG_DB="${PG_DB:-hyperpush}"

# MySQL container name (CodePush)
MYSQL_CONTAINER="${MYSQL_CONTAINER:-hyperpush-codepush-mysql}"
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_DB="${MYSQL_DB:-codepush}"

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting database backup..."

# Backup PostgreSQL
echo "  Backing up PostgreSQL..."
if docker exec "$PG_CONTAINER" pg_isready -U "$PG_USER" >/dev/null 2>&1; then
  docker exec "$PG_CONTAINER" pg_dump -U "$PG_USER" "$PG_DB" \
    | gzip > "$BACKUP_DIR/postgres_${TIMESTAMP}.sql.gz"
  echo "  ✅ PostgreSQL backup: $BACKUP_DIR/postgres_${TIMESTAMP}.sql.gz ($(du -h "$BACKUP_DIR/postgres_${TIMESTAMP}.sql.gz" | cut -f1))"
else
  echo "  ⚠️  PostgreSQL container '$PG_CONTAINER' not reachable, skipping..."
fi

# Backup CodePush MySQL
echo "  Backing up MySQL (CodePush)..."
if docker exec "$MYSQL_CONTAINER" mysqladmin ping -u "$MYSQL_USER" --silent >/dev/null 2>&1; then
  if [ -z "${MYSQL_ROOT_PASSWORD:-}" ]; then
    echo "  ⚠️  MYSQL_ROOT_PASSWORD not set, skipping MySQL backup..."
  else
    docker exec "$MYSQL_CONTAINER" mysqldump -u "$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DB" \
      | gzip > "$BACKUP_DIR/codepush-mysql_${TIMESTAMP}.sql.gz"
    echo "  ✅ MySQL backup: $BACKUP_DIR/codepush-mysql_${TIMESTAMP}.sql.gz ($(du -h "$BACKUP_DIR/codepush-mysql_${TIMESTAMP}.sql.gz" | cut -f1))"
  fi
else
  echo "  ⚠️  MySQL container '$MYSQL_CONTAINER' not reachable, skipping..."
fi

# Cleanup old backups
echo "  Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
OLD_COUNT=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETENTION_DAYS" | wc -l)
echo "  Removed $OLD_COUNT old backup file(s)."

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup completed."
