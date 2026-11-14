# Security Architecture & Cryptographic Standards

## 1. Password Hashing (Argon2id)

Rohilla CRM uses state-of-the-art **Argon2id** password hashing (`com.rohilla.crm.security.authentication.CustomUserDetailsService` and `DatabaseSeeder`). Argon2id provides maximum resilience against GPU cracking attacks and side-channel timing attacks.

- **Type:** Argon2id (Hybrid Data-Independent and Data-Dependent memory addressing)
- **Salt Length:** 16 bytes
- **Hash Length:** 32 bytes
- **Iterations (Time Cost):** 3
- **Memory Cost:** 65,536 KiB (64 MiB)
- **Parallelism:** 1 thread

---

## 2. JWT Authentication & Bearer Tokens

- **Algorithm:** HMAC-SHA512 (`HS512`)
- **Key Strength:** 512-bit cryptographically secure secret
- **Access Token Lifetime:** 15 minutes (`900,000 ms`)
- **Refresh Token Lifetime:** 7 days (`604,800,000 ms`)
- **Claims:** Subject (`User ID`), Email, Full Name, Roles, Permissions, IssuedAt, Expiration

---

## 3. Method-Level Security & Custom Evaluators

All sensitive controller endpoints are protected using Spring `@PreAuthorize`:

```java
@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or @projectSecurity.canPerformDesignAction(authentication, #projectId)")
```

### `ProjectSecurityEvaluator` Logic:
1. **Admins & Managers:** Granted overarching administrative access to view and orchestrate all projects.
2. **Specialized Department Staff (Design, Production, QC, Dispatch):** Granted access **only** to projects specifically assigned to their employee profile ID.
3. **Deactivated Staff:** Any employee with status `INACTIVE`, `SUSPENDED`, or `TERMINATED` is rejected at authentication filter level and barred from receiving new task assignments.

---

## 4. Rate Limiting & Brute Force Defense

- Implemented via `RateLimiterService` using the Token Bucket algorithm.
- Public Quote submission (`/api/v1/public/leads`): 10 requests per minute per IP.
- Authentication endpoint (`/api/v1/auth/login`): 5 requests per minute per IP / username.
- Exceeded thresholds return `HTTP 429 Too Many Requests` with retry headers.

---

## 5. Tamper-Evident Audit Logging

The `AuditService` asynchronously logs every significant system event to the `audit_logs` table:
- `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`
- `PASSWORD_CHANGED`, `USER_STATUS_UPDATED`
- `PROJECT_CREATED`, `PROJECT_ASSIGNED`, `PROJECT_STATUS_TRANSITION`
- `TECHNICAL_CHECK_RECORDED`, `CUSTOMER_APPROVAL`, `MANAGER_APPROVAL`
- `QC_INSPECTED`, `DISPATCH_RECORDED`, `INSTALLATION_COMPLETED`
- `KYC_DOCUMENT_UPLOADED`, `KYC_VERIFIED`, `KYC_REJECTED`
