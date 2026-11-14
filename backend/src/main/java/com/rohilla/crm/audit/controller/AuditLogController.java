package com.rohilla.crm.audit.controller;

import com.rohilla.crm.audit.entity.AuditLog;
import com.rohilla.crm.common.response.ApiResponse;
import com.rohilla.crm.audit.dto.AuditLogResponseDto;
import com.rohilla.crm.audit.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or hasAuthority('audit:read')")
    public ResponseEntity<ApiResponse<List<AuditLogResponseDto>>> getAuditLogs() {
        List<AuditLogResponseDto> logs = auditService.getRecentAuditLogs().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/resource/{type}/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or hasAuthority('audit:read')")
    public ResponseEntity<ApiResponse<List<AuditLogResponseDto>>> getResourceAuditLogs(
            @PathVariable String type,
            @PathVariable String id) {
        List<AuditLogResponseDto> logs = auditService.getAuditLogsForResource(type, id).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    private AuditLogResponseDto mapToDto(AuditLog log) {
        return AuditLogResponseDto.builder()
                .id(log.getId())
                .actorId(log.getActorId())
                .actorEmail(log.getActorEmail())
                .actorRole(log.getActorRole())
                .action(log.getAction())
                .resourceType(log.getResourceType())
                .resourceId(log.getResourceId())
                .oldValue(log.getOldValue())
                .newValue(log.getNewValue())
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
