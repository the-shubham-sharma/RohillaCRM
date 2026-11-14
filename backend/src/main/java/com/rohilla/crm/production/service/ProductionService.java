package com.rohilla.crm.production.service;

import com.rohilla.crm.audit.service.AuditService;
import com.rohilla.crm.auth.service.AuthService;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.project.workflow.WorkflowTransitionService;

import com.rohilla.crm.production.entity.ProductionTask;
import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.audit.enums.AuditAction;
import com.rohilla.crm.project.enums.ProjectStatus;
import com.rohilla.crm.production.dto.CreateProductionTaskRequest;
import com.rohilla.crm.production.dto.ProductionTaskDto;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.production.repository.ProductionTaskRepository;
import com.rohilla.crm.project.repository.ProjectRepository;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.security.authorization.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductionService {

    private final ProductionTaskRepository productionTaskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final AuditService auditService;
    private final WorkflowTransitionService workflowTransitionService;

    @Transactional
    public ProductionTaskDto createTask(UUID projectId, CreateProductionTaskRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        User assignedTo = request.getAssignedToId() != null
                ? userRepository.findById(request.getAssignedToId()).orElse(null) : null;

        ProductionTask task = ProductionTask.builder()
                .project(project)
                .taskName(request.getTaskName())
                .materialSpecification(request.getMaterialSpecification())
                .machineType(request.getMachineType())
                .quantity(request.getQuantity())
                .status("PENDING")
                .assignedTo(assignedTo)
                .notes(request.getNotes())
                .build();

        ProductionTask saved = productionTaskRepository.save(task);

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        auditService.publishAudit(
                currentUser.getId(),
                currentUser.getUsername(),
                "ROLE_PRODUCTION",
                AuditAction.PRODUCTION_TASK_STARTED,
                "PRODUCTION_TASK",
                saved.getId().toString(),
                null,
                "Created task: " + saved.getTaskName() + " (Qty: " + saved.getQuantity() + ")",
                null,
                null
        );

        // Auto-transition to IN_PRODUCTION if currently in READY_FOR_PRODUCTION
        if (project.getStatus() == ProjectStatus.READY_FOR_PRODUCTION) {
            workflowTransitionService.transitionProjectStatus(project, ProjectStatus.IN_PRODUCTION, "Production task started");
        }

        return mapToDto(saved);
    }

    @Transactional
    public ProductionTaskDto completeTask(UUID taskId, String notes) {
        ProductionTask task = productionTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Production task not found: " + taskId));

        task.setStatus("COMPLETED");
        task.setCompletedAt(Instant.now());
        if (notes != null) {
            task.setNotes((task.getNotes() != null ? task.getNotes() + " | " : "") + notes);
        }

        ProductionTask saved = productionTaskRepository.save(task);

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails().orElse(null);
        UUID actorId = currentUser != null ? currentUser.getId() : null;
        String actorEmail = currentUser != null ? currentUser.getUsername() : "SYSTEM";

        auditService.publishAudit(
                actorId,
                actorEmail,
                "ROLE_PRODUCTION",
                AuditAction.PRODUCTION_TASK_COMPLETED,
                "PRODUCTION_TASK",
                saved.getId().toString(),
                "IN_PROGRESS",
                "COMPLETED",
                null,
                null
        );

        return mapToDto(saved);
    }

    private ProductionTaskDto mapToDto(ProductionTask t) {
        return ProductionTaskDto.builder()
                .id(t.getId())
                .projectId(t.getProject().getId())
                .taskName(t.getTaskName())
                .materialSpecification(t.getMaterialSpecification())
                .machineType(t.getMachineType())
                .quantity(t.getQuantity())
                .status(t.getStatus())
                .startedAt(t.getStartedAt())
                .completedAt(t.getCompletedAt())
                .assignedTo(t.getAssignedTo() != null ? authService.mapToUserSummary(t.getAssignedTo()) : null)
                .notes(t.getNotes())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
