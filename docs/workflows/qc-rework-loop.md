# Workflow: Quality Control (QC) & Rework Loop

## 1. Overview
The Quality Control subsystem guarantees that no defective, misprinted, or incorrectly sized signage leaves the manufacturing floor. Every finished production job is held in `QC_PENDING` until a certified QC Inspector performs an evaluation.

---

## 2. QC State Machine & Rework Cycle

```
           [Production Completed]
                     |
                     v
           [Status: QC_PENDING]
                     |
                     v
          [QC Inspector Evaluation]
        - Color Accuracy (1-10)
        - Dimension Accuracy (1-10)
        - Finishing & Structural Score (1-10)
        - Defect Log Notes
                     |
         +-----------+-----------+
         |                       |
    [QC PASSED]             [QC REJECTED]
         |                       |
         v                       v
[Status: READY_FOR_DISPATCH]  [Status: IN_PRODUCTION (Rework)]
         |                       |
         v                       v
  (Proceeds to Logistics)   (Production fixes logged defects)
                                 |
                                 v
                            [QC_PENDING]
                                 |
                                 v
                            [Re-Inspection]
```

---

## 3. Business & Safety Rules
1. **No Skip Rule:** A project **cannot** move from `IN_PRODUCTION` directly to `DISPATCHED` without a recorded `QCEvaluation` entity marked as `passed = true`.
2. **Defect Tracking:** When `passed = false`, the inspector must provide detailed defect notes (`defectsNotes`). These notes are automatically dispatched via internal notification to the assigned Production staff.
3. **Audit Trail:** Every evaluation score is timestamped and immutably attributed to the inspecting QC user.
