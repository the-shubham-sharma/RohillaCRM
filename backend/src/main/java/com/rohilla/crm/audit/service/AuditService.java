package com.rohilla.crm.audit.service;

import com.rohilla.crm.audit.entity.AuditLog;
import com.rohilla.crm.audit.enums.AuditAction;
import com.rohilla.crm.audit.repository.AuditLogRepository;
import lombok.Builder;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Getter
    @Builder
    public static class AuditEvent {
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
    }

    public void publishAudit(UUID actorId, String actorEmail, String actorRole, AuditAction action,
                             String resourceType, String resourceId, String oldValue, String newValue,
                             String ipAddress, String userAgent) {
        AuditEvent event = AuditEvent.builder()
                .actorId(actorId)
                .actorEmail(actorEmail != null ? actorEmail : "SYSTEM")
                .actorRole(actorRole != null ? actorRole : "SYSTEM")
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .oldValue(oldValue)
                .newValue(newValue)
                .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                .userAgent(userAgent != null ? userAgent : "Internal")
                .build();

        eventPublisher.publishEvent(event);
    }

    @Async
    @EventListener
    public void handleAuditEvent(AuditEvent event) {
        try {
            AuditLog logEntry = AuditLog.builder()
                    .actorId(event.getActorId())
                    .actorEmail(event.getActorEmail())
                    .actorRole(event.getActorRole())
                    .action(event.getAction())
                    .resourceType(event.getResourceType())
                    .resourceId(event.getResourceId())
                    .oldValue(event.getOldValue())
                    .newValue(event.getNewValue())
                    .ipAddress(event.getIpAddress())
                    .userAgent(event.getUserAgent())
                    .createdAt(Instant.now())
                    .build();

            auditLogRepository.save(logEntry);
            log.info("Audit logged: action={}, resource={}:{}, actor={}",
                    event.getAction(), event.getResourceType(), event.getResourceId(), event.getActorEmail());
        } catch (Exception e) {
            log.error("Failed to persist audit log: {}", e.getMessage());
        }
    }

    public List<AuditLog> getRecentAuditLogs() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<AuditLog> getAuditLogsForResource(String resourceType, String resourceId) {
        return auditLogRepository.findAllByResourceTypeAndResourceIdOrderByCreatedAtDesc(resourceType, resourceId);
    }
}
