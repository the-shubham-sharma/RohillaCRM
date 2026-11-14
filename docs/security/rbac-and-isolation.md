# Security, RBAC & Client Confidentiality — Rohilla Advertising CRM

## 1. Role-Based Access Control (RBAC) Hierarchy

The CRM recognizes **6 internal roles**:

1. `ROLE_ADMIN`: Full administrative control, executive analytics, user management, and system-wide visibility.
2. `ROLE_MANAGER`: Operational project orchestration, workflow overrides, multi-department comparison matrix, client communication.
3. `ROLE_DESIGNER`: Design workstation, file versioning, Path A technical verification, customer feedback resolution.
4. `ROLE_PRODUCTION`: Machine scheduling, material consumption, job status transitions.
5. `ROLE_QC`: Quality inspections, rubric scoring, pass/reject verdicts, rework tickets.
6. `ROLE_DISPATCH`: Packing slips, courier tracking numbers, delivery confirmations, on-site installation sign-offs.

---

## 2. Insecure Direct Object Reference (IDOR) & Access Guards

### Method Security Annotations:
All controllers enforce fine-grained Spring Security SpEL expressions:
* Admin & Manager exclusive endpoints (e.g. `/api/v1/workspace/team-performance`, `/api/v1/workspace/company-performance`, `/api/v1/audit-logs`) use:
  ```java
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
  ```
* Project-specific operations check assignment via `ProjectSecurityEvaluator`:
  ```java
  @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or @projectSecurity.canAccessProject(authentication, #projectId)")
  ```

---

## 3. Client Confidentiality & Data Minimization

To protect commercial privacy, sensitive client information is stripped at the backend layer ([ProjectService.java](file:///d:/CRM2/backend/src/main/java/com/rohilla/crm/service/ProjectService.java)) before serialization:

| Field | Visible to ADMIN / MANAGER | Visible to Operational Staff (Designer, Production, QC, Dispatch) |
|---|---|---|
| Client Company Name | YES | YES |
| Client Contact Person | YES | YES |
| Client Email | YES | **MASKED (Empty)** |
| Client Phone Number | YES | **MASKED (Empty)** |
| GST Number | YES | **MASKED (Empty)** |
| Project Budget | YES | **MASKED (Null)** |

---

## 4. Authentication & Token Lifecycle

* **Password Hashing**: Argon2id password hashing with secure parameters (`saltLength=16`, `hashLength=32`, `memory=65536KB`, `iterations=3`). Zero plain-text password storage.
* **Temporary Passwords**: Onboarded employees receive high-entropy, auto-generated temporary credentials with `mustChangePassword=true`.
* **Mandatory First Login**: When an employee logs in with a temporary password, normal CRM screens are locked until `POST /api/v1/auth/change-password` is completed and `mustChangePassword=false`.
* **Access Token**: Short-lived (15 minutes) signed HMAC-SHA256 JWT.
* **Refresh Token**: Stored securely in database with 7-day expiration; supports token rotation on each refresh.
* **Rate Limiting**: Brute-force login protection enforced via token bucket algorithm.

---

## 5. Employee Onboarding & Task Assignment Security

### Operational Employee Creation
* `ADMIN` and `MANAGER` can onboard operational employees: `DESIGNER`, `PRODUCTION`, `QC`, `DISPATCH`.
* Creation of `ROLE_ADMIN` / `SUPER_ADMIN` accounts via employee onboarding is strictly rejected.
* Manager is barred from creating administrator accounts.
* Primary Owner (`admin@rohilla.com`) is protected and immutable; cannot be deactivated or suspended.

### Task Assignment Rules
* Managers can assign project tasks only to **ACTIVE** employees.
* Departmental role validation is enforced on the backend:
  * `DESIGN` tasks $\to$ only employees with `ROLE_DESIGNER` or `DepartmentType.DESIGN`.
  * `PRODUCTION` tasks $\to$ only employees with `ROLE_PRODUCTION` or `DepartmentType.PRODUCTION`.
  * `QUALITY_CONTROL` tasks $\to$ only employees with `ROLE_QC` or `DepartmentType.QUALITY_CONTROL`.
  * `DISPATCH` tasks $\to$ only employees with `ROLE_DISPATCH` or `DepartmentType.DISPATCH`.
* Cross-department assignments (e.g. Design $\to$ QC) are rejected with `IllegalArgumentException`.

### Employee Status Lifecycle
* **ACTIVE**: Can log in, receive task assignments, and appear in assignment dropdowns.
* **INACTIVE / SUSPENDED**: Cannot log in, cannot receive new assignments, and are excluded from assignment dropdowns.
* **Permanent History**: Deactivating or suspending an employee preserves all their previous completed work, inspection scores, and audit records forever.

