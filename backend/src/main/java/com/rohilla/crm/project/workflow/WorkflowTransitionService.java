package com.rohilla.crm.project.workflow;

import com.rohilla.crm.audit.service.AuditService;
import com.rohilla.crm.common.exception.InvalidStateTransitionException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.notification.entity.Notification;
import com.rohilla.crm.notification.service.NotificationService;
import com.rohilla.crm.notification.service.WhatsAppNotificationService;
import com.rohilla.crm.security.entity.Role;

import com.rohilla.crm.design.entity.DesignFile;
import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.audit.enums.AuditAction;
import com.rohilla.crm.project.enums.ProjectStatus;
import com.rohilla.crm.security.enums.RoleType;
import com.rohilla.crm.common.exception.InvalidStateTransitionException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.design.repository.DesignFileRepository;
import com.rohilla.crm.project.repository.ProjectRepository;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.security.authorization.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowTransitionService {

    private final ProjectRepository projectRepository;
    private final DesignFileRepository designFileRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final WhatsAppNotificationService whatsAppNotificationService;

    // Allowed transitions map for PATH A (Customer Provided Design)
    private static final Map<ProjectStatus, Set<ProjectStatus>> PATH_A_TRANSITIONS = Map.ofEntries(
            Map.entry(ProjectStatus.DRAFT, Set.of(ProjectStatus.MANAGER_REVIEW, ProjectStatus.DESIGN_TECHNICAL_CHECK, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.MANAGER_REVIEW, Set.of(ProjectStatus.DESIGN_TECHNICAL_CHECK, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.DESIGN_TECHNICAL_CHECK, Set.of(ProjectStatus.READY_FOR_PRODUCTION, ProjectStatus.IN_PRODUCTION, ProjectStatus.MANAGER_REVIEW, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.READY_FOR_PRODUCTION, Set.of(ProjectStatus.IN_PRODUCTION, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.IN_PRODUCTION, Set.of(ProjectStatus.PRODUCTION_COMPLETED, ProjectStatus.QC_PENDING, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.PRODUCTION_COMPLETED, Set.of(ProjectStatus.QC_PENDING, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.QC_PENDING, Set.of(ProjectStatus.QC_PASSED, ProjectStatus.QC_REJECTED, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.QC_REJECTED, Set.of(ProjectStatus.IN_PRODUCTION, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.QC_PASSED, Set.of(ProjectStatus.DISPATCH_PENDING, ProjectStatus.DISPATCHED, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.DISPATCH_PENDING, Set.of(ProjectStatus.DISPATCHED, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.DISPATCHED, Set.of(ProjectStatus.INSTALLATION_PENDING, ProjectStatus.INSTALLATION_COMPLETED, ProjectStatus.COMPLETED, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.INSTALLATION_PENDING, Set.of(ProjectStatus.INSTALLATION_COMPLETED, ProjectStatus.COMPLETED, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.INSTALLATION_COMPLETED, Set.of(ProjectStatus.COMPLETED, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.COMPLETED, Set.of(ProjectStatus.MANAGER_REVIEW)),
            Map.entry(ProjectStatus.CANCELLED, Collections.emptySet())
    );

    // Allowed transitions map for PATH B (Design Required)
    private static final Map<ProjectStatus, Set<ProjectStatus>> PATH_B_TRANSITIONS = Map.ofEntries(
            Map.entry(ProjectStatus.DRAFT, Set.of(ProjectStatus.MANAGER_REVIEW, ProjectStatus.DESIGN_IN_PROGRESS, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.MANAGER_REVIEW, Set.of(ProjectStatus.DESIGN_IN_PROGRESS, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.DESIGN_IN_PROGRESS, Set.of(ProjectStatus.DESIGN_SUBMITTED, ProjectStatus.CUSTOMER_APPROVAL_PENDING, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.DESIGN_SUBMITTED, Set.of(ProjectStatus.CUSTOMER_APPROVAL_PENDING, ProjectStatus.CUSTOMER_APPROVED, ProjectStatus.CUSTOMER_REWORK_REQUESTED, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.CUSTOMER_APPROVAL_PENDING, Set.of(ProjectStatus.CUSTOMER_APPROVED, ProjectStatus.CUSTOMER_REWORK_REQUESTED, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.CUSTOMER_REWORK_REQUESTED, Set.of(ProjectStatus.DESIGN_IN_PROGRESS, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.CUSTOMER_APPROVED, Set.of(ProjectStatus.MANAGER_APPROVED, ProjectStatus.READY_FOR_PRODUCTION, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.MANAGER_APPROVED, Set.of(ProjectStatus.READY_FOR_PRODUCTION, ProjectStatus.IN_PRODUCTION, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.READY_FOR_PRODUCTION, Set.of(ProjectStatus.IN_PRODUCTION, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.IN_PRODUCTION, Set.of(ProjectStatus.PRODUCTION_COMPLETED, ProjectStatus.QC_PENDING, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.PRODUCTION_COMPLETED, Set.of(ProjectStatus.QC_PENDING, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.QC_PENDING, Set.of(ProjectStatus.QC_PASSED, ProjectStatus.QC_REJECTED, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.QC_REJECTED, Set.of(ProjectStatus.IN_PRODUCTION, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.QC_PASSED, Set.of(ProjectStatus.DISPATCH_PENDING, ProjectStatus.DISPATCHED, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.DISPATCH_PENDING, Set.of(ProjectStatus.DISPATCHED, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.DISPATCHED, Set.of(ProjectStatus.INSTALLATION_PENDING, ProjectStatus.INSTALLATION_COMPLETED, ProjectStatus.COMPLETED, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.INSTALLATION_PENDING, Set.of(ProjectStatus.INSTALLATION_COMPLETED, ProjectStatus.COMPLETED, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.INSTALLATION_COMPLETED, Set.of(ProjectStatus.COMPLETED, ProjectStatus.CANCELLED)),
            Map.entry(ProjectStatus.COMPLETED, Set.of(ProjectStatus.MANAGER_REVIEW)),
            Map.entry(ProjectStatus.CANCELLED, Collections.emptySet())
    );

    @Transactional
    public Project transitionProjectStatus(Project project, ProjectStatus targetStatus, String remarks) {
        ProjectStatus currentStatus = project.getStatus();

        if (currentStatus == targetStatus) {
            return project;
        }

        Map<ProjectStatus, Set<ProjectStatus>> transitionMap = project.isCustomerProvidedDesign()
                ? PATH_A_TRANSITIONS
                : PATH_B_TRANSITIONS;

        Set<ProjectStatus> validNextStates = transitionMap.getOrDefault(currentStatus, Collections.emptySet());
        if (!validNextStates.contains(targetStatus)) {
            throw new InvalidStateTransitionException(
                    String.format("Invalid workflow transition from '%s' to '%s' for %s. Allowed transitions: %s",
                            currentStatus, targetStatus,
                            project.isCustomerProvidedDesign() ? "Path A (Customer Design)" : "Path B (Design Required)",
                            validNextStates)
            );
        }

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        User actorUser = userRepository.findById(currentUser.getId()).orElse(null);

        // Enforce role authorization for the target state
        validateRoleForTransition(currentUser, targetStatus, project);

        // Path B Business Rule: Enforce that before moving to READY_FOR_PRODUCTION or IN_PRODUCTION,
        // design must have been manager approved and locked
        if (!project.isCustomerProvidedDesign()) {
            if ((targetStatus == ProjectStatus.READY_FOR_PRODUCTION || targetStatus == ProjectStatus.IN_PRODUCTION)
                    && currentStatus != ProjectStatus.MANAGER_APPROVED && currentStatus != ProjectStatus.READY_FOR_PRODUCTION) {
                throw new InvalidStateTransitionException("Path B requires Customer Approval AND Manager Approval before entering Production.");
            }
        }

        // Apply state transition
        project.setStatus(targetStatus);
        Project savedProject = projectRepository.save(project);

        String userRole = currentUser.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .findFirst().orElse("UNKNOWN");

        // Tamper-evident Audit Log
        auditService.publishAudit(
                currentUser.getId(),
                currentUser.getUsername(),
                userRole,
                AuditAction.PROJECT_STATUS_TRANSITION,
                "PROJECT",
                project.getId().toString(),
                currentStatus.name(),
                targetStatus.name() + (remarks != null && !remarks.isBlank() ? " (" + remarks + ")" : ""),
                null,
                null
        );

        // Trigger Automated Departmental Hand-off Notifications
        triggerWorkflowNotifications(savedProject, currentStatus, targetStatus, actorUser);

        log.info("Workflow Transition: Project {} ({}) moved from {} to {} by {}",
                project.getProjectCode(),
                project.isCustomerProvidedDesign() ? "Path A" : "Path B",
                currentStatus, targetStatus, currentUser.getUsername());

        return savedProject;
    }

    public Set<ProjectStatus> getAllowedNextStatuses(Project project) {
        Map<ProjectStatus, Set<ProjectStatus>> transitionMap = project.isCustomerProvidedDesign()
                ? PATH_A_TRANSITIONS
                : PATH_B_TRANSITIONS;

        return transitionMap.getOrDefault(project.getStatus(), Collections.emptySet());
    }

    private void validateRoleForTransition(CustomUserDetails user, ProjectStatus targetStatus, Project project) {
        boolean isAdminOrManager = user.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(RoleType.ROLE_ADMIN.name()) ||
                a.getAuthority().equals(RoleType.ROLE_MANAGER.name())
        );

        if (isAdminOrManager) {
            return; // Admins and Managers have overall workflow orchestration authority
        }

        switch (targetStatus) {
            case DESIGN_TECHNICAL_CHECK:
            case DESIGN_IN_PROGRESS:
            case DESIGN_SUBMITTED:
                requireRole(user, RoleType.ROLE_DESIGNER, "Only Designers can perform design and technical check actions");
                break;
            case CUSTOMER_APPROVED:
            case CUSTOMER_REWORK_REQUESTED:
            case MANAGER_APPROVED:
                throw new UnauthorizedActionException("Only Managers or Admins can record customer/manager approvals");
            case READY_FOR_PRODUCTION:
                if (project.isCustomerProvidedDesign()) {
                    requireRole(user, RoleType.ROLE_DESIGNER, "Designers can mark customer designs ready for production upon technical check");
                } else {
                    throw new UnauthorizedActionException("Only Managers or Admins can release Path B designs to production");
                }
                break;
            case IN_PRODUCTION:
            case PRODUCTION_COMPLETED:
                requireRole(user, RoleType.ROLE_PRODUCTION, "Only Production personnel can update production status");
                break;
            case QC_PENDING:
                requireRole(user, RoleType.ROLE_PRODUCTION, "Production staff submit completed work to QC");
                break;
            case QC_PASSED:
            case QC_REJECTED:
                requireRole(user, RoleType.ROLE_QC, "Only Quality Control inspectors can approve or reject QC");
                break;
            case DISPATCH_PENDING:
            case DISPATCHED:
            case INSTALLATION_PENDING:
            case INSTALLATION_COMPLETED:
                requireRole(user, RoleType.ROLE_DISPATCH, "Only Dispatch personnel can update logistics/installation status");
                break;
            case COMPLETED:
            case CANCELLED:
                throw new UnauthorizedActionException("Only Admins and Managers can close or cancel projects");
            default:
                break;
        }
    }

    private void requireRole(CustomUserDetails user, RoleType role, String errorMessage) {
        boolean hasRole = user.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(role.name()));
        if (!hasRole) {
            throw new UnauthorizedActionException(errorMessage);
        }
    }

    private void triggerWorkflowNotifications(Project project, ProjectStatus oldStatus, ProjectStatus newStatus, User actor) {
        String projectLink = "/projects/" + project.getId();
        String pCode = project.getProjectCode();

        switch (newStatus) {
            case DESIGN_TECHNICAL_CHECK:
            case DESIGN_IN_PROGRESS:
                if (project.getAssignedDesigner() != null) {
                    notificationService.sendNotification(
                            project.getAssignedDesigner(),
                            "Project Assigned: " + pCode,
                            "Project " + pCode + " has been assigned to you for " +
                                    (project.isCustomerProvidedDesign() ? "machine compatibility checking." : "artwork creation."),
                            projectLink
                    );
                }
                break;

            case DESIGN_SUBMITTED:
            case CUSTOMER_APPROVED:
                if (project.getCreatedBy() != null) {
                    notificationService.sendNotification(
                            project.getCreatedBy(),
                            "Design Update: " + pCode,
                            "Project " + pCode + " status is now " + newStatus.name().replace('_', ' ') + ". Manager review required.",
                            projectLink
                    );
                }
                break;

            case READY_FOR_PRODUCTION:
            case IN_PRODUCTION:
                if (project.getAssignedProduction() != null) {
                    notificationService.sendNotification(
                            project.getAssignedProduction(),
                            "Ready for Production: " + pCode,
                            "Project " + pCode + " is approved and ready for print/fabrication.",
                            projectLink
                    );
                }
                break;

            case QC_PENDING:
            case PRODUCTION_COMPLETED:
                if (project.getAssignedQc() != null) {
                    notificationService.sendNotification(
                            project.getAssignedQc(),
                            "QC Inspection Pending: " + pCode,
                            "Production has completed for " + pCode + ". Please perform QC evaluation.",
                            projectLink
                    );
                }
                break;

            case QC_PASSED:
                if (project.getAssignedDispatch() != null) {
                    notificationService.sendNotification(
                            project.getAssignedDispatch(),
                            "Ready for Dispatch: " + pCode,
                            "Project " + pCode + " passed QC inspection. Ready for courier/delivery.",
                            projectLink
                    );
                }
                break;

            case QC_REJECTED:
                if (project.getAssignedProduction() != null) {
                    notificationService.sendNotification(
                            project.getAssignedProduction(),
                            "QC Rework Required: " + pCode,
                            "Project " + pCode + " failed QC inspection. Please review defects notes and rework.",
                            projectLink
                    );
                }
                if (project.getCreatedBy() != null) {
                    notificationService.sendNotification(
                            project.getCreatedBy(),
                            "Alert: QC Failed for " + pCode,
                            "Project " + pCode + " failed QC and returned to production.",
                            projectLink
                    );
                }
                break;

            case DISPATCHED:
                if (project.getCreatedBy() != null) {
                    notificationService.sendNotification(
                            project.getCreatedBy(),
                            "Project Dispatched: " + pCode,
                            "Project " + pCode + " has been dispatched.",
                            projectLink
                    );
                }
                break;

            case COMPLETED:
                if (project.getCreatedBy() != null) {
                    notificationService.sendNotification(
                            project.getCreatedBy(),
                            "Project Completed: " + pCode,
                            "Project " + pCode + " has been successfully completed and closed.",
                            projectLink
                    );
                }
                // Trigger customer WhatsApp completion notification with safety checks
                whatsAppNotificationService.sendProjectCompletionNotification(project);
                break;

            default:
                break;
        }
    }
}
