# Project Lifecycle & Finite State Machine — Rohilla Advertising CRM

## 1. Dual-Path Architecture (Path A vs Path B)

Rohilla Advertising CRM supports two distinct design intake workflows:

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> MANAGER_REVIEW

    state "Path A: Customer Provided Design" as PathA {
        MANAGER_REVIEW --> DESIGN_TECHNICAL_CHECK : Path A Selected
        DESIGN_TECHNICAL_CHECK --> MANAGER_APPROVED : Technical Compatibility Passed
    }

    state "Path B: In-House Creative Design" as PathB {
        MANAGER_REVIEW --> DESIGN_IN_PROGRESS : Path B Selected
        DESIGN_IN_PROGRESS --> DESIGN_SUBMITTED : Designer uploads proof
        DESIGN_SUBMITTED --> CUSTOMER_APPROVAL_PENDING
        CUSTOMER_APPROVAL_PENDING --> CUSTOMER_REWORK_REQUESTED : Feedback/Revisions
        CUSTOMER_REWORK_REQUESTED --> DESIGN_IN_PROGRESS
        CUSTOMER_APPROVAL_PENDING --> CUSTOMER_APPROVED : Client Confirms
        CUSTOMER_APPROVED --> MANAGER_APPROVED
    }

    state "Fulfillment Pipeline (Common)" as Fulfillment {
        MANAGER_APPROVED --> READY_FOR_PRODUCTION
        READY_FOR_PRODUCTION --> IN_PRODUCTION
        IN_PRODUCTION --> PRODUCTION_COMPLETED
        PRODUCTION_COMPLETED --> QC_PENDING
        QC_PENDING --> QC_REJECTED : Defects Found
        QC_REJECTED --> IN_PRODUCTION : Rework
        QC_PENDING --> QC_PASSED : Score >= 7.0
        QC_PASSED --> DISPATCH_PENDING
        DISPATCH_PENDING --> DISPATCHED
        DISPATCHED --> INSTALLATION_PENDING : If Install Required
        INSTALLATION_PENDING --> INSTALLATION_COMPLETED
        DISPATCHED --> COMPLETED : Direct Delivery
        INSTALLATION_COMPLETED --> COMPLETED
    }

    COMPLETED --> [*]
```

---

## 2. Stage Breakdown & Operational Hand-Offs

### Stage 1: Intake & Manager Review
* Project created by Manager/Admin.
* Selection of Path A (Customer Artwork) or Path B (In-House Design).

### Stage 2: Design Verification / Creation
* **Path A**: Designer inspects file dimensions, CMYK color space, bleed margins, and resolution. Marks technical check passed.
* **Path B**: Designer creates vector artwork, uploads versions (`v1`, `v2`...). Version locked upon customer approval.

### Stage 3: Manager Operational Approval
* Manager reviews specifications, verifies customer sign-off, and marks project `READY_FOR_PRODUCTION`.

### Stage 4: Production Run
* Print Master schedules job on assigned machines (e.g. UV Flatbed, Eco-Solvent, Laser CNC, Acrylic Bender).
* Job tracked from `IN_PRODUCTION` to `PRODUCTION_COMPLETED`.

### Stage 5: Quality Control Inspection
* QC Inspector performs physical inspection with a 10-point scoring rubric:
  * Color Accuracy Score (/10)
  * Dimension Accuracy Score (/10)
  * Finishing Score (/10)
* Passing threshold >= 7.0/10 moves project to `QC_PASSED`. Failures trigger `QC_REJECTED` and routed back for rework.

### Stage 6: Dispatch & Logistics
* Logistics Lead generates packing slip, assigns courier partner/vehicle, and inputs tracking number.
* Project transitions to `DISPATCHED`.

### Stage 7: Installation & Handover
* If `installationRequired = true`, field technicians complete on-site mounting, collect customer signature, and transition project to `INSTALLATION_COMPLETED`.

### Stage 8: Manager Final Closure
* Manager completes final invoice audit and marks project `COMPLETED`.
