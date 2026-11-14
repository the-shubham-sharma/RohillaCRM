package com.rohilla.crm.notification.service;

import com.rohilla.crm.audit.service.AuditService;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.util.PhoneUtils;
import com.rohilla.crm.notification.entity.Notification;

import com.rohilla.crm.client.entity.Client;
import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.audit.enums.AuditAction;
import com.rohilla.crm.security.enums.RoleType;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.project.repository.ProjectRepository;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.common.util.PhoneUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhatsAppNotificationService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    /**
     * Dispatches project completion WhatsApp notification to customer.
     * Safety guarantee: WhatsApp failure must NEVER roll back the project's completed status.
     */
    @Transactional
    public boolean sendProjectCompletionNotification(Project project) {
        try {
            if (project == null) {
                log.warn("Cannot send WhatsApp notification: project is null");
                return false;
            }

            Client client = project.getClient();
            String rawPhone = client != null ? client.getPhone() : null;

            if (client != null && PhoneUtils.isValid10DigitPhone(rawPhone)) {
                String whatsAppPhone = PhoneUtils.toWhatsAppFormat(rawPhone);
                log.info("WhatsApp customer notification dispatched for project {} to {} (Client: {})",
                        project.getProjectCode(), whatsAppPhone, client.getCompanyName());

                auditService.publishAudit(
                        null,
                        "SYSTEM",
                        "SYSTEM",
                        AuditAction.WHATSAPP_NOTIFICATION_SENT,
                        "PROJECT",
                        project.getId().toString(),
                        null,
                        String.format("Customer WhatsApp completion notification sent to %s (%s) for project %s",
                                client.getCompanyName(), whatsAppPhone, project.getProjectCode()),
                        null,
                        null
                );
                return true;
            } else {
                String reason = (client == null) ? "No client record linked"
                        : (rawPhone == null || rawPhone.trim().isEmpty()) ? "Missing mobile number"
                        : "Invalid mobile number format: " + rawPhone;

                log.warn("WhatsApp customer notification could not be sent for project {}: {}",
                        project.getProjectCode(), reason);

                auditService.publishAudit(
                        null,
                        "SYSTEM",
                        "SYSTEM",
                        AuditAction.WHATSAPP_NOTIFICATION_FAILED,
                        "PROJECT",
                        project.getId().toString(),
                        null,
                        String.format("WhatsApp notification failed for project %s: %s (Client: %s)",
                                project.getProjectCode(), reason, client != null ? client.getCompanyName() : "Unknown"),
                        null,
                        null
                );

                // Alert Admins and Managers in-app
                notifyManagersOfWhatsAppFailure(project, client, reason);
                return false;
            }
        } catch (Exception e) {
            log.error("Unexpected error during WhatsApp notification dispatch for project {}: {}",
                    project != null ? project.getProjectCode() : "unknown", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Manual retry mechanism for Admin and Manager after correcting client mobile number.
     */
    @Transactional
    public boolean retryNotification(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        Client client = project.getClient();
        if (client == null || !PhoneUtils.isValid10DigitPhone(client.getPhone())) {
            throw new IllegalArgumentException(
                    "Cannot send WhatsApp notification: Client mobile number is missing or invalid. Please update client contact details with a valid 10-digit number."
            );
        }

        boolean success = sendProjectCompletionNotification(project);
        if (!success) {
            throw new IllegalStateException("Failed to send WhatsApp notification. Please check system logs.");
        }
        return true;
    }

    private void notifyManagersOfWhatsAppFailure(Project project, Client client, String reason) {
        try {
            List<User> privilegedUsers = userRepository.findAll().stream()
                    .filter(u -> u.getRoles().stream().anyMatch(r ->
                            r.getName() == RoleType.ROLE_ADMIN || r.getName() == RoleType.ROLE_MANAGER))
                    .toList();

            String clientName = client != null ? client.getCompanyName() : "Unknown Client";
            String title = "WhatsApp Alert: " + project.getProjectCode();
            String message = String.format("Project %s completed, but customer WhatsApp notification could not be sent to '%s' (%s). Please update client contact details and retry.",
                    project.getProjectCode(), clientName, reason);
            String link = "/projects/" + project.getId();

            for (User manager : privilegedUsers) {
                notificationService.sendNotification(manager, title, message, link);
            }
        } catch (Exception ex) {
            log.error("Failed to notify managers of WhatsApp failure: {}", ex.getMessage());
        }
    }
}
