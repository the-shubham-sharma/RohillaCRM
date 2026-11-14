package com.rohilla.crm.qc.controller;

import com.rohilla.crm.common.response.ApiResponse;
import com.rohilla.crm.qc.dto.QCEvaluationDto;
import com.rohilla.crm.qc.dto.RecordQcEvaluationRequest;
import com.rohilla.crm.qc.service.QcService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/qc")
@RequiredArgsConstructor
public class QcController {

    private final QcService qcService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or @projectSecurity.canPerformQc(authentication, #projectId)")
    public ResponseEntity<ApiResponse<QCEvaluationDto>> recordQcEvaluation(
            @PathVariable UUID projectId,
            @Valid @RequestBody RecordQcEvaluationRequest request) {
        QCEvaluationDto evaluation = qcService.recordEvaluation(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(evaluation, "QC evaluation recorded successfully"));
    }
}
