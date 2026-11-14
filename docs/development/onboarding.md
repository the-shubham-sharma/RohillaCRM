# Developer Onboarding: 10-Minute Codebase Tour

Welcome to the Rohilla Advertising CRM engineering team! This guide answers the essential questions you need to become productive within minutes.

---

## 1. Where is Everything?

| Question | Backend Location | Frontend Location |
| :--- | :--- | :--- |
| **Where is Authentication?** | `com.rohilla.crm.auth.*`, `com.rohilla.crm.security.*` | `src/features/auth/`, `src/services/api/authApi.ts` |
| **Where is Admin Functionality?** | `com.rohilla.crm.employee.*`, `com.rohilla.crm.audit.*` | `src/features/dashboard/AdminDashboard.tsx` |
| **Where is Manager Functionality?** | `com.rohilla.crm.lead.*`, `com.rohilla.crm.project.*` | `src/features/lead/LeadManagementPage.tsx` |
| **Where is Designer Functionality?** | `com.rohilla.crm.design.*`, `com.rohilla.crm.workspace.*` | `src/features/dashboard/DesignerWorkspace.tsx` |
| **Where is Production Functionality?** | `com.rohilla.crm.production.*`, `com.rohilla.crm.workspace.*` | `src/features/dashboard/ProductionWorkspace.tsx` |
| **Where is QC Functionality?** | `com.rohilla.crm.qc.*`, `com.rohilla.crm.workspace.*` | `src/features/dashboard/QcWorkspace.tsx` |
| **Where is Dispatch Functionality?** | `com.rohilla.crm.dispatch.*`, `com.rohilla.crm.workspace.*`| `src/features/dashboard/DispatchWorkspace.tsx` |
| **Where is Lead/Quote Functionality?**| `com.rohilla.crm.lead.*` | `src/features/lead/CustomerQuotePage.tsx` |
| **Where is Project Workflow?** | `com.rohilla.crm.project.workflow.*` | `src/features/project/ProjectDetailPage.tsx` |
| **Where are Notifications?** | `com.rohilla.crm.notification.*` | `src/shared/components/NotificationDropdown.tsx` |
| **Where are Files?** | `com.rohilla.crm.file.*` | `src/shared/components/FileUpload.tsx` |
| **Where are Employee Profiles & KYC?**| `com.rohilla.crm.employee.*` | `src/features/employee/` |
| **Where is Security & RBAC?** | `com.rohilla.crm.security.*` | `src/shared/context/AuthContext.tsx` |
| **Where are Database Repositories?** | `com.rohilla.crm.<feature>.repository.*` | N/A |
| **Where are DTOs?** | `com.rohilla.crm.<feature>.dto.*` | `src/shared/types/index.ts` |
| **Where are Routes / API Endpoints?** | `com.rohilla.crm.<feature>.controller.*` | `src/app/App.tsx`, `src/services/api/*` |
| **Where are Shared Components?** | N/A | `src/shared/components/*` |
| **Where are Helper Utilities?** | `com.rohilla.crm.common.util.*` | `src/shared/utils/*` |

---

## 2. Local Environment Setup

### Backend (Java 21 & Maven)
```bash
cd backend
mvn clean compile
mvn spring-boot:run
```

### Frontend (Node.js & Vite)
```bash
cd frontend
npm install
npm run dev
```

### Seeded Test Logins (Password: `password123`)
- **Admin:** `admin@rohilla.com`
- **Manager:** `manager@rohilla.com`
- **Designer:** `designer@rohilla.com`
- **Production:** `production@rohilla.com`
- **QC:** `qc@rohilla.com`
- **Dispatch:** `dispatch@rohilla.com`
