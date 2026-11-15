# Production Deployment Guide: GitHub, Render & Hostinger

This guide covers deploying the **Rohilla Advertising CRM** across:
1. **GitHub**: Monorepo source code repository.
2. **Render**: Java 21 Spring Boot backend web service (Docker runtime) + Render PostgreSQL database + Persistent Disk.
3. **Hostinger**: React TypeScript SPA static hosting (Apache `public_html`) on your custom domain.

---

## Architecture Overview

```
                      +---------------------------------------+
                      |               CLIENT                  |
                      |   Browser (Web & Mobile Responsive)   |
                      +-------------------+-------------------+
                                          |
                                          | HTTPS / SSL
                                          v
+-----------------------------------------+-----------------------------------------+
| HOSTINGER STATIC HOSTING                                                          |
| Path: public_html/                                                                |
| Domain: https://crm.yourdomain.com                                                |
| Files: React SPA (dist/index.html, dist/assets/, dist/.htaccess)                  |
| Fallback: Apache mod_rewrite to index.html for direct route reloads               |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          | REST API / JSON (HTTPS + CORS + JWT)
                                          v
+-----------------------------------------+-----------------------------------------+
| RENDER WEB SERVICE (Docker Runtime)                                               |
| Service: Spring Boot 3.3.5 / Java 21 Temurin (Non-Root crmuser)                  |
| Endpoint: https://rohilla-crm-backend.onrender.com                                |
| Root Directory: backend                                                           |
| Port: Dynamically binds to $PORT (0.0.0.0)                                        |
| Health Check: /actuator/health                                                    |
+-------------------+-----------------------------------------+---------------------+
                    |                                         |
                    | JDBC / SSL (Private Network)            | Persistent Filesystem Mount
                    v                                         v
+-------------------+---------------------+ +-----------------+---------------------+
| RENDER MANAGED POSTGRESQL               | | RENDER PERSISTENT DISK                |
| Engine: PostgreSQL 16                   | | Mount Path: /var/rohilla/storage      |
| Connection: Internal Database URL       | | Retains: Design files & KYC documents |
+-----------------------------------------+ +---------------------------------------+
```

---

## Phase A: Push the Monorepo to GitHub

1. **Verify your local Git working tree**:
   Open a terminal in `D:\CRM2`:
   ```bash
   git status
   ```
   Ensure `.env`, `node_modules/`, `target/`, and private files are ignored.

2. **Stage your files**:
   ```bash
   git add .
   ```

3. **Commit the production deployment preparations**:
   ```bash
   git commit -m "chore: prepare CRM for GitHub, Render, and Hostinger deployment"
   ```

4. **Add your GitHub remote** (if not already set):
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   ```

5. **Push to GitHub**:
   ```bash
   git branch -M main
   git push -u origin main
   ```

---

## Phase B & C: Setup Render PostgreSQL & Backend Web Service

### 1. Create Render PostgreSQL
1. Sign in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **PostgreSQL**.
3. Fill in the details:
   - **Name**: `rohilla-crm-db`
   - **Database**: `rohilla_crm`
   - **User**: `rohilla_user`
   - **Region**: Choose the region closest to your users (e.g. Frankfurt, Singapore, or Oregon).
   - **Plan**: Select your tier (Free or Starter).
4. Click **Create Database**.
5. Once provisioned, note the **Internal Database URL** (e.g. `postgresql://rohilla_user:PASSWORD@dpg-xxxxxx-a:5432/rohilla_crm`).

---

### 2. Create Render Backend Web Service
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Select **Build and deploy from a Git repository**.
3. Connect your GitHub repository containing the CRM monorepo.
4. Configure the Web Service:
   - **Name**: `rohilla-crm-backend`
   - **Region**: *Same region as your PostgreSQL database* (for free internal private network speed).
   - **Branch**: `main`
   - **Root Directory**: `backend` *(Crucial: tells Render to build inside backend/)*
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `Dockerfile` (or `backend/Dockerfile` if Root Directory is left empty)
   - **Instance Type**: Starter (or Free tier)

---

### 3. Attach Render Persistent Disk (For Private Documents & Designs)
1. In your Web Service settings on Render, navigate to **Disks** in the sidebar.
2. Click **Add Disk**:
   - **Name**: `crm-storage`
   - **Mount Path**: `/var/rohilla/storage`
   - **Size**: 1 GB (or more depending on expected upload volume)
3. Save changes.

---

### 4. Configure Render Environment Variables (Phase D)
In your Render Web Service settings, go to the **Environment** tab and add the following variables:

