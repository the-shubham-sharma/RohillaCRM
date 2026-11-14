# Enterprise Architecture Overview

## 1. System Vision & Core Principles

The Rohilla Advertising CRM is an industrial-grade ERP/CRM designed specifically for advertising production, digital printing, acrylic/LED fabrication, and on-site signage installation.

### Key Architectural Pillars:
1. **Domain-Driven Design (DDD) & Modular Bounded Contexts:**
   - Every business capability (Auth, Security, Lead, Client, Employee, Project, Design, Production, QC, Dispatch, Audit, Notification) represents an independent cohesive domain package.
   - High cohesion within modules; loose coupling between modules via clearly defined interfaces and DTOs.
2. **SOLID & Clean Architecture Principles:**
   - Single Responsibility Principle across dedicated controllers, services, and repositories.
   - Dependency Inversion via Spring Inversion of Control (IoC) and constructor injection.
   - Open-Closed Principle via extensible workflow state machine rules.
3. **Defense-in-Depth Security:**
   - Argon2id cryptographic password hashing (`memoryCost: 65536`, `iterations: 3`, `parallelism: 1`).
   - Stateless HMAC-SHA512 JWT bearer token authentication with IP-aware rate limiting.
   - Fine-grained Spring `@PreAuthorize` method security coupled with domain `ProjectSecurityEvaluator`.
4. **Tamper-Evident Audit Logging:**
   - Asynchronous, non-blocking event publishing capturing every state change, staff reassignment, approval, login attempt, and document verification.

---

## 2. Global Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  USER / CLIENT LAYER                              |
|                                                                                   |
|   +--------------------------+                         +----------------------+   |
|   |  Public Customer Portal  |                         |  Internal Workspace  |   |
|   |   Quote & Artwork Upload |                         |  6 Role Dashboards   |   |
|   +-------------+------------+                         +----------+-----------+   |
+-----------------|-------------------------------------------------|---------------+
                  |                                                 |
                  v                                                 v
+-----------------------------------------------------------------------------------+
|                             FRONTEND LAYER (Vite + React 18)                      |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   | Routes: / (Gateway) | /customer-quote | /employee-login | /dashboard | ...    |   |
|   +---------------------------------------------------------------------------+   |
|   | Features: auth/ | lead/ | dashboard/ | project/ | employee/ | audit/          |   |
|   +---------------------------------------------------------------------------+   |
|   | Services: api/client.ts | authApi | leadApi | projectApi | employeeApi | ...  |   |
|   +---------------------------------------------------------------------------+   |
|   | Shared: Navigation | Modals | StatusBadges | ThemeTokens | GlobalContext      |   |
+-----------------------------------------------------------------------------------+
                                          |
                              HTTP / REST JSON (Proxy 5173 -> 8080)
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                             BACKEND API LAYER (Spring Boot 3.3.5)                 |
|                                                                                   |
|   +---------------------+   +---------------------+   +---------------------+     |
|   | Public Controllers  |   | Security & Auth     |   | Role Controllers    |     |
|   | (Quote/File Upload) |   | (JWT / Argon2id)    |   | (Projects/QC/Etc)   |     |
|   +----------+----------+   +----------+----------+   +----------+----------+     |
|              |                         |                         |                |
|              v                         v                         v                |
|   +-------------------------------------------------------------------------+     |
|   |                          DOMAIN SERVICE LAYER                           |     |
|   | LeadService | ProjectService | WorkflowService | QcService | ...        |     |
|   +------------------------------------+------------------------------------+     |
|                                        |                                          |
|                                        v                                          |
|   +-------------------------------------------------------------------------+     |
|   |                       DATA ACCESS LAYER (Spring Data JPA)               |     |
|   | LeadRepo | ProjectRepo | ClientRepo | UserRepo | DesignFileRepo | ...   |     |
|   +------------------------------------+------------------------------------+     |
+----------------------------------------|------------------------------------------+
                                         v
+-----------------------------------------------------------------------------------+
|                             PERSISTENCE & STORAGE LAYER                           |
|                                                                                   |
|   +----------------------------------+    +-----------------------------------+   |
|   | Database (H2 Dev / Postgres Prod)|    | Local / S3 Secure File Storage    |   |
|   +----------------------------------+    +-----------------------------------+   |
+-----------------------------------------------------------------------------------+
```

---

## 3. Data Flow Model

1. **Intake:** Inbound enquiry submitted at `/customer-quote` -> validated with Indian 10-digit mobile rule -> stored in `leads` table with generated reference `LEAD-YYYY-NNNN` -> in-app notification pushed to Managers and Admins.
2. **Conversion:** Manager reviews lead in CRM -> clicks "Convert to Project" -> Client record automatically created/matched -> Project record created with code `PRJ-YYYY-NNN` -> Initial status set to `MANAGER_REVIEW`.
3. **Dual-Path Routing:**
   - **Path A (Customer Artwork):** Manager assigns Designer -> Designer runs technical check -> System transitions directly to `READY_FOR_PRODUCTION`.
   - **Path B (Design Required):** Manager assigns Designer -> Designer submits proofs -> Customer approves -> Manager locks final production version -> System transitions to `READY_FOR_PRODUCTION`.
4. **Manufacturing & QC:** Production Master fab/prints job -> marks `PRODUCTION_COMPLETED` -> triggers `QC_PENDING` alert -> QC Inspector scores 10-point checklist -> if Passed, moves to `READY_FOR_DISPATCH`; if Failed, automatically returns to `IN_PRODUCTION` with logged defect notes.
5. **Dispatch & Handover:** Dispatch Officer inputs tracking number and driver details -> marks `DISPATCHED` -> upon physical installation, uploads POD proof and client sign-off -> marks `COMPLETED` -> automated WhatsApp customer satisfaction message queued.
