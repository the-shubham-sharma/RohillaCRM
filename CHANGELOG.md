# Changelog

All notable changes to the Rohilla Advertising CRM will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2026-09-07

### Added
- **Phase 2 — Employee Onboarding, Login & Task Assignment**:
  - Operational employee creation by Admin/Owner and Manager for `DESIGNER`, `PRODUCTION`, `QC`, and `DISPATCH`.
  - Prohibited creation of `ROLE_ADMIN` / Super Admin accounts via onboarding flow.
  - Auto-generation of secure high-entropy temporary passwords hashed with Argon2id; zero plaintext password storage.
  - Mandatory **First Login Password Change** (`mustChangePassword`) enforced via `POST /api/v1/auth/change-password` and non-dismissible UI modal.
  - Manager active operational staff directory categorized by department (`DESIGN`, `PRODUCTION`, `QUALITY_CONTROL`, `DISPATCH`).
  - Strict backend-enforced departmental task assignment & reassignment (`POST /api/v1/projects/{projectId}/assign`). Cross-department assignment attempts (e.g. Design $\to$ QC) are rejected with `IllegalArgumentException`.
  - Real-time departmental notifications dispatched automatically to assigned/reassigned employees.
  - Employee status governance (`ACTIVE`, `INACTIVE`, `SUSPENDED`). Suspended/inactive employees cannot log in and cannot receive assignments; previous history is permanently preserved.
  - Primary Owner account (`admin@rohilla.com`) protection and immutability.
  - Comprehensive integration test suite (34/34 tests passing in `mvn test`).

---

## [1.2.0] - 2026-09-07

### Changed
- **UI Architecture Correction — Department Workstations**:
  - Main department dashboards (`My Design Work`, `My Production Work`, `My QC Inspections`, `My Dispatch Work`) now display exclusively active/pending tasks requiring immediate employee action.
  - Removed time filter bars, date range filters, and performance KPI cards from main pending work screens.
  - Dedicated **My History & Records** tab for all departments (`Designer`, `Production`, `QC`, `Dispatch`) housing time period filters (Today, This Week, This Month, Last Month, This Quarter, This Year, Custom Range), performance cards, and permanent completed task tables.
  - Separated Manager/Owner live pipeline from performance comparison and analytics tabs.

---

## [1.1.0] - 2026-09-07

### Added
- **Phase 1 Code Organization & Architecture**:
  - Structured documentation directory (`docs/architecture/`, `docs/workflows/`, `docs/api/`, `docs/database/`, `docs/security/`).
  - Frontend services layer (`frontend/src/services/`) with typed API methods.
  - Frontend hooks layer (`frontend/src/hooks/`) with `useAuth`, `useDebounce`, `useLocalStorage`, `useDocumentTitle`.
  - Frontend utils layer (`frontend/src/utils/`) with date formatters, currency (INR ₹), file size calculators, and file storage helpers.
  - Frontend assets layer (`frontend/src/assets/`).
  - Safe predictable file storage path generation (`projects/{projectId}/{category}/{uuid}_{safeName}`) in `FileStorageService.java`.
  - Comprehensive `README.md` and `docs/developer-guidelines.md` outlining mandatory developer standards.

### Verified
- 27/27 automated integration tests passing in `mvn test`.
- TypeScript and Vite production bundle clean build (`npm run build`).

---

## [1.0.0] - 2026-09-07

### Added
- **Department-Specific Workspaces & History**:
  - Role-specific workstations for `DESIGNER`, `PRODUCTION`, `QC`, and `DISPATCH` partitioned into Active Work, Waiting on Review, and Recent Work.
  - Permanent Work History tables with dynamic date range filtering (Today, This Week, This Month, Last Month, This Quarter, This Year, Custom Range).
  - Mathematical performance metric calculations backed by real database timestamps.
  - Operations Manager Department Comparison Matrix and Owner Executive Analytics.
  - Client data minimization & confidentiality masking (email, phone, GST, budget masked for operational roles).
- **Core Advertising CRM Workflows**:
  - Path A (Customer Provided Design technical check) and Path B (In-House Creative Design & Customer Proof Approval).
  - Production job scheduling and machine allocation.
  - 10-point Quality Control scoring and defect logging.
  - Dispatch courier tracking and on-site installation sign-offs.
  - Complete immutable audit logging (`/api/v1/audit-logs`).