| Environment Variable | Value | Purpose |
|----------------------|-------|---------|
| `SPRING_PROFILES_ACTIVE` | `prod` | Enables PostgreSQL, non-destructive schema update (`ddl-auto: update`), and production bootstrap |
| `DATABASE_URL` | *Paste your Render Internal Database URL* | Connects backend to database using Render's fast private network |
| `JWT_SECRET` | *64-byte random hex string* | Signs and validates access tokens (`openssl rand -hex 64`) |
| `REFRESH_TOKEN_SECRET` | *64-byte random hex string* | Signs and validates refresh tokens (`openssl rand -hex 64`) |
| `CORS_ALLOWED_ORIGINS` | `https://crm.yourdomain.com` | Restricts API access strictly to your Hostinger frontend domain |
| `STORAGE_BASE_PATH` | `/var/rohilla/storage` | Points file storage to the mounted persistent disk |
| `INITIAL_OWNER_EMAIL` | `owner@rohilla.com` | First administrator account created on startup |
| `INITIAL_OWNER_PASSWORD` | `YourSecurePasswordHere!` | Initial password for the administrator |
| `INITIAL_OWNER_NAME` | `Aditye Rohilla` | Display name of the owner |
| `INITIAL_OWNER_PHONE` | `+91-9811000000` | Contact phone number |

> [!NOTE]
> The backend automatically detects `postgres://` or `postgresql://` in `DATABASE_URL` and formats it for JDBC with SSL automatically.
> You do **not** need to manually alter Render's internal URL.

### 5. Health Check Path
In Render Web Service settings under **Advanced**:
- **Health Check Path**: `/actuator/health`

Click **Create Web Service** (or **Manual Deploy** -> **Deploy latest commit**).
Wait for the build to finish. Once live, Render gives you a public URL such as `https://rohilla-crm-backend.onrender.com`.

---

## Phase E & F: Frontend Build & Hostinger Deployment

### 1. Build Frontend Locally
1. In `D:\CRM2\frontend`, set your production API base URL:
   Create or edit `frontend/.env.production` (or set the environment variable in your terminal):
   ```env
   VITE_API_BASE_URL=https://rohilla-crm-backend.onrender.com/api/v1
   ```

2. Run the production build:
   ```bash
   cd D:\CRM2\frontend
   npm run build
   ```

3. Verify the generated output in `frontend/dist/`:
   ```bash
   Get-ChildItem frontend/dist -Force
   ```
   You should see:
   - `index.html`
   - `assets/` (bundled JS and CSS)
   - `.htaccess` (Apache routing fallback and security headers)

---

### 2. Upload to Hostinger `public_html`
1. Log in to your **Hostinger hPanel**.
2. Go to **Websites** -> Select your CRM domain (e.g., `crm.yourdomain.com`).
3. Open **File Manager** (or connect via FileZilla / SFTP).
4. Navigate to `domains/crm.yourdomain.com/public_html` (or `public_html` for primary domain).
5. Ensure the directory is empty (or remove default `default.php`).
6. Upload all contents of `frontend/dist/` directly into `public_html`:
   - `index.html`
   - `.htaccess`
   - `assets/` directory

> [!IMPORTANT]
> Upload the **contents** of `dist/`, not the `dist` folder itself. `index.html` must sit directly in `public_html`.
> Ensure hidden files are visible in Hostinger File Manager so `.htaccess` is uploaded.

---

## Phase G: Domain, HTTPS, and CORS Verification

1. **Hostinger SSL**:
   - In Hostinger hPanel, go to **Security** -> **SSL**.
   - Verify that an active Let's Encrypt SSL certificate is installed for your CRM domain.
   - Enable **Force HTTPS**.

2. **CORS Alignment**:
   - Verify that `CORS_ALLOWED_ORIGINS` in your Render Web Service matches the exact domain (e.g. `https://crm.yourdomain.com` without trailing slash).

---

## Phase H: Post-Deployment Verification Checklist

Execute these checks after deployment:

1. **Backend Health Check**:
   Open in your browser or curl:
   ```bash
   curl -i https://rohilla-crm-backend.onrender.com/actuator/health
   ```
   *Expected response*: HTTP 200 `{"status":"UP"}`.

2. **Frontend Loading**:
   Visit `https://crm.yourdomain.com`.
   *Expected result*: CRM portal displays with clean styling and asset loading (no console errors).

3. **Apache Direct Route Refresh**:
   Navigate directly to `https://crm.yourdomain.com/employee-login` and press `Ctrl+F5` (Hard Refresh).
   *Expected result*: The page reloads cleanly without 404 Not Found error (verifies `.htaccess` rewrite rule).

4. **Production Admin Login**:
   - Log in using your configured `INITIAL_OWNER_EMAIL` and `INITIAL_OWNER_PASSWORD`.
   - If `INITIAL_OWNER_PASSWORD` was left empty, check your Render service logs for the auto-generated temporary password.
   - On first login, the mandatory **First Login Password Change** modal will appear. Complete password update.

5. **File Upload Verification**:
   - Go to a project or your Profile page.
   - Upload a profile photo or design file (e.g., a `.pdf` or `.png`).
   - Download the file to verify end-to-end persistent disk write/read and role-based download authorization.

6. **Log Inspection**:
   - Review Render service logs: ensure no stack traces or database connection pool timeouts.
