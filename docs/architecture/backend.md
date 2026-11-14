# Backend Architecture & Technical Guide

## 1. Domain-Driven Package Layout

The backend codebase (`d:/CRM2/backend/src/main/java/com/rohilla/crm`) is structured into bounded context modules:

```
com.rohilla.crm
├── common/                  # Shared infrastructure, error handling, base entities
│   ├── config/              # CORS, Jackson, Async, WebMvc configurations
│   ├── enums/               # Priority, DepartmentType, General enums
│   ├── exception/           # GlobalExceptionHandler, Custom Runtime Exceptions
│   ├── response/            # Standardized ApiResponse<T> wrapper
│   └── util/                # PhoneUtils (Indian +91 standardizer), Date/String helpers
│
├── security/                # Enterprise cryptographic and access control core
│   ├── authentication/      # CustomUserDetails, CustomUserDetailsService
│   ├── authorization/       # ProjectSecurityEvaluator (@projectSecurity)
│   ├── entity/              # Role, Permission JPA entities
│   ├── enums/               # RoleType (ADMIN, MANAGER, DESIGNER, PRODUCTION, QC, DISPATCH)
│   ├── jwt/                 # JwtTokenProvider, JwtAuthenticationFilter, JwtAuthEntryPoint
│   ├── rate_limit/          # Bucket4j In-Memory IP/Username Rate Limiter
│   └── repository/          # RoleRepository, PermissionRepository
│
├── auth/                    # User authentication and password management
│   ├── controller/          # AuthController (/api/v1/auth/login, /me, /refresh)
│   ├── dto/                 # AuthResponseDto, LoginRequest, UserSummaryDto
│   └── service/             # AuthService (Argon2id password verification, JWT issuance)
│
├── lead/                    # Inbound customer inquiry capture and lead pipeline
│   ├── controller/          # LeadController (/api/v1/leads), PublicCustomerController
│   ├── dto/                 # CustomerEnquiryRequest, LeadResponseDto, UpdateLeadStatusRequest
│   ├── entity/              # Lead JPA entity with tracking code
│   ├── enums/               # LeadStatus (NEW_LEAD, CONTACTED, QUALIFIED, CONVERTED, LOST)
│   ├── repository/          # LeadRepository with custom search queries
│   └── service/             # LeadService (Lead validation, Sequence generation, Conversion)
│
├── client/                  # Client enterprise profiles and contact records
│   ├── controller/          # ClientController (/api/v1/clients)
│   ├── dto/                 # ClientDto, CreateClientRequest
│   ├── entity/              # Client JPA entity with GST & custom JSON metadata
│   ├── repository/          # ClientRepository
│   └── service/             # ClientService (Strict Indian phone and GST validation)
│
├── employee/                # Staff directory, KYC records, status governance
│   ├── controller/          # UserController (/api/v1/users), ProfileController (/api/v1/profile)
│   ├── dto/                 # CreateUserRequest, KycDocumentDto, UpdateUserStatusRequest
│   ├── entity/              # User, KycDocument JPA entities
│   ├── enums/               # UserStatus (ACTIVE, INACTIVE, SUSPENDED, TERMINATED), KycStatus
│   ├── repository/          # UserRepository, KycDocumentRepository
│   └── service/             # UserService, KycVerificationService
│
├── project/                 # Core manufacturing project and workflow state machine
│   ├── controller/          # ProjectController (/api/v1/projects)
│   ├── dto/                 # CreateProjectRequest, ProjectDetailDto, ProjectResponseDto
│   ├── entity/              # Project JPA entity (Parent to design, production, qc, dispatch)
│   ├── enums/               # ProjectStatus (21 comprehensive state machine stages)
│   ├── repository/          # ProjectRepository (Complex joins, role-based assignment filters)
│   ├── service/             # ProjectService (Orchestrator for all sub-domain lifecycles)
│   └── workflow/            # WorkflowController, WorkflowTransitionService (State rules)
│
├── design/                  # Digital artwork management, proofing, approvals
│   ├── dto/                 # CustomerApprovalRequest, DesignFileDto, ManagerApprovalRequest
│   ├── entity/              # DesignFile JPA entity with version numbers & lock flags
│   └── repository/          # DesignFileRepository
│
├── production/              # Fabrication, print tasks, machine scheduling
│   ├── controller/          # ProductionController (/api/v1/production-tasks)
│   ├── dto/                 # CreateProductionTaskRequest, ProductionTaskDto
│   ├── entity/              # ProductionTask JPA entity
│   ├── repository/          # ProductionTaskRepository
│   └── service/             # ProductionService
│
├── qc/                      # Quality inspection scorecards, defect logging
│   ├── controller/          # QcController (/api/v1/projects/{id}/qc)
│   ├── dto/                 # QCEvaluationDto, RecordQcEvaluationRequest
│   ├── entity/              # QCEvaluation JPA entity (10-point scoring metrics)
│   ├── repository/          # QCEvaluationRepository
│   └── service/             # QcService (Auto-triggers rework or dispatch readiness)
│
├── dispatch/                # Logistics, fleet tracking, POD, installation
│   ├── controller/          # DispatchController (/api/v1/projects/{id}/dispatch)
│   ├── dto/                 # DispatchRecordDto, RecordDispatchRequest, RecordInstallationRequest
│   ├── entity/              # DispatchRecord JPA entity
│   ├── repository/          # DispatchRecordRepository
│   └── service/             # DispatchService (POD image linking, courier tracking)
│
├── workspace/               # Role-specialized aggregated departmental views
│   ├── controller/          # WorkspaceController (/api/v1/workspace)
│   └── service/             # WorkspaceService (Personalized queues for each of the 6 roles)
│
├── notification/            # In-app alerts, WhatsApp integration
│   ├── controller/          # NotificationController (/api/v1/notifications)
│   ├── dto/                 # NotificationDto
│   ├── entity/              # Notification JPA entity
│   ├── repository/          # NotificationRepository
│   └── service/             # NotificationService, WhatsAppNotificationService
│
├── file/                    # Disk and cloud file persistence
│   ├── controller/          # FileController (/api/v1/files)
│   └── service/             # FileStorageService (Path traversal sanitization, UUID keys)
│
├── audit/                   # Security audit trails and compliance
│   ├── controller/          # AuditLogController (/api/v1/audit-logs)
│   ├── dto/                 # AuditLogDto
│   ├── entity/              # AuditLog JPA entity
│   ├── enums/               # AuditAction
│   ├── repository/          # AuditLogRepository
│   └── service/             # AuditService (Non-blocking asynchronous audit publisher)
│
└── bootstrap/               # System initialization
    ├── DatabaseSeeder.java              # Development seeder (6 roles, projects, leads)
    └── ProductionBootstrapService.java  # Production seeder (Root admin, default roles)
```

---

## 2. Standardized Response Format

Every endpoint returns a unified JSON schema using `ApiResponse<T>`:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "errors": null,
  "timestamp": "2026-09-13T19:30:00.000Z"
}
```

In the event of an error:
```json
{
  "success": false,
  "data": null,
  "message": "Validation failed on request body",
  "errors": [
    "Phone number must contain exactly 10 digits",
    "Quantity must be greater than zero"
  ],
  "timestamp": "2026-09-13T19:30:00.000Z"
}
```
