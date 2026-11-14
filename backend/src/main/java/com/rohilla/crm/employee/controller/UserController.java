package com.rohilla.crm.employee.controller;

import com.rohilla.crm.common.response.ApiResponse;
import com.rohilla.crm.employee.dto.CreateUserRequest;
import com.rohilla.crm.employee.dto.EmployeeDocumentDto;
import com.rohilla.crm.employee.dto.UpdateUserStatusRequest;
import com.rohilla.crm.employee.dto.UserProfileDto;
import com.rohilla.crm.employee.dto.UserSummaryDto;
import com.rohilla.crm.employee.dto.VerifyDocumentRequest;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.security.entity.Role;

import com.rohilla.crm.common.enums.DepartmentType;
import com.rohilla.crm.security.enums.RoleType;

import com.rohilla.crm.employee.service.ProfileService;
import com.rohilla.crm.employee.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final ProfileService profileService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or hasAuthority('user:read')")
    public ResponseEntity<ApiResponse<List<UserSummaryDto>>> getAllUsers(
            @RequestParam(required = false) DepartmentType department,
            @RequestParam(required = false) RoleType role) {
        List<UserSummaryDto> users;
        if (department != null) {
            users = userService.getUsersByDepartment(department);
        } else if (role != null) {
            users = userService.getUsersByRole(role);
        } else {
            users = userService.getAllUsers();
        }
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/operational")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or hasAuthority('user:read')")
    public ResponseEntity<ApiResponse<List<UserSummaryDto>>> getActiveOperationalStaff() {
        List<UserSummaryDto> operational = userService.getActiveOperationalEmployees();
        return ResponseEntity.ok(ApiResponse.success(operational));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or hasAuthority('user:create')")
    public ResponseEntity<ApiResponse<UserSummaryDto>> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        UserSummaryDto created = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "User created successfully"));
    }

    @PatchMapping("/{userId}/status")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or hasAuthority('user:update')")
    public ResponseEntity<ApiResponse<UserSummaryDto>> updateUserStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        UserSummaryDto updated = userService.updateUserStatus(userId, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(updated, "User status updated"));
    }

    @GetMapping("/{userId}/profile")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or hasAuthority('user:read')")
    public ResponseEntity<ApiResponse<UserProfileDto>> getEmployeeProfile(@PathVariable UUID userId) {
        UserProfileDto profile = profileService.getEmployeeProfileByUserId(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/{userId}/photo")
    public ResponseEntity<Resource> getEmployeePhoto(@PathVariable UUID userId) {
        Resource resource = profileService.loadProfilePhotoResource(userId);
        String contentType = "image/jpeg";
        if (resource.getFilename() != null && resource.getFilename().toLowerCase().endsWith(".png")) {
            contentType = "image/png";
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    @PostMapping("/{userId}/documents/{documentId}/verify")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasAuthority('user:update')")
    public ResponseEntity<ApiResponse<EmployeeDocumentDto>> verifyDocument(
            @PathVariable UUID userId,
            @PathVariable UUID documentId,
            @Valid @RequestBody VerifyDocumentRequest request) {
        EmployeeDocumentDto verified = profileService.verifyKycDocument(documentId, request);
        return ResponseEntity.ok(ApiResponse.success(verified, "Document verification status updated successfully"));
    }

    @GetMapping("/{userId}/documents/{documentId}/download")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasAuthority('user:read')")
    public ResponseEntity<Resource> downloadEmployeeDocument(
            @PathVariable UUID userId,
            @PathVariable UUID documentId) {
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
}
