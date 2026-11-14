# Developer Guidelines & Standards — Rohilla Advertising CRM

## 1. Mandatory Developer Golden Rule

> [!IMPORTANT]
> **Every developer must follow the existing folder structure and reuse existing services/components before creating new ones.**
> 
> **Do not create duplicate controllers, services, DTOs, security systems, or file-storage systems.**

---

## 2. Code Placement Matrix

### Backend (`com.rohilla.crm`)
| Artifact Type | Target Package | Naming Convention |
|---|---|---|
| REST Endpoints | `controller` | `{Domain}Controller.java` |
| Business Logic | `service` | `{Domain}Service.java` |
| JPA Entities | `domain.entity` | `{Domain}.java` |
| Enums | `domain.enums` | `{EnumName}.java` |
| Request/Response DTOs | `dto` | `{Action}{Domain}Request.java` / `{Domain}Dto.java` |
| Repositories | `repository` | `{Domain}Repository.java` |
| Exceptions | `exception` | `{Domain}Exception.java` |
| Security Filters / Evaluators | `security` | `{Feature}Filter.java` / `{Feature}Evaluator.java` |

### Frontend (`frontend/src/`)
| Artifact Type | Target Directory | Naming Convention |
|---|---|---|
| Reusable UI Widgets | `components/` | `{ComponentName}.tsx` |
| Application Views / Pages | `pages/` | `{PageName}.tsx` |
| Typed API Methods | `services/` | `apiService.ts` / `{domain}Service.ts` |
| Custom React Hooks | `hooks/` | `use{HookName}.ts` |
| Global Types & Enums | `types/` | `index.ts` |
| Formatting & Utilities | `utils/` | `{utilityCategory}.ts` |

---

## 3. Pull Request Checklist

Before submitting or merging any code changes:
- [ ] No duplicate controllers, services, or DTOs created.
- [ ] Files stored strictly using `FileStorageService` adhering to `projects/{projectId}/{category}/...`.
- [ ] Client contact details & budget protected by confidentiality masking.
- [ ] Run backend tests: `cd D:\CRM2\backend && mvn test` -> **Must Pass (0 failures)**.
- [ ] Run frontend build: `cd D:\CRM2\frontend && npm run build` -> **Must Pass (0 errors)**.
- [ ] Major changes recorded in `CHANGELOG.md`.
