package com.rohilla.crm.project.controller;

import com.rohilla.crm.common.response.ApiResponse;
import com.rohilla.crm.design.dto.CustomerApprovalRequest;
import com.rohilla.crm.design.dto.ManagerApprovalRequest;
import com.rohilla.crm.design.dto.TechnicalCheckRequest;
import com.rohilla.crm.dispatch.dto.RecordInstallationRequest;
import com.rohilla.crm.notification.entity.Notification;
import com.rohilla.crm.notification.service.WhatsAppNotificationService;
import com.rohilla.crm.project.dto.AssignTaskRequest;
import com.rohilla.crm.project.dto.CreateProjectRequest;
import com.rohilla.crm.project.dto.ProjectDetailDto;
import com.rohilla.crm.project.dto.ProjectResponseDto;
import com.rohilla.crm.project.dto.UpdateProjectRequest;
import com.rohilla.crm.project.entity.Project;


import com.rohilla.crm.project.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final com.rohilla.crm.notification.service.WhatsAppNotificationService whatsAppNotificationService;


    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or hasAuthority('project:read:all')")
    public ResponseEntity<ApiResponse<List<ProjectResponseDto>>> getAllProjects() {
        List<ProjectResponseDto> projects = projectService.getAllProjects();
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or hasAuthority('project:read:all')")
    public ResponseEntity<ApiResponse<List<ProjectResponseDto>>> getProjectHistory() {
        List<ProjectResponseDto> history = projectService.getProjectHistory();
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/my-work")
    public ResponseEntity<ApiResponse<List<ProjectResponseDto>>> getMyWorkProjects() {
        List<ProjectResponseDto> projects = projectService.getMyWorkProjects();
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    @GetMapping("/{projectId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or @projectSecurity.canViewProject(authentication, #projectId)")
    public ResponseEntity<ApiResponse<ProjectDetailDto>> getProjectDetail(@PathVariable UUID projectId) {
        ProjectDetailDto project = projectService.getProjectDetail(projectId);
        return ResponseEntity.ok(ApiResponse.success(project));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or hasAuthority('project:create')")
    public ResponseEntity<ApiResponse<ProjectResponseDto>> createProject(
            @Valid @RequestBody CreateProjectRequest request) {
        ProjectResponseDto created = projectService.createProject(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Project created successfully"));
    }

    @PutMapping("/{projectId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or @projectSecurity.canEditProject(authentication, #projectId)")
    public ResponseEntity<ApiResponse<ProjectResponseDto>> updateProject(
            @PathVariable UUID projectId,
            @Valid @RequestBody UpdateProjectRequest request) {
        ProjectResponseDto updated = projectService.updateProject(projectId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Project updated successfully"));
    }

    @PostMapping("/{projectId}/assign")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or @projectSecurity.canEditProject(authentication, #projectId)")
    public ResponseEntity<ApiResponse<ProjectDetailDto>> assignTask(
            @PathVariable UUID projectId,
            @Valid @RequestBody AssignTaskRequest request) {
        ProjectDetailDto updated = projectService.assignTask(projectId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Task assigned successfully"));
    }

    // PATH A: Designer Technical / Machine Compatibility Check
    @PostMapping("/{projectId}/technical-check")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or @projectSecurity.canPerformDesignAction(authentication, #projectId)")
    public ResponseEntity<ApiResponse<ProjectDetailDto>> recordTechnicalCheck(
            @PathVariable UUID projectId,
            @Valid @RequestBody TechnicalCheckRequest request) {
        ProjectDetailDto updated = projectService.recordTechnicalCheck(projectId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Technical check recorded successfully"));
    }

    // PATH B: Customer Design Approval
    @PostMapping("/{projectId}/customer-approval")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or @projectSecurity.canApproveDesign(authentication, #projectId)")
    public ResponseEntity<ApiResponse<ProjectDetailDto>> recordCustomerApproval(
            @PathVariable UUID projectId,
            @Valid @RequestBody CustomerApprovalRequest request) {
        ProjectDetailDto updated = projectService.recordCustomerApproval(projectId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Customer approval decision recorded"));
    }

    // PATH B: Manager Final Production Approval & Version Locking
    @PostMapping("/{projectId}/manager-approval")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or @projectSecurity.canApproveDesign(authentication, #projectId)")
    public ResponseEntity<ApiResponse<ProjectDetailDto>> recordManagerApproval(
            @PathVariable UUID projectId,
            @Valid @RequestBody ManagerApprovalRequest request) {
        ProjectDetailDto updated = projectService.recordManagerApproval(projectId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Manager production approval recorded and design version locked"));
    }

    // Installation Completion
    @PostMapping("/{projectId}/installation")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or @projectSecurity.canPerformDispatch(authentication, #projectId)")
    public ResponseEntity<ApiResponse<ProjectDetailDto>> recordInstallation(
            @PathVariable UUID projectId,
            @Valid @RequestBody RecordInstallationRequest request) {
        ProjectDetailDto updated = projectService.recordInstallation(projectId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Installation recorded successfully"));
    }

    // Customer WhatsApp Notification Manual Retry
    @PostMapping("/{projectId}/whatsapp/retry")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<String>> retryWhatsAppNotification(@PathVariable UUID projectId) {
        whatsAppNotificationService.retryNotification(projectId);
        return ResponseEntity.ok(ApiResponse.success("WhatsApp customer notification sent successfully"));
    }
}

