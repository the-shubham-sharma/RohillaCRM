package com.rohilla.crm.employee.controller;

import com.rohilla.crm.employee.entity.User;

import com.rohilla.crm.employee.enums.DocumentType;
import com.rohilla.crm.common.response.ApiResponse;
import com.rohilla.crm.employee.dto.EmployeeDocumentDto;
import com.rohilla.crm.employee.dto.UpdateProfileRequest;
import com.rohilla.crm.employee.dto.UserProfileDto;
import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.security.authorization.SecurityUtils;
import com.rohilla.crm.employee.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<ApiResponse<UserProfileDto>> getMyProfile() {
        UserProfileDto profile = profileService.getMyProfile();
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserProfileDto>> updateMyProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileDto updated = profileService.updateMyProfile(request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Profile updated successfully"));
    }

    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UserProfileDto>> uploadProfilePhoto(
            @RequestParam("file") MultipartFile file) {
        UserProfileDto updated = profileService.uploadProfilePhoto(file);
        return ResponseEntity.ok(ApiResponse.success(updated, "Profile photo uploaded successfully"));
    }

    @GetMapping("/photo")
    public ResponseEntity<Resource> getMyProfilePhoto() {
        CustomUserDetails user = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new IllegalArgumentException("Authentication required"));
        Resource resource = profileService.loadProfilePhotoResource(user.getId());

        String contentType = "image/jpeg";
        if (resource.getFilename() != null && resource.getFilename().toLowerCase().endsWith(".png")) {
            contentType = "image/png";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    @PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<EmployeeDocumentDto>> uploadKycDocument(
            @RequestParam("documentType") DocumentType documentType,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "documentNumber", required = false) String documentNumber) {
        EmployeeDocumentDto uploaded = profileService.uploadKycDocument(documentType, file, documentNumber);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(uploaded, documentType.name() + " uploaded successfully and submitted for verification."));
    }

    @GetMapping("/documents/{documentId}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable UUID documentId) {
        Resource resource = profileService.loadKycDocumentResource(documentId);
        String filename = resource.getFilename();
        String contentType = "application/octet-stream";
        if (filename != null) {
            if (filename.toLowerCase().endsWith(".pdf")) contentType = "application/pdf";
            else if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) contentType = "image/jpeg";
            else if (filename.toLowerCase().endsWith(".png")) contentType = "image/png";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + (filename != null ? filename : "document") + "\"")
                .body(resource);
    }

    @GetMapping("/documents/{documentType}/history")
    public ResponseEntity<ApiResponse<List<EmployeeDocumentDto>>> getDocumentHistory(
            @PathVariable DocumentType documentType) {
        CustomUserDetails user = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new IllegalArgumentException("Authentication required"));
        List<EmployeeDocumentDto> history = profileService.getDocumentHistory(user.getId(), documentType);
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
