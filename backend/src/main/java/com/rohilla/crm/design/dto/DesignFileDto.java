package com.rohilla.crm.design.dto;

import com.rohilla.crm.employee.dto.UserSummaryDto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DesignFileDto {
    private UUID id;
    private UUID projectId;
    private String originalFileName;
    private String storageKey;
    private Long fileSizeBytes;
    private String mimeType;
    private Integer versionNumber;
    private UserSummaryDto uploadedBy;
    private Boolean technicalCheckPassed;
    private String compatibilityNotes;
    private UserSummaryDto technicalCheckedBy;
    private Boolean approvedByCustomer;
    private String customerFeedback;
    private UserSummaryDto approvedByManager;
    private Instant managerApprovedAt;
    private boolean isProductionApproved;
    private boolean isLocked;
    private Instant createdAt;
}
