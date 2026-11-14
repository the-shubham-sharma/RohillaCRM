# Workflow: Lead Ingestion & 1-Click Project Conversion

## 1. Overview
The Lead-to-Project workflow automates the transition from an inbound customer quote request to an active internal manufacturing project.

```
[Customer Quote Request]
        |
        v
[Phone Number Validation (10 Digits)]
        |
        v
[Lead Stored (Status: NEW_LEAD)] ───► [In-App Alert to Managers & Admins]
        |
        v
[Manager Reviews Lead in CRM]
        |
        v
[1-Click Conversion Clicked]
        |
        +──► [Find/Create Client Record by Phone Number]
        |
        +──► [Create Project (Status: MANAGER_REVIEW)]
        |
        +──► [Link Uploaded Artwork as DesignFile v1 (if provided)]
        |
        +──► [Mark Lead Status: CONVERTED]
        |
        +──► [Log Audit Event: PROJECT_CREATED]
```

## 2. Validation & Business Rules
1. **Phone Number Sanitization:**
   - Input strings containing non-digits are stripped, and must evaluate to exactly 10 digits (e.g. `+919810001111` -> `9810001111`).
   - Invalid formats (letters, short numbers) are rejected with `HTTP 400 Bad Request`.
2. **Sequential Reference Generation:**
   - Leads receive human-readable codes formatted as `LEAD-YYYY-NNNN` (e.g. `LEAD-2026-0101`).
   - Projects receive unique codes formatted as `PRJ-YYYY-NNN` (e.g. `PRJ-2026-101`).
3. **Client Auto-Association:**
   - If a client with the same phone number already exists in the database, the new project attaches to the existing client profile.
   - If no client exists, a new `Client` entity is automatically instantiated with the company/contact details.
4. **Path Assignment:**
   - If the customer requested design assistance (`designRequired = true`), the project is flagged as `customerProvidedDesign = false` (**Path B**).
   - If the customer uploaded their own artwork (`designRequired = false`), the project is flagged as `customerProvidedDesign = true` (**Path A**).
