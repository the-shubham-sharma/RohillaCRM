package com.rohilla.crm.dispatch.controller;

import com.rohilla.crm.common.response.ApiResponse;
import com.rohilla.crm.dispatch.dto.DispatchRecordDto;
import com.rohilla.crm.dispatch.dto.RecordDispatchRequest;
import com.rohilla.crm.dispatch.service.DispatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/dispatch")
@RequiredArgsConstructor
public class DispatchController {

    private final DispatchService dispatchService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or @projectSecurity.canPerformDispatch(authentication, #projectId)")
    public ResponseEntity<ApiResponse<DispatchRecordDto>> recordDispatch(
            @PathVariable UUID projectId,
            @Valid @RequestBody RecordDispatchRequest request) {
        DispatchRecordDto record = dispatchService.recordDispatch(projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(record, "Dispatch record created successfully"));
    }
}
