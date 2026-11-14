# Rohilla Advertising CRM — Enterprise Platform Architecture

> **Production-Grade Manufacturing & Advertising Operations Management System**  
> Engineered with Spring Boot (Java 21), React 18 (TypeScript), Argon2id Cryptographic Security, and Automated Lifecycle Workflows.

---

## 1. System Overview

Rohilla Advertising CRM is an end-to-end operational platform tailored for custom advertising signage, large-format printing, fabrication, and installation enterprises. The platform bridges customer self-service inquiry capture with internal role-based department execution across **Design**, **Production**, **Quality Control (QC)**, **Dispatch**, **Installation**, and **Management**.

```
                           +-------------------------------------+
                           |      Public Entry Gateway (/)       |
                           +------------------+------------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v                                                 v
      +------------------------------+                  +------------------------------+
      |  Customer Quote Request Form |                  |   Internal Employee Login    |
      |      (/customer-quote)       |                  |      (/employee-login)       |
      +--------------+---------------+                  +--------------+---------------+
                     |                                                 |
                     v                                                 v
      +------------------------------+                  +------------------------------+
      |  Public Lead Ingestion API   |                  | JWT Bearer RBAC Authenticator|
      |   (Strict Phone Validation)  |                  |    (Argon2id Hash Verify)    |
      +--------------+---------------+                  +--------------+---------------+
                     |                                                 |
                     +------------------------+------------------------+
                                              |
                                              v
                              +-------------------------------+
                              |    Manager / Admin Pipeline   |
                              |   Lead Review & 1-Click Conv. |
                              +---------------+---------------+
                                              |
                       +----------------------+----------------------+
                       |                                             |
                       v                                             v
        +-----------------------------+               +-----------------------------+
        |  PATH A: Customer Artwork   |               |  PATH B: Custom Design Req. |
        |  - Machine Check & Profiling|               |  - Multi-version Artwork    |
        |  - Direct Production Queue  |               |  - Client Proof Approval    |
        |                             |               |  - Manager Version Locking  |
        +--------------+--------------+               +--------------+--------------+
                       |                                             |
                       +----------------------+----------------------+
                                              |
                                              v
                              +-------------------------------+
                              |       Production Queue        |
                              |  Fabrication, Print & Assembly|
                              +---------------+---------------+
                                              |
                                              v
                              +-------------------------------+
                              |     Quality Control (QC)      |
                              |  10-Point Scorecard & Pass    |
                              +-------+---------------+-------+
                                      |               |
                         [FAILED REWORK]             [PASSED]
                                      |               |
                                      +-------+       v
                                              | +-------------------------------+
                                              | |       Dispatch & Courier      |
                                              | | Vehicle/POD Logistics Tracking|
                                              | +---------------+---------------+
                                              |                 |
                                              |                 v
                                              | +-------------------------------+
                                              | |     Installation & Proof      |
                                              | | Client Sign-off & Completion  |
                                              | +---------------+---------------+
                                              |                 |
                                              |                 v
                                              | +-------------------------------+
                                              | |     Automated WhatsApp Notif. |
                                              | |  Customer Satisfaction Alert  |
                                              | +-------------------------------+
                                              v
                                   (Returns to Production)
```

---

## 2. Technology Stack & Prerequisites

### Backend Architecture
- **Language & Runtime:** Java 21 LTS (OpenJDK)
- **Framework:** Spring Boot 3.3.5
- **Security:** Spring Security 6, Argon2id Password Hashing, JWT (HMAC-SHA512)
- **Persistence:** Spring Data JPA / Hibernate 6.5, HikariCP, H2 In-Memory (Dev) / PostgreSQL (Prod)
- **Validation:** Jakarta Bean Validation (Hibernate Validator 8.0)
- **Build System:** Apache Maven 3.9+

### Frontend Architecture
- **Framework:** React 18 with TypeScript 5
- **Build Tool:** Vite 5.4
- **Routing:** React Router v6
- **Styling:** Modular CSS & Enterprise Design Tokens (No Tailwind dependency)
- **Icons:** Lucide React

---

## 3. Modular Architecture Directory Mapping

