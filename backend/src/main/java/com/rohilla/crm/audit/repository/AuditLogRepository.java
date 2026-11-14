package com.rohilla.crm.audit.repository;

import com.rohilla.crm.audit.entity.AuditLog;
import com.rohilla.crm.audit.enums.AuditAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findAllByOrderByCreatedAtDesc();
    List<AuditLog> findAllByResourceTypeAndResourceIdOrderByCreatedAtDesc(String resourceType, String resourceId);
    List<AuditLog> findAllByActorEmailOrderByCreatedAtDesc(String actorEmail);
    List<AuditLog> findAllByActionOrderByCreatedAtDesc(AuditAction action);
}
