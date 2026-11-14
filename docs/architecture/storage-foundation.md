# File Storage Foundation — Rohilla Advertising CRM

## 1. Storage Architecture Overview

All physical file uploads in Rohilla Advertising CRM (vector designs, high-resolution artworks, print proofs, QC inspection photos, proof of delivery slips, installation sign-offs) are managed by [FileStorageService.java](file:///d:/CRM2/backend/src/main/java/com/rohilla/crm/service/FileStorageService.java).

Files are strictly isolated outside the application source tree in the dedicated storage root (default: `./uploads`).

---

## 2. Standardized Storage Hierarchy

All files are structured predictably by project ID and departmental category:

```text
uploads/
└── projects/
    └── {projectId}/
        ├── design/          # Vector artworks, CDR/AI files, customer proofs (v1, v2...)
        ├── production/      # Machine RIP files, cut sheets, print batch metadata
        ├── qc/              # High-res inspection photos, defect evidence
        ├── dispatch/        # Packing slips, courier consignment notes
        └── installation/    # On-site installation photos, signed customer handover
```

---

## 3. Safe Key Generation & Path Traversal Prevention

### Storage Key Format:
```text
projects/{projectId}/{category}/{UUID}_{sanitizedOriginalName}
```

* **Example**:
  `projects/6331c155-246b-4ee6-a249-ec740b40cd05/design/a9b8c7d6-e5f4-4a3b-8c2d-1e0f9a8b7c6d_Metro_Billboard_40x20ft_v2.pdf`

### Security Safeguards:
1. **Filename Sanitization**: Any character outside `[a-zA-Z0-9._-]` is replaced with `_`.
2. **Path Traversal Guard**: Consecutive dots (`..`) are stripped, and `targetLocation.startsWith(this.rootStoragePath)` is strictly enforced before reading or writing any bytes.
3. **Randomized UUID Prefix**: Prevents file collision or prediction of storage locations.

---

## 4. Extension & Magic Bytes Validation (Apache Tika)

Every uploaded file undergoes a two-stage security validation:

1. **Extension Whitelist**:
   * Allowed: `.pdf`, `.ai`, `.psd`, `.cdr`, `.png`, `.jpg`, `.jpeg`, `.tiff`, `.zip`
2. **MIME Type Inspection**:
   * Inspects binary magic bytes using `org.apache.tika.Tika`.
   * **Explicitly Blocked**: Executables (`.exe`, `.sh`, `.bin`, `.msi`), scripts (`.js`, `.php`, `.py`), HTML files, and SVG files containing potential XSS payloads.

---

## 5. Access Control & Audit Logging

* **Authorization**: Downloading files (`GET /api/v1/files/{fileId}/download`) requires an authenticated user who is either an `ADMIN`, `MANAGER`, or specifically assigned to the associated project.
* **Audit Trail**: Every upload and download event is logged asynchronously to the `audit_logs` table (`AuditAction.DESIGN_UPLOADED`, `AuditAction.FILE_DOWNLOADED`).
