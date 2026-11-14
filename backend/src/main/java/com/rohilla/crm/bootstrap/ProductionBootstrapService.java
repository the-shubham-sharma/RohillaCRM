package com.rohilla.crm.bootstrap;

import com.rohilla.crm.project.entity.Project;

import com.rohilla.crm.security.entity.Permission;
import com.rohilla.crm.security.entity.Role;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.common.enums.DepartmentType;
import com.rohilla.crm.security.enums.RoleType;
import com.rohilla.crm.employee.enums.UserStatus;
import com.rohilla.crm.security.repository.PermissionRepository;
import com.rohilla.crm.security.repository.RoleRepository;
import com.rohilla.crm.employee.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.*;

/**
 * Production Bootstrap Service for Rohilla Advertising CRM.
 * 
 * Activated strictly under the 'prod' profile.
 * Responsibilities:
 * 1. Idempotently seeds system permissions and the 6 CRM roles (ROLE_ADMIN, ROLE_MANAGER, ROLE_DESIGNER, ROLE_PRODUCTION, ROLE_QC, ROLE_DISPATCH).
 * 2. Checks if an administrator/owner account exists.
 * 3. If NO administrator exists, provisions the initial Owner account using secure environment variables
 *    (INITIAL_OWNER_EMAIL, INITIAL_OWNER_PASSWORD) or generates a cryptographically secure random password.
 * 4. Flags initial Owner with 'mustChangePassword = true'.
 * 5. NEVER creates demo accounts or uses hardcoded passwords.
 */
