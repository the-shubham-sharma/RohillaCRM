# Hostinger VPS Production Deployment Runbook

This guide covers the deployment of **Rohilla Advertising CRM** to a **Hostinger Ubuntu 24.04 Docker VPS** with SSL/HTTPS termination, automated database backups, and reverse proxy routing.

---

## 1. Prerequisites & Hostinger VPS Setup

1. **Hostinger VPS Plan**: KVM 2 or higher recommended (Ubuntu 24.04 64-bit with Docker template).
2. **Domain Name**: Point your subdomain DNS `A Record` (e.g. `crm.yourdomain.com`) to your Hostinger VPS Public IP.
3. **SSH Access**: Ensure you can connect via SSH:
   ```bash
   ssh root@<YOUR_VPS_IP>
   ```

---

## 2. Server Provisioning

Run on the Hostinger VPS:

```bash
# 1. Update system packages
apt-get update && apt-get upgrade -y

# 2. Verify Docker and Docker Compose
docker --version
docker compose version

# 3. Create deployment directory
mkdir -p /opt/rohilla-crm
mkdir -p /var/backups/rohilla-crm
mkdir -p /opt/rohilla-crm/storage

# 4. Clone repository
cd /opt/rohilla-crm
git clone https://github.com/your-org/rohilla-crm.git .
```

---

## 3. Environment Configuration

Create the production `.env` file:

```bash
cp .env.example .env
chmod 600 .env
nano .env
```

Populate the required secrets:
* `POSTGRES_PASSWORD`: Strong password (e.g. generated via `openssl rand -hex 24`).
* `DATABASE_PASSWORD`: Same as `POSTGRES_PASSWORD`.
* `JWT_SECRET`: 64-byte hex secret (`openssl rand -hex 64`).
* `REFRESH_TOKEN_SECRET`: 64-byte hex secret (`openssl rand -hex 64`).
* `CORS_ALLOWED_ORIGINS`: `https://crm.yourdomain.com`.
* `INITIAL_OWNER_EMAIL`: `owner@rohilla.com` (or your company email).

---

## 4. Launching the Application Stack

Start the Docker Compose services:

```bash
cd /opt/rohilla-crm
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Verify running containers:
```bash
docker compose ps
```

Expected output:
```text
NAME                   IMAGE                  COMMAND                  SERVICE    STATUS
rohilla-crm-db         postgres:16-alpine     "docker-entrypoint.s…"   postgres   Up (healthy)
rohilla-crm-backend    rohilla-crm-backend    "sh -c 'java $JAVA_O…"   backend    Up (healthy)
rohilla-crm-frontend   rohilla-crm-frontend   "/docker-entrypoint.…"   frontend   Up
```

---

## 5. First-Time Owner Account Setup

Check the backend container logs on first startup:
```bash
docker logs rohilla-crm-backend
```

If `INITIAL_OWNER_PASSWORD` was left empty in `.env`, the console will display the secure one-time generated password:
```text
================================================================================
  ROHILLA ADVERTISING CRM — INITIAL PRODUCTION OWNER ACCOUNT CREATED            
================================================================================
  Email:       owner@rohilla.com
  Password:    xK8#mQ2$pL9@vW4!
  Status:      ACTIVE (Password change mandatory on first login)                 
  IMPORTANT:   Copy these credentials immediately and log in to configure CRM.  
               This password will NOT be logged or displayed again.             
================================================================================
```

Log in via `https://crm.yourdomain.com` and change the password immediately.

---

## 6. SSL / HTTPS Configuration with Let's Encrypt (Certbot)

To secure `crm.yourdomain.com` with free SSL certificates from Let's Encrypt:

### Option A: Using Host-Level Nginx Reverse Proxy with Certbot
```bash
apt-get install -y nginx certbot python3-certbot-nginx

# Configure /etc/nginx/sites-available/crm.yourdomain.com:
server {
    server_name crm.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

ln -s /etc/nginx/sites-available/crm.yourdomain.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Issue SSL certificate
certbot --nginx -d crm.yourdomain.com
```

Certbot will automatically configure HTTPS redirects and install the SSL certificate with auto-renewal.

---

## 7. Automated Backups Setup

Make the backup scripts executable and configure the daily cron:
```bash
chmod +x /opt/rohilla-crm/scripts/backup.sh
chmod +x /opt/rohilla-crm/scripts/restore.sh

# Add cron entry
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/rohilla-crm/scripts/backup.sh >> /var/log/rohilla-crm-backup.log 2>&1") | crontab -
```

---

## 8. Maintenance & Updating

When new code is pushed:
```bash
cd /opt/rohilla-crm
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --remove-orphans
docker image prune -af
```
