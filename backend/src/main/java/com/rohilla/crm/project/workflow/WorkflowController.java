package com.rohilla.crm.project.workflow;

import com.rohilla.crm.common.exception.ResourceNotFoundException;

import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.common.response.ApiResponse;
import com.rohilla.crm.project.dto.ProjectResponseDto;
import com.rohilla.crm.project.dto.StateTransitionRequest;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.project.repository.ProjectRepository;
import com.rohilla.crm.project.service.ProjectService;
import com.rohilla.crm.project.workflow.WorkflowTransitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/workflow")
@RequiredArgsConstructor
public class WorkflowController {

    private final ProjectRepository projectRepository;
    private final WorkflowTransitionService workflowTransitionService;
    private final ProjectService projectService;

    @PostMapping("/transition")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or @projectSecurity.canAccessProject(authentication, #projectId)")
    public ResponseEntity<ApiResponse<ProjectResponseDto>> transitionState(
            @PathVariable UUID projectId,
            @Valid @RequestBody StateTransitionRequest request) {

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        Project updatedProject = workflowTransitionService.transitionProjectStatus(
                project, request.getTargetStatus(), request.getRemarks());

        return ResponseEntity.ok(ApiResponse.success(
                projectService.mapToResponseDto(updatedProject),
                "Workflow transitioned to " + updatedProject.getStatus()
        ));
    }
}
