# Department Workspaces & Workstations — Rohilla Advertising CRM

## 1. Core Principles

1. **Main Dashboard = Only Pending Work**: The primary departmental dashboard displays strictly active, non-completed tasks requiring immediate employee action. No completed tasks, date filters, or aggregate KPI cards clutter the main action view.
2. **Dedicated History & Records Tab**: All completed work, previous submissions, version iterations, and historical metrics reside in the **My History & Records** tab with time filters (Today, This Week, This Month, Last Month, This Quarter, This Year, Custom Range) and authentic performance calculations.
3. **Work is Never Deleted**: Completed jobs move logically from `ACTIVE WORK` to `HISTORY`. Historical records remain permanently queryable by each staff member according to their departmental role permissions.
4. **Department Scoping**: Operational roles (`DESIGNER`, `PRODUCTION`, `QC`, `DISPATCH`) focus strictly on their department responsibilities with client data protection and cannot view other departments' private employee data.
5. **Manager & Owner Full Lifecycle**: Operations Manager and Owner retain complete 8-step project lifecycle views, company-wide pipeline, and cross-department performance comparison matrices.

---

## 2. Department Information Architecture

Each operational role dashboard (`/dashboard`) is partitioned into 2 clean, dedicated tabs:

```
+-------------------------------------------------------------------------+
|                      DEPARTMENT STUDIO WORKSPACE                        |
+------------------------------------+------------------------------------+
|         TAB 1: MY WORK             |    TAB 2: MY HISTORY & RECORDS     |
|       (Pending Work Only)          |    (Completed Tasks + Analytics)   |
+------------------------------------+------------------------------------+
| • Action-Required Tasks            | • Time Filter Bar (Today/Week/...) |
| • Tasks In Progress                | • Performance KPI Cards            |
| • Rework / Revision Requests       | • Permanent Completed Work Table   |
| • Technical Checks / Verifications | • Durations, Dates & On-Time Met   |
| • Upstream / Waiting on Review     | • Historic Project Detail Access   |
+------------------------------------+------------------------------------+
```

---

## 3. Role-Specific Tab Breakdown

### 1. Designer (`ROLE_DESIGNER`)
* **Tab 1: `My Design Work`**:
  * Action-required artworks (Path A compatibility checks, Path B creative drafting, rework requests).
  * Proofs submitted awaiting customer/manager review.
  * Zero completed projects or time filters.
* **Tab 2: `My History & Records`**:
  * Time Filter: Today, This Week, This Month, Last Month, This Quarter, This Year, Custom Range.
  * Performance KPIs: Designs Completed, Designs Submitted, Revisions Handled, Avg Completion Time, On-Time Rate %.
  * Table: Project Code, Task & Path, Assigned Date, Completed Date, Versions (v1, v2...), Revisions, Turnaround Days, Deadline, On-Time Status, Open Action.

### 2. Production (`ROLE_PRODUCTION`)
* **Tab 1: `My Production Work`**:
  * Action-required print jobs, machine assignments, substrate preparation, and QC rejected rework jobs.
  * Upstream waiting jobs.
* **Tab 2: `My History & Records`**:
  * Time Filter Bar.
  * Performance KPIs: Jobs Completed, In Progress, Rework Jobs, Avg Production Time, On-Time Rate %.
  * Table: Project Code, Job/Task, Material Spec, Machine Type, Qty, Duration Hours, Status, Deadline, Action.

### 3. Quality Control (`ROLE_QC`)
* **Tab 1: `My QC Inspections`**:
  * Active inspections queue (finished jobs awaiting physical inspection and multi-point scoring).
* **Tab 2: `My History & Records`**:
  * Time Filter Bar.
  * Performance KPIs: Inspections Done, Pass Rate %, Rework Rate %, Avg Quality Score (/10).
  * Table: Project Code, Job Title, Inspection Date, Result (PASSED / REWORK), Color Score, Dimension Score, Finish Score, Remarks, Action.

### 4. Dispatch & Logistics (`ROLE_DISPATCH`)
* **Tab 1: `My Dispatch Work`**:
  * Action-required packaging, courier consignment booking, local delivery, and on-site signage mounting.
* **Tab 2: `My History & Records`**:
  * Time Filter Bar.
  * Performance KPIs: Dispatches Completed, Installations Done, Pending Jobs, On-Time Rate %.
  * Table: Project Code, Title, Courier Partner, Tracking Number, Dispatch Date, Install Required, Delivery Status, Action.

### 5. Operations Manager & Owner (`ROLE_MANAGER`, `ROLE_ADMIN`)
* **Tab 1: `Company Pipeline`**: Live active project pipeline with summary counts across each workflow stage.
* **Tab 2: `Department Performance Comparison`**: Cross-department team comparison matrix with time filters.
* **Tab 3: `Company-Wide Analytics` (Owner)**: High-level revenue pipeline, department workload distribution, and overall on-time turnaround rate.

