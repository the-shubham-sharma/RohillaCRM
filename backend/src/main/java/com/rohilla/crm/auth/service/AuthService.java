package com.rohilla.crm.auth.service;

import com.rohilla.crm.audit.service.AuditService;
import com.rohilla.crm.auth.dto.ChangePasswordRequest;
import com.rohilla.crm.common.exception.UnauthorizedActionException;

import com.rohilla.crm.security.entity.Permission;
import com.rohilla.crm.auth.entity.RefreshToken;
import com.rohilla.crm.security.entity.Role;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.audit.enums.AuditAction;
import com.rohilla.crm.security.enums.RoleType;
import com.rohilla.crm.employee.enums.UserStatus;
import com.rohilla.crm.auth.dto.AuthResponse;
import com.rohilla.crm.auth.dto.LoginRequest;
import com.rohilla.crm.auth.dto.RefreshTokenRequest;
import com.rohilla.crm.employee.dto.UserSummaryDto;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.auth.repository.RefreshTokenRepository;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.security.jwt.JwtTokenProvider;
import com.rohilla.crm.security.rate_limit.RateLimiterService;
import com.rohilla.crm.security.authorization.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RateLimiterService rateLimiterService;
    private final AuditService auditService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String rateLimitKey = clientIp + "_" + request.getEmail();

        if (!rateLimiterService.tryConsumeLoginAttempt(rateLimitKey)) {
            auditService.publishAudit(null, request.getEmail(), "ANONYMOUS", AuditAction.LOGIN_FAILED,
                    "AUTH", null, null, "Rate limit exceeded (brute-force protection)", clientIp, userAgent);
            throw new LockedException("Too many failed login attempts. Please wait 1 minute before trying again.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            User user = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

            if (user.getStatus() != UserStatus.ACTIVE) {
                throw new UnauthorizedActionException("User account is " + user.getStatus().name());
            }

            // Generate JWT Access Token
            String accessToken = tokenProvider.generateAccessToken(userDetails);

            // Generate & persist Refresh Token
            String rawRefreshToken = tokenProvider.generateOpaqueRefreshToken();
            String tokenHash = hashToken(rawRefreshToken);

            RefreshToken refreshTokenEntity = RefreshToken.builder()
                    .user(user)
                    .tokenHash(tokenHash)
                    .expiresAt(Instant.now().plusMillis(tokenProvider.getRefreshTokenExpirationMs()))
                    .revoked(false)
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .build();

            refreshTokenRepository.save(refreshTokenEntity);

            // Clear rate limiting on successful login
            rateLimiterService.clearLimit(rateLimitKey);

            // Publish Audit Log
            String primaryRole = user.getRoles().isEmpty() ? "NONE" : user.getRoles().iterator().next().getName().name();
            auditService.publishAudit(user.getId(), user.getEmail(), primaryRole, AuditAction.LOGIN_SUCCESS,
                    "USER", user.getId().toString(), null, "User successfully logged in", clientIp, userAgent);

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(rawRefreshToken)
                    .tokenType("Bearer")
                    .expiresInMs(tokenProvider.getAccessTokenExpirationMs())
                    .user(mapToUserSummary(user))
                    .build();

        } catch (BadCredentialsException ex) {
            auditService.publishAudit(null, request.getEmail(), "ANONYMOUS", AuditAction.LOGIN_FAILED,
                    "AUTH", null, null, "Bad credentials entered", clientIp, userAgent);
            throw new BadCredentialsException("Invalid email or password");
        }
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String incomingHash = hashToken(request.getRefreshToken());

        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(incomingHash)
                .orElseThrow(() -> new UnauthorizedActionException("Invalid refresh token"));

        if (storedToken.isRevoked() || storedToken.isExpired()) {
            // Revoke all tokens for this user if expired/revoked token was reused (replay detection)
            refreshTokenRepository.deleteAllByUser(storedToken.getUser());
            throw new UnauthorizedActionException("Refresh token is invalid or expired. Please log in again.");
        }

        User user = storedToken.getUser();
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedActionException("User account is not active");
        }

        // ROTATION: Revoke the old refresh token
        storedToken.setRevoked(true);
        refreshTokenRepository.save(storedToken);

        // Issue new access token & new refresh token
        CustomUserDetails userDetails = new CustomUserDetails(user);
        String newAccessToken = tokenProvider.generateAccessToken(userDetails);

        String newRawRefreshToken = tokenProvider.generateOpaqueRefreshToken();
        String newTokenHash = hashToken(newRawRefreshToken);

        RefreshToken newRefreshTokenEntity = RefreshToken.builder()
                .user(user)
                .tokenHash(newTokenHash)
                .expiresAt(Instant.now().plusMillis(tokenProvider.getRefreshTokenExpirationMs()))
                .revoked(false)
                .clientIp(clientIp)
                .userAgent(userAgent)
                .build();

        refreshTokenRepository.save(newRefreshTokenEntity);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRawRefreshToken)
                .tokenType("Bearer")
                .expiresInMs(tokenProvider.getAccessTokenExpirationMs())
                .user(mapToUserSummary(user))
                .build();
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            String tokenHash = hashToken(rawRefreshToken);
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
        }
    }

    @Transactional(readOnly = true)
    public UserSummaryDto getCurrentUserSummary() {
        UUID userId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new UnauthorizedActionException("No authenticated user in context"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return mapToUserSummary(user);
    }

    @Transactional
    public UserSummaryDto changePassword(com.rohilla.crm.auth.dto.ChangePasswordRequest request, HttpServletRequest httpRequest) {
        UUID userId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required to change password"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            String clientIp = getClientIp(httpRequest);
            String userAgent = httpRequest != null ? httpRequest.getHeader("User-Agent") : "UNKNOWN";
            auditService.publishAudit(user.getId(), user.getEmail(), "ANONYMOUS", AuditAction.LOGIN_FAILED,
                    "AUTH", user.getId().toString(), null, "Password change failed: Incorrect current password", clientIp, userAgent);
            throw new BadCredentialsException("Current password is incorrect");
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new IllegalArgumentException("New password must be at least 8 characters long");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        User saved = userRepository.save(user);

        String clientIp = httpRequest != null ? getClientIp(httpRequest) : "127.0.0.1";
        String userAgent = httpRequest != null ? httpRequest.getHeader("User-Agent") : "UNKNOWN";
        String primaryRole = user.getRoles().isEmpty() ? "NONE" : user.getRoles().iterator().next().getName().name();

        auditService.publishAudit(user.getId(), user.getEmail(), primaryRole, AuditAction.PASSWORD_CHANGED,
                "USER", user.getId().toString(), null, "Password changed successfully (mustChangePassword reset to false)", clientIp, userAgent);

        return mapToUserSummary(saved);
    }

    public UserSummaryDto mapToUserSummary(User user) {
        List<RoleType> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        List<String> permissions = user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(Permission::getName)
                .distinct()
                .collect(Collectors.toList());

        boolean hasPhoto = user.getProfile() != null && user.getProfile().getProfilePhotoKey() != null;

        return UserSummaryDto.builder()
                .id(user.getId())
                .employeeId(user.getEmployeeId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .department(user.getDepartment())
                .status(user.getStatus())
                .roles(roles)
                .permissions(permissions)
                .mustChangePassword(user.isMustChangePassword())
                .joiningDate(user.getJoiningDate())
                .hasProfilePhoto(hasPhoto)
                .build();
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        } else if (ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
