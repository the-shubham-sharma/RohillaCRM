package com.rohilla.crm.lead.controller;

import com.rohilla.crm.lead.entity.Lead;
import com.rohilla.crm.project.dto.ProjectResponseDto;
import com.rohilla.crm.project.entity.Project;

import com.rohilla.crm.lead.enums.LeadStatus;
import com.rohilla.crm.common.response.ApiResponse;
import com.rohilla.crm.lead.dto.LeadResponseDto;
import com.rohilla.crm.lead.dto.UpdateLeadStatusRequest;
import com.rohilla.crm.lead.service.LeadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/leads")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
public class LeadController {

    private final LeadService leadService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LeadResponseDto>>> getLeads(
            @RequestParam(required = false) LeadStatus status,
            @RequestParam(required = false) String search) {
        List<LeadResponseDto> leads = leadService.getAllLeads(status, search);
        return ResponseEntity.ok(ApiResponse.success(leads, "Leads retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LeadResponseDto>> getLeadById(@PathVariable UUID id) {
        LeadResponseDto lead = leadService.getLeadById(id);
        return ResponseEntity.ok(ApiResponse.success(lead, "Lead details retrieved"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<LeadResponseDto>> updateLeadStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLeadStatusRequest request) {
        LeadResponseDto updated = leadService.updateLeadStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Lead status updated to " + request.getStatus()));
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<ApiResponse<com.rohilla.crm.project.dto.ProjectResponseDto>> convertLeadToProject(@PathVariable UUID id) {
        com.rohilla.crm.project.dto.ProjectResponseDto project = leadService.convertLeadToProject(id, null);
        return ResponseEntity.ok(ApiResponse.success(project, "Lead successfully converted to Project/Job: " + project.getProjectCode()));
    }
}
