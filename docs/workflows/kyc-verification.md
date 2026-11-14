# Workflow: Employee KYC & Profile Verification

## 1. Overview
Employee onboarding requires strict KYC (Know Your Customer) compliance to maintain factory security, statutory labor requirements, and identity verification.

---

## 2. KYC Lifecycle & Document Types

Supported document types:
- **AADHAAR:** 12-digit Indian Unique Identity Number
- **PAN_CARD:** 10-character Indian Income Tax Permanent Account Number
- **VOTER_ID:** Election Commission Electoral Photo ID
- **DRIVING_LICENSE:** Transport Department Driving Permit
- **PASSPORT:** Indian Republic Passport Document

---

## 3. Verification State Transitions

```
[Employee Uploads KYC Document]
                |
                v
       [Status: PENDING]
                |
                v (Admin / Operations Manager Reviews)
        +-------+-------+
        |               |
   [VERIFIED]      [REJECTED]
        |               |
        v               v
  (KYC Complete)  (Rejection Reason Logged -> User Re-uploads)
```

### Security Constraints:
- Inactive or suspended employees are locked from accessing internal manufacturing workspaces.
- Document storage paths are sanitized to prevent directory traversal attacks.
