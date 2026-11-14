# Database Backup and Disaster Recovery Strategy

Rohilla Advertising CRM utilizes PostgreSQL 16 Alpine as its production relational database. This document outlines the backup schedule, automation, retention rules, and step-by-step restoration procedures.

---

## 1. Backup Strategy Overview

| Parameter | Specification |
| :--- | :--- |
| **Engine** | PostgreSQL 16 (Dockerized container: `rohilla-crm-db`) |
| **Backup Utility** | `pg_dump` with `--clean --if-exists --no-owner` |
| **Compression** | Gzip (`.sql.gz`) |
| **Default Backup Path** | `/var/backups/rohilla-crm/` |
| **Backup Frequency** | Daily at 02:00 AM (server local time) |
| **Retention Policy** | 30 days rolling automatic rotation |
| **Off-Site Sync** | Optional rsync / S3 bucket sync |

---

## 2. Automated Cron Job Configuration

On your Hostinger Ubuntu VPS, configure a daily cron job:

```bash
# Open crontab editor
crontab -e

# Add daily 2:00 AM execution:
0 2 * * * /opt/rohilla-crm/scripts/backup.sh >> /var/log/rohilla-crm-backup.log 2>&1
```

Make sure the backup script has executable permissions:
```bash
chmod +x /opt/rohilla-crm/scripts/backup.sh
chmod +x /opt/rohilla-crm/scripts/restore.sh
```

---

## 3. Manual Backup Execution

To trigger an immediate on-demand backup prior to software updates or migrations:

```bash
cd /opt/rohilla-crm
./scripts/backup.sh
```

Expected output:
```text
[2026-09-07 14:00:00] Starting automated database backup...
[2026-09-07 14:00:05] Backup successfully created: /var/backups/rohilla-crm/rohilla_crm_20260907_140000.sql.gz (14M)
[2026-09-07 14:00:05] Cleaning up backups older than 30 days...
[2026-09-07 14:00:05] Backup routine completed successfully.
```

---

## 4. Disaster Recovery & Restoration Procedure

In the event of hardware failure, data corruption, or rollback requirement:

### Step 1: Identify the Backup File
```bash
ls -lh /var/backups/rohilla-crm/
```

### Step 2: Ensure the Database Container is Running
```bash
docker compose ps
```

### Step 3: Run the Restore Script
```bash
./scripts/restore.sh /var/backups/rohilla-crm/rohilla_crm_20260907_140000.sql.gz
```

Type `yes` when prompted to confirm the restoration.

### Step 4: Verify Application Health
```bash
curl http://localhost:8080/actuator/health
```
Expected response:
```json
{"status":"UP"}
```
