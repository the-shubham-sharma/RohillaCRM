package com.rohilla.crm.dispatch.service;

import com.rohilla.crm.audit.service.AuditService;
import com.rohilla.crm.auth.service.AuthService;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.project.workflow.WorkflowTransitionService;

import com.rohilla.crm.dispatch.entity.DispatchRecord;
import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.audit.enums.AuditAction;
import com.rohilla.crm.project.enums.ProjectStatus;
import com.rohilla.crm.dispatch.dto.DispatchRecordDto;
import com.rohilla.crm.dispatch.dto.RecordDispatchRequest;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.dispatch.repository.DispatchRecordRepository;
import com.rohilla.crm.project.repository.ProjectRepository;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.security.authorization.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DispatchService {

    private final DispatchRecordRepository dispatchRecordRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final AuditService auditService;
    private final WorkflowTransitionService workflowTransitionService;

    @Transactional
    public DispatchRecordDto recordDispatch(UUID projectId, RecordDispatchRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        User dispatcher = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        DispatchRecord record = DispatchRecord.builder()
                .project(project)
                .dispatchDate(request.getDispatchDate())
                .courierPartner(request.getCourierPartner())
                .trackingNumber(request.getTrackingNumber())
                .recipientName(request.getRecipientName())
                .destinationAddress(request.getDestinationAddress())
                .dispatchedBy(dispatcher)
                .dispatchNotes(request.getDispatchNotes())
                .build();

        DispatchRecord saved = dispatchRecordRepository.save(record);

        auditService.publishAudit(
                dispatcher.getId(),
                dispatcher.getEmail(),
                "ROLE_DISPATCH",
                AuditAction.DISPATCH_RECORDED,
                "DISPATCH_RECORD",
                saved.getId().toString(),
                null,
                "Dispatched via " + request.getCourierPartner() + " (Tracking: " + request.getTrackingNumber() + ")",
                null,
                null
        );

        // Auto-transition to DISPATCHED
        if (project.getStatus() == ProjectStatus.QC_PASSED) {
            workflowTransitionService.transitionProjectStatus(project, ProjectStatus.DISPATCHED,
                    "Dispatched via " + request.getCourierPartner() + " #" + request.getTrackingNumber());
        }

        return mapToDto(saved);
    }

    private DispatchRecordDto mapToDto(DispatchRecord d) {
        return DispatchRecordDto.builder()
                .id(d.getId())
                .projectId(d.getProject().getId())
                .dispatchDate(d.getDispatchDate())
                .courierPartner(d.getCourierPartner())
                .trackingNumber(d.getTrackingNumber())
                .recipientName(d.getRecipientName())
                .destinationAddress(d.getDestinationAddress())
                .podPhotoStorageKey(d.getPodPhotoStorageKey())
                .dispatchedBy(authService.mapToUserSummary(d.getDispatchedBy()))
                .dispatchNotes(d.getDispatchNotes())
                .createdAt(d.getCreatedAt())
                .build();
    }
}
