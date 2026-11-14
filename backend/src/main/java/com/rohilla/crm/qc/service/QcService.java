package com.rohilla.crm.qc.service;

import com.rohilla.crm.audit.service.AuditService;
import com.rohilla.crm.auth.service.AuthService;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.project.workflow.WorkflowTransitionService;

import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.qc.entity.QCEvaluation;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.audit.enums.AuditAction;
import com.rohilla.crm.project.enums.ProjectStatus;
import com.rohilla.crm.qc.dto.QCEvaluationDto;
import com.rohilla.crm.qc.dto.RecordQcEvaluationRequest;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.project.repository.ProjectRepository;
import com.rohilla.crm.qc.repository.QCEvaluationRepository;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.security.authorization.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QcService {

    private final QCEvaluationRepository qcEvaluationRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final AuditService auditService;
    private final WorkflowTransitionService workflowTransitionService;

    @Transactional
    public QCEvaluationDto recordEvaluation(UUID projectId, RecordQcEvaluationRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        User inspector = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        QCEvaluation evaluation = QCEvaluation.builder()
                .project(project)
                .inspector(inspector)
                .passed(request.getPassed())
                .colorAccuracyScore(request.getColorAccuracyScore())
                .dimensionAccuracyScore(request.getDimensionAccuracyScore())
                .finishingScore(request.getFinishingScore())
                .remarks(request.getRemarks())
                .defectsNotes(request.getDefectsNotes())
                .build();

        QCEvaluation saved = qcEvaluationRepository.save(evaluation);

        auditService.publishAudit(
                inspector.getId(),
                inspector.getEmail(),
                "ROLE_QC",
                AuditAction.QC_INSPECTION_RECORDED,
                "QC_EVALUATION",
                saved.getId().toString(),
                null,
                "QC Inspection: " + (request.getPassed() ? "PASSED" : "FAILED") +
                        " (Color: " + request.getColorAccuracyScore() + "/10, Finish: " + request.getFinishingScore() + "/10)",
                null,
                null
        );

        // Auto-transition workflow state based on inspection result
        ProjectStatus targetStatus = request.getPassed() ? ProjectStatus.QC_PASSED : ProjectStatus.QC_REJECTED;
        if (project.getStatus() == ProjectStatus.QC_PENDING || project.getStatus() == ProjectStatus.IN_PRODUCTION) {
            workflowTransitionService.transitionProjectStatus(project, targetStatus, request.getRemarks());
        }

        return mapToDto(saved);
    }

    private QCEvaluationDto mapToDto(QCEvaluation q) {
        return QCEvaluationDto.builder()
                .id(q.getId())
                .projectId(q.getProject().getId())
                .inspector(authService.mapToUserSummary(q.getInspector()))
                .passed(q.isPassed())
                .colorAccuracyScore(q.getColorAccuracyScore())
                .dimensionAccuracyScore(q.getDimensionAccuracyScore())
                .finishingScore(q.getFinishingScore())
                .remarks(q.getRemarks())
                .defectsNotes(q.getDefectsNotes())
                .inspectionPhotoStorageKey(q.getInspectionPhotoStorageKey())
                .createdAt(q.getCreatedAt())
                .build();
    }
}
