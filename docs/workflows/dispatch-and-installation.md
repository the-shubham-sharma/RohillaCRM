# Workflow: Dispatch Logistics & On-Site Installation

## 1. Overview
The Dispatch and Installation subsystem handles the final physical delivery, fleet tracking, on-site structural assembly, customer sign-off, and automated closing notifications.

---

## 2. Dispatch & Installation Lifecycle

```
[Status: READY_FOR_DISPATCH (QC Passed)]
                     |
                     v (Dispatch Officer Assigns Courier / Vehicle)
           [Status: DISPATCHED]
       - Courier Partner Name
       - Tracking / Consignment Number
       - Driver Name & Mobile
       - Destination Address
                     |
                     v (Field Crew Installs Signage On-Site)
      [Status: INSTALLATION_PENDING]
                     |
                     v (Site Engineer / Client Signs Off)
     [Status: INSTALLATION_COMPLETED]
       - Installation Date
       - Client Sign-off Notes
       - Photographic Proof of Delivery (POD)
                     |
                     v (Manager Closes Project)
           [Status: COMPLETED]
                     |
                     v
   [Trigger Automated Customer WhatsApp Alert]
   "Your signage project PRJ-2026-XXX has been installed!
    Thank you for choosing Rohilla Advertising."
```

---

## 3. Key Rules
1. **Traceability:** No dispatch record can be saved without a valid courier partner / vehicle number and recipient contact name.
2. **Installation Sign-Off:** Field photos and installation notes must be recorded before final closure.
3. **Automated Customer Communication:** Upon transitioning to `COMPLETED`, the system dispatches a confirmation message to the client's registered mobile number via WhatsApp notification service.
