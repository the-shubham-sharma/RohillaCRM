package com.rohilla.crm.file.controller;

import com.rohilla.crm.design.entity.DesignFile;
import com.rohilla.crm.common.response.ApiResponse;
import com.rohilla.crm.design.dto.DesignFileDto;
import com.rohilla.crm.auth.service.AuthService;
import com.rohilla.crm.file.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;
    private final AuthService authService;

    @PostMapping("/projects/{projectId}/files")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or @projectSecurity.canAccessProject(authentication, #projectId)")
    public ResponseEntity<ApiResponse<DesignFileDto>> uploadDesignFile(
            @PathVariable UUID projectId,
            @RequestParam("file") MultipartFile file) {

        DesignFile saved = fileStorageService.storeDesignFile(projectId, file);

        DesignFileDto dto = DesignFileDto.builder()
                .id(saved.getId())
                .projectId(saved.getProject().getId())
                .originalFileName(saved.getOriginalFileName())
                .storageKey(saved.getStorageKey())
                .fileSizeBytes(saved.getFileSizeBytes())
                .mimeType(saved.getMimeType())
                .versionNumber(saved.getVersionNumber())
                .uploadedBy(authService.mapToUserSummary(saved.getUploadedBy()))
                .approvedByCustomer(saved.getApprovedByCustomer())
                .customerFeedback(saved.getCustomerFeedback())
                .isProductionApproved(saved.isProductionApproved())
                .isLocked(saved.isLocked())
                .createdAt(saved.getCreatedAt())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(dto, "Design file uploaded and verified successfully"));
    }

    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable UUID fileId) {
        Resource fileResource = fileStorageService.loadFileAsResource(fileId);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileResource.getFilename() + "\"")
                .body(fileResource);
    }
}
