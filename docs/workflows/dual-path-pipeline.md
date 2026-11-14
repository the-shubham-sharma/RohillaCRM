# Workflow: Dual-Path Manufacturing Pipeline

## 1. Overview
Rohilla Advertising handles two distinct categories of manufacturing jobs:
1. **Path A (Customer-Provided Artwork):** High-speed track requiring only pre-press machine compatibility and resolution checks.
2. **Path B (Custom Design Required):** Full creative track requiring iterative mockup drafting, client proof approvals, revision loops, and final manager locking.

---

## 2. Path A: Customer-Provided Design Pipeline

```
[Lead Converted (customerProvidedDesign = true)]
                      |
                      v
             [Status: MANAGER_REVIEW]
                      |
                      v (Manager Assigns Designer)
         [Status: DESIGN_TECHNICAL_CHECK]
                      |
                      v (Designer checks 300 DPI, CMYK, Bleed, Dimensions)
           +----------+----------+
           |                     |
      [PASSED]               [FAILED]
           |                     |
           v                     v
[READY_FOR_PRODUCTION]   [MANAGER_REVIEW]
           |             (Manager requests new artwork from client)
           v
    [IN_PRODUCTION]
```

---

## 3. Path B: Custom Design Creation Pipeline

```
[Lead Converted (customerProvidedDesign = false)]
                      |
                      v
             [Status: MANAGER_REVIEW]
                      |
                      v (Manager Assigns Designer)
           [Status: DESIGN_IN_PROGRESS]
                      |
                      v (Designer uploads Mockup v1)
            [Status: DESIGN_SUBMITTED]
                      |
                      v (Client Reviews Proof)
           +----------+----------+
           |                     |
      [APPROVED]             [REVISION REQUESTED]
           |                     |
           v                     v
 [CUSTOMER_APPROVED]    [CUSTOMER_REWORK_REQUESTED]
           |                     |
           |                     v
           |            (Returns to DESIGN_IN_PROGRESS)
           v
[Manager Reviews & Locks Version]
           |
           v
   [MANAGER_APPROVED]
           |
           v
 [READY_FOR_PRODUCTION]
           |
           v
    [IN_PRODUCTION]
```