@Slf4j
@Component
@Profile("prod")
@RequiredArgsConstructor
public class ProductionBootstrapService implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.initial-owner.email:owner@rohilla.com}")
    private String initialOwnerEmail;

    @Value("${app.initial-owner.password:}")
    private String initialOwnerPassword;

    @Value("${app.initial-owner.name:Aditye Rohilla}")
    private String initialOwnerName;

    @Value("${app.initial-owner.phone:+91-9811000000}")
    private String initialOwnerPhone;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting Rohilla Advertising CRM Production Bootstrap verification...");

        // 1. Initialize System Permissions
        Map<String, Permission> permMap = initializePermissions();

        // 2. Initialize the 6 Core CRM Roles
        Map<RoleType, Role> roleMap = initializeRoles(permMap);

        // 3. Initialize Production Owner Account if not present
        initializeProductionOwner(roleMap.get(RoleType.ROLE_ADMIN));
    }

    private Map<String, Permission> initializePermissions() {
        Map<String, Permission> permMap = new HashMap<>();
        String[] permissions = {
                "user:read", "user:create", "user:update", "user:delete",
                "project:read:all", "project:read:assigned", "project:create", "project:update", "project:delete",
                "design:upload", "design:technical_check", "design:review", "design:approve",
                "production:manage", "production:execute",
                "qc:evaluate",
                "dispatch:manage", "installation:manage",
                "audit:read",
                "report:view"
        };

        for (String pName : permissions) {
            Permission permission = permissionRepository.findByName(pName)
                    .orElseGet(() -> permissionRepository.save(
                            Permission.builder()
                                    .name(pName)
                                    .description("System permission for " + pName)
                                    .build()
                    ));
            permMap.put(pName, permission);
        }
        log.info("Production permissions verified ({} total).", permMap.size());
        return permMap;
    }

    private Map<RoleType, Role> initializeRoles(Map<String, Permission> permMap) {
        Map<RoleType, Role> roleMap = new EnumMap<>(RoleType.class);

        roleMap.put(RoleType.ROLE_ADMIN, getOrCreateRole(
                RoleType.ROLE_ADMIN,
                "Company Owner & System Administrator",
                new HashSet<>(permMap.values())
        ));

        roleMap.put(RoleType.ROLE_MANAGER, getOrCreateRole(
                RoleType.ROLE_MANAGER,
                "Operations & Project Workflow Controller",
                Set.of(
                        permMap.get("project:read:all"), permMap.get("project:create"), permMap.get("project:update"),
                        permMap.get("design:upload"), permMap.get("design:review"), permMap.get("design:approve"),
                        permMap.get("production:manage"), permMap.get("qc:evaluate"), permMap.get("dispatch:manage"),
                        permMap.get("installation:manage"), permMap.get("audit:read"), permMap.get("report:view")
                )
        ));

        roleMap.put(RoleType.ROLE_DESIGNER, getOrCreateRole(
                RoleType.ROLE_DESIGNER,
                "Creative Graphic Designer & Technical Checker",
                Set.of(
                        permMap.get("project:read:assigned"), permMap.get("design:upload"), permMap.get("design:technical_check")
                )
        ));

        roleMap.put(RoleType.ROLE_PRODUCTION, getOrCreateRole(
                RoleType.ROLE_PRODUCTION,
                "Print & Fabrication Specialist",
                Set.of(
                        permMap.get("project:read:assigned"), permMap.get("production:execute")
                )
        ));

        roleMap.put(RoleType.ROLE_QC, getOrCreateRole(
                RoleType.ROLE_QC,
                "Quality Assurance & Inspection Officer",
                Set.of(
                        permMap.get("project:read:assigned"), permMap.get("qc:evaluate")
                )
        ));

        roleMap.put(RoleType.ROLE_DISPATCH, getOrCreateRole(
                RoleType.ROLE_DISPATCH,
                "Logistics, Courier & Installation Specialist",
                Set.of(
                        permMap.get("project:read:assigned"), permMap.get("dispatch:manage"), permMap.get("installation:manage")
                )
        ));

        log.info("Production CRM system roles verified ({} total).", roleMap.size());
        return roleMap;
    }

    private Role getOrCreateRole(RoleType roleType, String description, Set<Permission> permissions) {
        return roleRepository.findByName(roleType)
                .orElseGet(() -> roleRepository.save(
                        Role.builder()
                                .name(roleType)
                                .description(description)
                                .permissions(permissions)
                                .build()
                ));
    }

    private void initializeProductionOwner(Role adminRole) {
        // Check if any admin user exists
        boolean adminExists = userRepository.findAll().stream()
                .anyMatch(u -> u.getRoles().stream().anyMatch(r -> r.getName() == RoleType.ROLE_ADMIN));

        if (adminExists) {
            log.info("Production environment verified: Administrator account already exists. No bootstrap required.");
            return;
        }

        String rawPassword;
        boolean generated = false;

        if (initialOwnerPassword != null && !initialOwnerPassword.trim().isEmpty()) {
            rawPassword = initialOwnerPassword.trim();
        } else {
            rawPassword = generateSecureRandomPassword(16);
            generated = true;
        }

        User owner = User.builder()
                .email(initialOwnerEmail.trim())
                .password(passwordEncoder.encode(rawPassword))
                .fullName(initialOwnerName)
                .phone(initialOwnerPhone)
                .department(DepartmentType.MANAGEMENT)
                .status(UserStatus.ACTIVE)
                .mustChangePassword(true)
                .roles(Set.of(adminRole))
                .build();

        userRepository.save(owner);

        if (generated) {
            log.info("\n" +
                    "================================================================================\n" +
                    "  ROHILLA ADVERTISING CRM — INITIAL PRODUCTION OWNER ACCOUNT CREATED            \n" +
                    "================================================================================\n" +
                    "  Email:       {}\n" +
                    "  Password:    {}\n" +
                    "  Status:      ACTIVE (Password change mandatory on first login)                 \n" +
                    "  IMPORTANT:   Copy these credentials immediately and log in to configure CRM.  \n" +
                    "               This password will NOT be logged or displayed again.             \n" +
                    "================================================================================",
                    owner.getEmail(), rawPassword);
        } else {
            log.info("Production Owner account [{}] initialized successfully with configured environment password (mustChangePassword=true).",
                    owner.getEmail());
        }
    }

    private String generateSecureRandomPassword(int length) {
        final String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
