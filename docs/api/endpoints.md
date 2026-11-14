# REST API Specification — Rohilla Advertising CRM

Base URL: `http://localhost:8080/api/v1`

---

## 1. Authentication Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Authenticate user with email and password. Returns access & refresh JWTs. |
| `POST` | `/auth/refresh` | Public | Issue new access token using valid refresh token. |
| `POST` | `/auth/logout` | Authenticated | Revoke refresh token and invalidate session. |
| `GET` | `/auth/me` | Authenticated | Fetch current authenticated user profile and roles. |

---

## 2. Department Workspace Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/workspace/my-workspace` | Operational Staff / All | Get current user's role-scoped workstation (Active, Waiting, Recent). |
| `GET` | `/workspace/my-history` | Operational Staff / All | Query permanent work history with date filters (`filter`, `startDate`, `endDate`). |
| `GET` | `/workspace/my-metrics` | Operational Staff / All | Get authentic performance metrics for current user. |
| `GET` | `/workspace/team-performance` | `ADMIN`, `MANAGER` | Cross-department performance comparison matrix. |
| `GET` | `/workspace/company-performance` | `ADMIN`, `MANAGER` | Executive company analytics and department workload breakdown. |

---

## 3. Project Management Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/projects` | All Authenticated | Paginated project list (filtered by role scope for operational staff). |
| `GET` | `/projects/{id}` | All Authenticated | Get project details (client contact & budget masked for operational staff). |
| `POST` | `/projects` | `ADMIN`, `MANAGER` | Create new advertising project. |
| `PUT` | `/projects/{id}` | `ADMIN`, `MANAGER` | Update project metadata. |
| `POST` | `/projects/{id}/transition` | Role-Appropriate | Transition project status along state machine with audit notes. |

---

## 4. File Management Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/projects/{projectId}/files` | Assigned Staff / Admin | Upload design file/artwork with Tika validation. |
| `GET` | `/files/{fileId}/download` | Assigned Staff / Admin | Download project file as stream. |

---

## 5. Department Execution Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/projects/{projectId}/qc` | `ROLE_QC`, `MANAGER`, `ADMIN` | Record quality control inspection scores & remarks. |
| `POST` | `/projects/{projectId}/dispatch` | `ROLE_DISPATCH`, `MANAGER`, `ADMIN` | Record dispatch details, courier partner, tracking number. |
| `POST` | `/projects/{projectId}/production/tasks` | `ROLE_PRODUCTION`, `MANAGER`, `ADMIN` | Create or update production run task. |

---

## 6. Audit Logs & System Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/audit-logs` | `ROLE_ADMIN`, `ROLE_MANAGER` | Query immutable system audit logs with filtering. |
| `GET` | `/notifications` | All Authenticated | Get current user's unread notifications. |
| `PUT` | `/notifications/{id}/read` | All Authenticated | Mark notification as read. |
