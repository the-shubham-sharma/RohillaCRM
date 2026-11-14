#!/usr/bin/env bash
# ==============================================================================
# ROHILLA ADVERTISING CRM — AUTOMATED POSTGRESQL BACKUP SCRIPT
# ==============================================================================
set -eo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/rohilla-crm}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/rohilla_crm_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
CONTAINER_NAME="${CONTAINER_NAME:-rohilla-crm-db}"
DB_USER="${POSTGRES_USER:-rohilla_db_user}"
DB_NAME="${POSTGRES_DB:-rohilla_crm}"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting automated database backup..."

# Execute pg_dump inside the running Docker container and stream to gzip
if docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner | gzip > "${BACKUP_FILE}"; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup successfully created: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Database backup failed!" >&2
    exit 1
fi

# Retention policy: Prune backups older than RETENTION_DAYS
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "rohilla_crm_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} +

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup routine completed successfully."
