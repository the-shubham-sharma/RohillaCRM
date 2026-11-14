#!/usr/bin/env bash
# ==============================================================================
# ROHILLA ADVERTISING CRM — DATABASE RESTORE SCRIPT
# ==============================================================================
set -eo pipefail

if [ -z "$1" ]; then
    echo "Usage: $0 <path-to-backup-file.sql.gz>"
    echo "Example: $0 /var/backups/rohilla-crm/rohilla_crm_20260907_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="${CONTAINER_NAME:-rohilla-crm-db}"
DB_USER="${POSTGRES_USER:-rohilla_db_user}"
DB_NAME="${POSTGRES_DB:-rohilla_crm}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "ERROR: Backup file not found: ${BACKUP_FILE}" >&2
    exit 1
fi

echo "================================================================================"
echo "WARNING: Restoring will overwrite existing data in database: ${DB_NAME}"
echo "Backup File: ${BACKUP_FILE}"
echo "================================================================================"
read -p "Are you sure you want to proceed? (yes/NO): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    echo "Restoration aborted by user."
    exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Beginning database restoration..."

# Decompress and execute SQL in container
if gzip -dc "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: Database restored successfully from ${BACKUP_FILE}."
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Database restore encountered an error!" >&2
    exit 1
fi
