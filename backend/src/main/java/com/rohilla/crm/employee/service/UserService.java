package com.rohilla.crm.employee.service;

import com.rohilla.crm.audit.enums.AuditAction;
import com.rohilla.crm.audit.service.AuditService;
import com.rohilla.crm.auth.service.AuthService;
import com.rohilla.crm.common.enums.DepartmentType;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.employee.enums.DocumentType;
import com.rohilla.crm.employee.enums.DocumentVerificationStatus;
import com.rohilla.crm.employee.enums.UserStatus;
import com.rohilla.crm.security.enums.RoleType;

import com.rohilla.crm.employee.entity.EmployeeDocument;
import com.rohilla.crm.employee.entity.EmployeeProfile;
import com.rohilla.crm.security.entity.Role;
import com.rohilla.crm.employee.entity.User;

import com.rohilla.crm.employee.dto.CreateUserRequest;
import com.rohilla.crm.employee.dto.UserSummaryDto;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.employee.repository.EmployeeDocumentRepository;
import com.rohilla.crm.employee.repository.EmployeeProfileRepository;
import com.rohilla.crm.auth.repository.RefreshTokenRepository;
import com.rohilla.crm.security.repository.RoleRepository;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.security.authorization.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final EmployeeDocumentRepository employeeDocumentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final AuthService authService;

    public synchronized String generateNextEmployeeId() {
        long count = userRepository.count();
        long nextNum = count + 1;
        String candidate = String.format("EMP-%04d", nextNum);
        while (userRepository.existsByEmployeeId(candidate)) {
            nextNum++;
            candidate = String.format("EMP-%04d", nextNum);
        }
        return candidate;
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::populateUserSummary)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDto> getUsersByDepartment(DepartmentType department) {
        return userRepository.findAllByDepartment(department).stream()
                .map(this::populateUserSummary)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDto> getUsersByRole(RoleType role) {
        return userRepository.findAllByRoles_Name(role).stream()
                .map(this::populateUserSummary)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserSummaryDto> getActiveOperationalEmployees() {
        Set<RoleType> operationalRoles = Set.of(
                RoleType.ROLE_DESIGNER,
                RoleType.ROLE_PRODUCTION,
                RoleType.ROLE_QC,
                RoleType.ROLE_DISPATCH
        );

        return userRepository.findAll().stream()
                .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                .filter(u -> u.getRoles().stream().anyMatch(r -> operationalRoles.contains(r.getName())))
                .map(this::populateUserSummary)
                .collect(Collectors.toList());
    }

    private UserSummaryDto populateUserSummary(User u) {
        UserSummaryDto dto = authService.mapToUserSummary(u);
        List<EmployeeDocument> currentDocs = employeeDocumentRepository.findAllByUserIdAndCurrentTrue(u.getId());
        DocumentVerificationStatus aadhaar = DocumentVerificationStatus.NOT_UPLOADED;
        DocumentVerificationStatus pan = DocumentVerificationStatus.NOT_UPLOADED;
        for (EmployeeDocument doc : currentDocs) {
            if (doc.getDocumentType() == DocumentType.AADHAAR) {
                aadhaar = doc.getStatus();
            } else if (doc.getDocumentType() == DocumentType.PAN) {
                pan = doc.getStatus();
            }
        }
        dto.setAadhaarStatus(aadhaar);
        dto.setPanStatus(pan);
        return dto;
    }

    @Transactional
    public UserSummaryDto createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("User already exists with email: " + request.getEmail());
        }

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails().orElse(null);
        boolean isCurrentAdmin = currentUser != null && currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(RoleType.ROLE_ADMIN.name()));
        boolean isCurrentManager = currentUser != null && currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(RoleType.ROLE_MANAGER.name()));

        // STRICT SECURITY RULE 1: Do NOT allow creation of ADMIN / SUPER_ADMIN accounts via employee onboarding
        if (request.getRoles().contains(RoleType.ROLE_ADMIN)) {
            throw new UnauthorizedActionException("Creation of ADMIN / SUPER_ADMIN accounts is strictly forbidden.");
        }

        // STRICT SECURITY RULE 2: Manager can ONLY create operational roles (DESIGNER, PRODUCTION, QC, DISPATCH)
        if (isCurrentManager && !isCurrentAdmin) {
            Set<RoleType> allowedForManager = Set.of(
                    RoleType.ROLE_DESIGNER,
                    RoleType.ROLE_PRODUCTION,
                    RoleType.ROLE_QC,
                    RoleType.ROLE_DISPATCH
            );
            if (!allowedForManager.containsAll(request.getRoles())) {
                throw new UnauthorizedActionException("Managers can only create operational staff (DESIGNER, PRODUCTION, QC, DISPATCH).");
            }
        }

        Set<Role> roles = new HashSet<>();
        for (RoleType roleType : request.getRoles()) {
            Role role = roleRepository.findByName(roleType)
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleType));
            roles.add(role);
        }

        // Generate temporary password if not explicitly supplied or for onboarding
        String rawPassword = (request.getPassword() != null && !request.getPassword().isBlank())
                ? request.getPassword()
                : generateSecureTemporaryPassword();

        UserStatus initialStatus = request.getStatus() != null ? request.getStatus() : UserStatus.ACTIVE;
        String employeeId = generateNextEmployeeId();
        LocalDate joiningDate = LocalDate.now();

        User user = User.builder()
                .employeeId(employeeId)
                .joiningDate(joiningDate)
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(rawPassword))
                .fullName(request.getFullName().trim())
                .phone(request.getPhone())
                .department(request.getDepartment())
                .status(initialStatus)
                .roles(roles)
                .mustChangePassword(true) // Enforce password change on first login
                .build();

        User saved = userRepository.save(user);

        // Initialize EmployeeProfile record
        EmployeeProfile profile = EmployeeProfile.builder()
                .user(saved)
                .address(null)
                .build();
        employeeProfileRepository.save(profile);

        UUID actorId = currentUser != null ? currentUser.getId() : null;
        String actorEmail = currentUser != null ? currentUser.getUsername() : "SYSTEM";
        String actorRole = isCurrentAdmin ? "ROLE_ADMIN" : (isCurrentManager ? "ROLE_MANAGER" : "SYSTEM");

        auditService.publishAudit(
                actorId,
                actorEmail,
                actorRole,
                AuditAction.USER_CREATED,
                "USER",
                saved.getId().toString(),
                null,
                "Created employee " + saved.getEmail() + " (" + saved.getFullName() + ") with Employee ID " + employeeId + " and roles " + request.getRoles(),
                null,
                null
        );

        UserSummaryDto summary = authService.mapToUserSummary(saved);
        summary.setTemporaryPassword(rawPassword); // Returned once to creator
        summary.setAadhaarStatus(DocumentVerificationStatus.NOT_UPLOADED);
        summary.setPanStatus(DocumentVerificationStatus.NOT_UPLOADED);
        return summary;
    }

    public static final String PRIMARY_OWNER_EMAIL = "admin@rohilla.com";

    @Transactional
    public UserSummaryDto updateUserStatus(UUID userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Protect primary Owner account from being deactivated or suspended
        if (PRIMARY_OWNER_EMAIL.equalsIgnoreCase(user.getEmail()) && status != UserStatus.ACTIVE) {
            throw new UnauthorizedActionException("The primary Owner account (" + PRIMARY_OWNER_EMAIL + ") cannot be suspended or deactivated.");
        }

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails().orElse(null);
        boolean isCurrentAdmin = currentUser != null && currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(RoleType.ROLE_ADMIN.name()));

        // Managers cannot deactivate or suspend other Admins or Owners
        boolean targetIsAdmin = user.getRoles().stream().anyMatch(r -> r.getName() == RoleType.ROLE_ADMIN);
        if (targetIsAdmin && !isCurrentAdmin) {
            throw new UnauthorizedActionException("Only Admins can modify status of Administrator accounts.");
        }

        UserStatus oldStatus = user.getStatus();
        user.setStatus(status);
        User saved = userRepository.save(user);

        // If suspended or deactivated, revoke all active sessions immediately
        if (status != UserStatus.ACTIVE) {
            refreshTokenRepository.deleteAllByUser(user);
        }

        UUID actorId = currentUser != null ? currentUser.getId() : null;
        String actorEmail = currentUser != null ? currentUser.getUsername() : "SYSTEM";
        String actorRole = isCurrentAdmin ? "ROLE_ADMIN" : "ROLE_MANAGER";

        auditService.publishAudit(
                actorId,
                actorEmail,
                actorRole,
                AuditAction.USER_STATUS_UPDATED,
                "USER",
                saved.getId().toString(),
                oldStatus.name(),
                status.name(),
                null,
                null
        );

        return authService.mapToUserSummary(saved);
    }

    private String generateSecureTemporaryPassword() {
        java.security.SecureRandom random = new java.security.SecureRandom();
        String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String lower = "abcdefghijkmnopqrstuvwxyz";
        String digits = "23456789";
        String special = "@#$%&*";
        StringBuilder sb = new StringBuilder("Rohilla@");
        String allChars = upper + lower + digits + special;
        for (int i = 0; i < 6; i++) {
            sb.append(allChars.charAt(random.nextInt(allChars.length())));
        }
        return sb.toString();
    }
}
