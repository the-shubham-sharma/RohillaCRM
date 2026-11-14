package com.rohilla.crm.auth.controller;

import com.rohilla.crm.auth.dto.ChangePasswordRequest;
import com.rohilla.crm.auth.entity.RefreshToken;
import com.rohilla.crm.employee.entity.User;

import com.rohilla.crm.common.response.ApiResponse;
import com.rohilla.crm.auth.dto.AuthResponse;
import com.rohilla.crm.auth.dto.LoginRequest;
import com.rohilla.crm.auth.dto.RefreshTokenRequest;
import com.rohilla.crm.employee.dto.UserSummaryDto;
import com.rohilla.crm.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest request) {
        AuthResponse authResponse = authService.login(loginRequest, request);
        return ResponseEntity.ok(ApiResponse.success(authResponse, "Login successful"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest refreshRequest,
            HttpServletRequest request) {
        AuthResponse authResponse = authService.refreshToken(refreshRequest, request);
        return ResponseEntity.ok(ApiResponse.success(authResponse, "Token refreshed successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestBody(required = false) RefreshTokenRequest refreshRequest) {
        if (refreshRequest != null) {
            authService.logout(refreshRequest.getRefreshToken());
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserSummaryDto>> getCurrentUser() {
        UserSummaryDto user = authService.getCurrentUserSummary();
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<UserSummaryDto>> changePassword(
            @Valid @RequestBody com.rohilla.crm.auth.dto.ChangePasswordRequest changePasswordRequest,
            HttpServletRequest request) {
        UserSummaryDto user = authService.changePassword(changePasswordRequest, request);
        return ResponseEntity.ok(ApiResponse.success(user, "Password changed successfully"));
    }
}
