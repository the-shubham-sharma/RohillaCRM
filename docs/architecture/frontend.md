# Frontend Architecture & Technical Guide

## 1. Feature-Driven Directory Structure

The frontend application (`d:/CRM2/frontend/src`) follows a feature-driven modular structure:

```
frontend/src/
├── app/
│   ├── App.tsx                  # Root application router and route guards
│   ├── App.css                  # Global application layout stylesheets
│   └── main.tsx                 # React DOM mount point & strict mode provider
│
├── features/                    # Domain-specific feature modules
│   ├── gateway/
│   │   ├── GatewayPage.tsx      # Entry gateway (Customer vs Employee selection)
│   │   └── GatewayPage.css      # Gateway styling and animations
│   ├── auth/
│   │   ├── LoginPage.tsx        # Internal employee login form
│   │   └── LoginPage.css        # Login styling
│   ├── lead/
│   │   ├── CustomerQuotePage.tsx # Public self-service quote request form
│   │   ├── CustomerQuotePage.css # Quote form layout and feedback animations
│   │   └── LeadManagementPage.tsx # Internal Manager CRM Lead Board & 1-Click Convert
│   ├── dashboard/
│   │   ├── AdminDashboard.tsx   # Executive metrics, project table, status filters
│   │   ├── RoleWorkspacePage.tsx # Dynamic workspace adapter for Designer/Prod/QC/Dispatch
│   │   ├── DesignerWorkspace.tsx # Compatibility checking & design upload tools
│   │   ├── ProductionWorkspace.tsx # Production task manager & status toggles
│   │   ├── QcWorkspace.tsx      # 10-point QC scorecard modal & defect reporter
│   │   └── DispatchWorkspace.tsx # Courier dispatch logger & installation signer
│   ├── project/
│   │   ├── ProjectDetailPage.tsx # Comprehensive single project 360-degree view
│   │   ├── ProjectFormModal.tsx # New project creation & client picker modal
│   │   └── ProjectHistoryPage.tsx # Completed and archived project registry
│   ├── employee/
│   │   ├── EmployeeManagementPage.tsx # Staff directory, status toggle, KYC reviewer
│   │   ├── EmployeeFormModal.tsx # Create staff dialog with role assignments
│   │   └── EmployeeProfilePage.tsx # Self-service profile editor & KYC uploader
│   └── audit/
│       └── AuditLogsPage.tsx    # Compliance audit log viewer with actor/action filters
│
├── services/
│   ├── apiService.ts            # Centralized typed API service façade
│   └── api/                     # Domain-specific API client endpoints
│       ├── client.ts            # Axios HTTP instance with JWT interceptors
│       ├── authApi.ts           # Login, logout, refresh, getMe
│       ├── leadApi.ts           # Public quote submit, CRM lead list, convert
│       ├── projectApi.ts        # Projects CRUD, assign staff, approvals
│       ├── clientApi.ts         # Client directory endpoints
│       ├── employeeApi.ts       # Staff CRUD, status updates, KYC upload/verify
│       ├── notificationApi.ts   # In-app alerts query & mark-as-read
│       ├── workspaceApi.ts      # Role-specific department work aggregations
│       ├── auditApi.ts          # Audit trail query client
│       └── index.ts             # Barrel exports
│
└── shared/
    ├── components/              # Reusable UI widgets
    │   ├── Navbar.tsx           # Global header with active user profile & notifications
    │   ├── Sidebar.tsx          # Role-filtered navigation menu
    │   ├── Modal.tsx            # Accessible modal container with backdrop
    │   ├── ConfirmDialog.tsx    # Reusable confirmation modal
    │   ├── FileUpload.tsx       # Drag-and-drop file upload with progress bar
    │   ├── StatusBadge.tsx      # Color-coded workflow status chips
    │   ├── PriorityBadge.tsx    # High/Medium/Low visual indicators
    │   └── NotificationDropdown.tsx # Real-time alerts popup
    ├── context/
    │   └── AuthContext.tsx      # React Context holding user session, tokens & RBAC helpers
    ├── types/
    │   └── index.ts             # Complete TypeScript interfaces mirroring backend DTOs
    └── utils/
        ├── formatters.ts        # Date, currency (INR ₹), and text formatters
        └── validators.ts        # Indian mobile number and GST regex validators
```

---

## 2. API Service Layer & Axios Interceptors

All outbound HTTP requests route through `src/services/api/client.ts`. The client automatically attaches the `Authorization: Bearer <token>` header from `localStorage`.

When a 401 Unauthorized occurs on protected routes:
1. Clears expired authentication tokens.
2. Redirects the user directly to `/employee-login`.
3. Displays a notification explaining the session expiry.

---

## 3. Route Access Control Strategy

| Route | Accessibility | Component | Description |
| :--- | :--- | :--- | :--- |
| `/` | Public | `<GatewayPage />` | Welcome gateway asking visitor identity |
| `/customer-quote` | Public | `<CustomerQuotePage />` | Quote intake form |
| `/employee-login` | Public | `<LoginPage />` | Employee JWT authentication form |
| `/dashboard` | Authenticated | `<AdminDashboard />` | Primary workspace / Executive view |
| `/workspace` | Role-Filtered | `<RoleWorkspacePage />` | Department queue (Design/Prod/QC/Disp) |
| `/leads` | Admin / Manager | `<LeadManagementPage />` | CRM Lead board & 1-Click Convert |
| `/projects/:id` | Assigned / Admin | `<ProjectDetailPage />` | Full project workflow details |
| `/employees` | Admin / Manager | `<EmployeeManagementPage />` | Employee directory & KYC governance |
| `/audit-logs` | Admin / Manager | `<AuditLogsPage />` | Audit trails & security logs |
