package com.rohilla.crm.employee.dto;

import com.rohilla.crm.employee.enums.DocumentType;
import com.rohilla.crm.employee.enums.DocumentVerificationStatus;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeDocumentDto {
    private UUID id;
    private DocumentType documentType;
    private String documentNumberMasked;
    private String originalFileName;
    private String mimeType;
    private long fileSize;
    private DocumentVerificationStatus status;
    private Instant uploadedAt;
    private Instant verifiedAt;
    private String verifiedByName;
    private String rejectionReason;
    private int version;
    private boolean current;
}
