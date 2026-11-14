package com.rohilla.crm.audit.dto;

import com.rohilla.crm.audit.enums.AuditAction;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponseDto {
    private UUID id;
    private UUID actorId;
    private String actorEmail;
    private String actorRole;
    private AuditAction action;
    private String resourceType;
    private String resourceId;
    private String oldValue;
    private String newValue;
    private String ipAddress;
    private String userAgent;
    private Instant createdAt;
}