### Backend (`com.rohilla.crm.*`)
```
backend/src/main/java/com/rohilla/crm/
├── common/              # Cross-cutting configs, exception handlers, API responses, utility functions
├── security/            # Argon2id, JWT filters, Spring Security configs, RBAC Evaluators
├── auth/                # User authentication, refresh tokens, login controllers & DTOs
├── lead/                # Public quote intake, CRM lead management, one-click conversion
├── client/              # Client records, CRM client profiles, GST & address validation
├── employee/            # Employee management, KYC verification, status lifecycle, user CRUD
├── project/             # Core project entity, project creation, status transitions, state machine
├── design/              # Design files, versioning, customer approval, technical checks
├── production/          # Production task scheduling, material tracking, progress updates
├── qc/                  # Quality control inspection scorecards, defect logging, rework routing
├── dispatch/            # Logistics dispatch records, POD tracking, vehicle & driver logging
├── workspace/           # Role-based workspace dashboards (Designer, Production, QC, Dispatch)
├── notification/        # In-app notifications, webhooks, WhatsApp integration service
├── file/                # Secure local/cloud file storage service, upload controllers
├── audit/               # Tamper-evident audit logging, security event tracking
└── bootstrap/           # Database seeders, role & permission initializers
```

### Frontend (`frontend/src/*`)
```
frontend/src/
├── app/                 # App routing, entry wrapper, global layout shell
├── features/            # Feature-driven modular pages and domain components
│   ├── gateway/         # First-entry gateway selector (Customer vs Employee)
│   ├── auth/            # Employee Login and authentication views
│   ├── lead/            # Customer Quote form and Manager CRM lead board
│   ├── dashboard/       # Executive metrics, project grids, role workspace views
│   ├── project/         # Project lifecycle details, dual-path approval modals, task bars
│   ├── employee/        # Employee management, KYC upload, role assignment
│   └── audit/           # Audit trail logs and compliance viewers
├── services/api/        # Modular Axios/Fetch domain clients (auth, lead, project, qc, etc.)
└── shared/              # Reusable UI primitives, modal dialogues, navigation bars, type definitions
```

---

## 4. Role-Based Access Control (RBAC) Matrix

| Feature / Action | Admin | Manager | Designer | Production | QC | Dispatch |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Public Quote Intake** | Public | Public | Public | Public | Public | Public |
| **Lead Board & 1-Click Convert** | Full | Full | - | - | - | - |
| **Client Management** | Full | Full | Read (Assigned) | Read (Assigned) | Read (Assigned) | Read (Assigned) |
| **Task Assignment & Reassignment**| Full | Full | - | - | - | - |
| **Design Upload & Tech Checks** | Full | Full | Assigned | - | - | - |
| **Customer / Manager Approval** | Full | Full | - | - | - | - |
| **Production Execution** | Full | Full | - | Assigned | - | - |
| **QC Inspection & Scoring** | Full | Full | - | - | Assigned | - |
| **Dispatch & POD Recording** | Full | Full | - | - | - | Assigned |
| **Installation Sign-off** | Full | Full | - | - | - | Assigned |
| **User & KYC Management** | Full | Full | Profile Only | Profile Only | Profile Only | Profile Only |
| **Audit Logs Viewing** | Full | Full | - | - | - | - |

---

## 5. Quick Start Guide

### 1. Start Backend Server
```bash
cd backend
mvn clean compile
mvn spring-boot:run
```
*Backend runs on `http://localhost:8080/api/v1`*

### 2. Start Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

### 3. Demo Credentials (Argon2id Seeded)
- **Admin:** `admin@rohilla.com` / `password123`
- **Operations Manager:** `manager@rohilla.com` / `password123`
- **Lead Designer:** `designer@rohilla.com` / `password123`
- **Print Master:** `production@rohilla.com` / `password123`
- **QC Inspector:** `qc@rohilla.com` / `password123`
- **Logistics & Dispatch:** `dispatch@rohilla.com` / `password123`

---

## 6. Automated Test Suites & Quality Verification
To execute automated unit, integration, and end-to-end regression suites:

```bash
# 1. Backend 93 Unit & Integration Tests
cd backend && mvn test

# 2. Frontend TypeScript & Production Bundler Check
cd frontend && npm run build

# 3. Live Entry Gateway & Proxy Integration Tests
powershell -ExecutionPolicy Bypass -File "scripts/test-gateway-flow.ps1"

# 4. Live End-to-End Workflow & QC Rework Lifecycle Tests
powershell -ExecutionPolicy Bypass -File "scripts/test-workflow-lifecycle.ps1"
```
