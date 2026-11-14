package com.rohilla.crm.production.controller;

import com.rohilla.crm.common.response.ApiResponse;
import com.rohilla.crm.production.dto.CreateProductionTaskRequest;
import com.rohilla.crm.production.dto.ProductionTaskDto;
import com.rohilla.crm.production.service.ProductionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ProductionController {

    private final ProductionService productionService;

    @PostMapping("/projects/{projectId}/production-tasks")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or @projectSecurity.canPerformProduction(authentication, #projectId)")
    public ResponseEntity<ApiResponse<ProductionTaskDto>> createProductionTask(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateProductionTaskRequest request) {
        ProductionTaskDto task = productionService.createTask(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(task, "Production task created"));
    }

    @PatchMapping("/production-tasks/{taskId}/complete")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_PRODUCTION')")
    public ResponseEntity<ApiResponse<ProductionTaskDto>> completeProductionTask(
            @PathVariable UUID taskId,
            @RequestParam(required = false) String notes) {
        ProductionTaskDto task = productionService.completeTask(taskId, notes);
        return ResponseEntity.ok(ApiResponse.success(task, "Production task marked completed"));
    }
}
