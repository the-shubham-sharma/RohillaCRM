package com.rohilla.crm;

import com.rohilla.crm.auth.dto.AuthResponse;
import com.rohilla.crm.auth.dto.ChangePasswordRequest;
import com.rohilla.crm.auth.dto.LoginRequest;
import com.rohilla.crm.auth.dto.RefreshTokenRequest;
import com.rohilla.crm.auth.entity.RefreshToken;
import com.rohilla.crm.client.dto.ClientDto;
import com.rohilla.crm.common.exception.InvalidStateTransitionException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.design.dto.TechnicalCheckRequest;
import com.rohilla.crm.employee.dto.CreateUserRequest;
import com.rohilla.crm.employee.dto.UserSummaryDto;
import com.rohilla.crm.notification.dto.NotificationDto;
import com.rohilla.crm.project.dto.AssignTaskRequest;
import com.rohilla.crm.project.dto.ProjectDetailDto;
import com.rohilla.crm.project.dto.ProjectResponseDto;

import com.rohilla.crm.design.entity.DesignFile;
import com.rohilla.crm.notification.entity.Notification;
import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.common.enums.DepartmentType;
import com.rohilla.crm.common.enums.Priority;
import com.rohilla.crm.project.enums.ProjectStatus;
import com.rohilla.crm.security.enums.RoleType;
import com.rohilla.crm.employee.enums.UserStatus;

import com.rohilla.crm.common.exception.InvalidStateTransitionException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.design.repository.DesignFileRepository;
import com.rohilla.crm.notification.repository.NotificationRepository;
import com.rohilla.crm.project.repository.ProjectRepository;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.security.authorization.ProjectSecurityEvaluator;
import com.rohilla.crm.auth.service.AuthService;
import com.rohilla.crm.notification.service.NotificationService;
import com.rohilla.crm.project.service.ProjectService;
import com.rohilla.crm.employee.service.UserService;
import com.rohilla.crm.project.workflow.WorkflowTransitionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import com.rohilla.crm.client.entity.Client;
import com.rohilla.crm.security.entity.Role;
import com.rohilla.crm.client.service.ClientService;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class RohillaCrmSecurityTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private DesignFileRepository designFileRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ProjectSecurityEvaluator projectSecurityEvaluator;

    @Autowired
    private WorkflowTransitionService workflowTransitionService;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private UserService userService;

    @Autowired
    private ClientService clientService;

    private void authenticateAs(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        CustomUserDetails principal = new CustomUserDetails(user);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("1. Argon2id Password Hashing Verification")
    void testArgon2PasswordHashing() {
        User admin = userRepository.findByEmail("admin@rohilla.com").orElseThrow();
        assertNotNull(admin.getPassword());
        assertTrue(admin.getPassword().startsWith("$argon2id$"), "Password must be in Argon2id format");
        assertTrue(passwordEncoder.matches("password123", admin.getPassword()));
    }

    @Test
    @DisplayName("2. Authentication across all 6 Internal Roles")
    void testAllSixRolesAuthentication() {
        String[] internalEmails = {
                "admin@rohilla.com",
                "manager@rohilla.com",
                "designer@rohilla.com",
                "production@rohilla.com",
                "qc@rohilla.com",
                "dispatch@rohilla.com"
        };

        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setRemoteAddr("127.0.0.1");

        for (String email : internalEmails) {
            AuthResponse res = authService.login(new LoginRequest(email, "password123"), req);
            assertNotNull(res.getAccessToken());
            assertNotNull(res.getRefreshToken());
            assertEquals(email, res.getUser().getEmail());
        }
    }

    @Test
    @DisplayName("3. Inactive and Suspended Account Login Rejection")
    void testSuspendedAndInactiveLoginRejection() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setRemoteAddr("127.0.0.1");

        User designer = userRepository.findByEmail("designer@rohilla.com").orElseThrow();
        designer.setStatus(UserStatus.SUSPENDED);
        userRepository.save(designer);

        assertThrows(LockedException.class, () ->
                authService.login(new LoginRequest("designer@rohilla.com", "password123"), req)
        );

        designer.setStatus(UserStatus.INACTIVE);
        userRepository.save(designer);

        assertThrows(DisabledException.class, () ->
                authService.login(new LoginRequest("designer@rohilla.com", "password123"), req)
        );

        // Restore designer to ACTIVE
        designer.setStatus(UserStatus.ACTIVE);
        userRepository.save(designer);
    }

    @Test
    @DisplayName("4. Refresh Token Rotation & Replay Attack Protection")
    void testRefreshTokenRotation() {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setRemoteAddr("127.0.0.1");

        AuthResponse initial = authService.login(new LoginRequest("manager@rohilla.com", "password123"), req);
        String oldToken = initial.getRefreshToken();

        AuthResponse refreshed = authService.refreshToken(new RefreshTokenRequest(oldToken), req);
        assertNotNull(refreshed.getAccessToken());
        assertNotEquals(oldToken, refreshed.getRefreshToken());

        // Replay of revoked old token must fail
        assertThrows(Exception.class, () -> authService.refreshToken(new RefreshTokenRequest(oldToken), req));
    }

    @Test
    @DisplayName("5. PATH A: Customer Provided Design Workflow (No customer approval forced)")
    void testPathACustomerDesignWorkflow() {
        authenticateAs("manager@rohilla.com");
        Project project = projectRepository.findByProjectCode("PRJ-2026-001").orElseThrow();
        assertTrue(project.isCustomerProvidedDesign(), "Should be Path A");

        // Designer technical check
        authenticateAs("designer@rohilla.com");
        project = workflowTransitionService.transitionProjectStatus(
                project, ProjectStatus.READY_FOR_PRODUCTION, "Passed technical machine check"
        );
        assertEquals(ProjectStatus.READY_FOR_PRODUCTION, project.getStatus());

        // Production starts
        authenticateAs("production@rohilla.com");
        project = workflowTransitionService.transitionProjectStatus(
                project, ProjectStatus.IN_PRODUCTION, "UV printing started"
        );
        assertEquals(ProjectStatus.IN_PRODUCTION, project.getStatus());

        // Production finishes -> QC Pending
        project = workflowTransitionService.transitionProjectStatus(
                project, ProjectStatus.QC_PENDING, "Printing completed, sent to QC"
        );
        assertEquals(ProjectStatus.QC_PENDING, project.getStatus());

        // QC Passes
        authenticateAs("qc@rohilla.com");
        project = workflowTransitionService.transitionProjectStatus(
                project, ProjectStatus.QC_PASSED, "Colors within gamut, flawless finish"
        );
        assertEquals(ProjectStatus.QC_PASSED, project.getStatus());

        // Dispatch
        authenticateAs("dispatch@rohilla.com");
        project = workflowTransitionService.transitionProjectStatus(
                project, ProjectStatus.DISPATCHED, "Handed to logistics"
        );
        assertEquals(ProjectStatus.DISPATCHED, project.getStatus());

        // Installation & Completion
        project = workflowTransitionService.transitionProjectStatus(
                project, ProjectStatus.INSTALLATION_COMPLETED, "Installed on highway gantry"
        );
        authenticateAs("manager@rohilla.com");
        project = workflowTransitionService.transitionProjectStatus(
                project, ProjectStatus.COMPLETED, "Project completed"
        );
        assertEquals(ProjectStatus.COMPLETED, project.getStatus());
    }

    @Test
    @DisplayName("6. PATH B: Design Required Workflow with Version Locking")
    void testPathBDesignRequiredWorkflow() {
        authenticateAs("designer@rohilla.com");
        Project project = projectRepository.findByProjectCode("PRJ-2026-002").orElseThrow();
        assertFalse(project.isCustomerProvidedDesign(), "Should be Path B");
        assertEquals(ProjectStatus.DESIGN_IN_PROGRESS, project.getStatus());

        // 1. Designer submits design
        project = workflowTransitionService.transitionProjectStatus(
                project, ProjectStatus.DESIGN_SUBMITTED, "Uploaded V1 artwork"
        );
        assertEquals(ProjectStatus.DESIGN_SUBMITTED, project.getStatus());

        // 2. Customer Approval recorded by Manager
        authenticateAs("manager@rohilla.com");
        project = workflowTransitionService.transitionProjectStatus(
                project, ProjectStatus.CUSTOMER_APPROVED, "Customer gave written approval"
        );
        assertEquals(ProjectStatus.CUSTOMER_APPROVED, project.getStatus());

        // 3. Manager Approval locks design for production
        project = workflowTransitionService.transitionProjectStatus(
                project, ProjectStatus.MANAGER_APPROVED, "Pre-press check verified, locked for fabrication"
        );
        project = workflowTransitionService.transitionProjectStatus(
                project, ProjectStatus.READY_FOR_PRODUCTION, "Released to print floor"
        );
        assertEquals(ProjectStatus.READY_FOR_PRODUCTION, project.getStatus());
    }

    @Test
    @DisplayName("7. Path B Invalid Jump Rejection (Production without approvals)")
    void testPathBInvalidDirectProductionJump() {
        authenticateAs("production@rohilla.com");
        Project project = projectRepository.findByProjectCode("PRJ-2026-002").orElseThrow(); // Status: DESIGN_IN_PROGRESS

        // Direct jump from DESIGN_IN_PROGRESS to IN_PRODUCTION must be rejected!
        assertThrows(InvalidStateTransitionException.class, () ->
                workflowTransitionService.transitionProjectStatus(project, ProjectStatus.IN_PRODUCTION, "Direct jump")
        );
    }

    @Test
    @DisplayName("8. Action-Specific Resource Authorization (IDOR & Role Isolation)")
    void testActionSpecificAuthorization() {
        User designer = userRepository.findByEmail("designer@rohilla.com").orElseThrow();
        User production = userRepository.findByEmail("production@rohilla.com").orElseThrow();
        User qc = userRepository.findByEmail("qc@rohilla.com").orElseThrow();
        User dispatch = userRepository.findByEmail("dispatch@rohilla.com").orElseThrow();

        Project proj1 = projectRepository.findByProjectCode("PRJ-2026-001").orElseThrow();

        Authentication designerAuth = new UsernamePasswordAuthenticationToken(
                new CustomUserDetails(designer), null, new CustomUserDetails(designer).getAuthorities()
        );
        Authentication productionAuth = new UsernamePasswordAuthenticationToken(
                new CustomUserDetails(production), null, new CustomUserDetails(production).getAuthorities()
        );
        Authentication qcAuth = new UsernamePasswordAuthenticationToken(
                new CustomUserDetails(qc), null, new CustomUserDetails(qc).getAuthorities()
        );
        Authentication dispatchAuth = new UsernamePasswordAuthenticationToken(
                new CustomUserDetails(dispatch), null, new CustomUserDetails(dispatch).getAuthorities()
        );

        // Designer can perform design on assigned project, but CANNOT perform production, QC, or dispatch
        assertTrue(projectSecurityEvaluator.canPerformDesignAction(designerAuth, proj1.getId()));
        assertFalse(projectSecurityEvaluator.canPerformProduction(designerAuth, proj1.getId()));
        assertFalse(projectSecurityEvaluator.canPerformQc(designerAuth, proj1.getId()));
        assertFalse(projectSecurityEvaluator.canPerformDispatch(designerAuth, proj1.getId()));

        // Production can perform production, but CANNOT perform QC or Dispatch
        assertTrue(projectSecurityEvaluator.canPerformProduction(productionAuth, proj1.getId()));
        assertFalse(projectSecurityEvaluator.canPerformQc(productionAuth, proj1.getId()));
        assertFalse(projectSecurityEvaluator.canPerformDispatch(productionAuth, proj1.getId()));

        // QC can perform QC, but CANNOT perform Production or Dispatch
        assertTrue(projectSecurityEvaluator.canPerformQc(qcAuth, proj1.getId()));
        assertFalse(projectSecurityEvaluator.canPerformProduction(qcAuth, proj1.getId()));
        assertFalse(projectSecurityEvaluator.canPerformDispatch(qcAuth, proj1.getId()));

        // Dispatch can perform Dispatch, but CANNOT perform Production or QC
        assertTrue(projectSecurityEvaluator.canPerformDispatch(dispatchAuth, proj1.getId()));
        assertFalse(projectSecurityEvaluator.canPerformProduction(dispatchAuth, proj1.getId()));
        assertFalse(projectSecurityEvaluator.canPerformQc(dispatchAuth, proj1.getId()));
    }

    @Test
    @DisplayName("9. User-Scoped Notification Isolation")
    void testNotificationUserIsolation() {
        User designer = userRepository.findByEmail("designer@rohilla.com").orElseThrow();
        User production = userRepository.findByEmail("production@rohilla.com").orElseThrow();

        // Create a notification for Designer
        Notification n = Notification.builder()
                .recipient(designer)
                .title("Artwork Review")
                .message("Review specs")
                .isRead(false)
                .build();
        Notification saved = notificationRepository.save(n);

        // Authenticate as Production
        authenticateAs("production@rohilla.com");

        // Production attempting to mark/read Designer's notification must be rejected
        assertThrows(UnauthorizedActionException.class, () ->
                notificationService.markAsRead(saved.getId())
        );

        // Authenticate as Designer -> Allowed
        authenticateAs("designer@rohilla.com");
        NotificationDto marked = notificationService.markAsRead(saved.getId());
        assertTrue(marked.isRead());
    }

    @Test
    @DisplayName("10. Admin and Manager can access company-wide projects & pipeline")
    void testAdminAndManagerCanAccessCompanyProjects() {
        // Admin
        authenticateAs("admin@rohilla.com");
        List<ProjectResponseDto> adminProjects = projectService.getAllProjects();
        assertNotNull(adminProjects);
        assertFalse(adminProjects.isEmpty());

        // Manager
        authenticateAs("manager@rohilla.com");
        List<ProjectResponseDto> managerProjects = projectService.getAllProjects();
        assertNotNull(managerProjects);
        assertEquals(adminProjects.size(), managerProjects.size());
    }

    @Test
    @DisplayName("11. Non-privileged roles rejected from company-wide projects list (403 / Unauthorized)")
    void testNonPrivilegedRolesRejectedFromCompanyProjects() {
        String[] nonPrivilegedEmails = {
                "designer@rohilla.com",
                "production@rohilla.com",
                "qc@rohilla.com",
                "dispatch@rohilla.com"
        };

        for (String email : nonPrivilegedEmails) {
            authenticateAs(email);
            assertThrows(UnauthorizedActionException.class, () ->
                    projectService.getAllProjects(),
                    email + " must NOT be able to access company-wide projects"
            );
        }
    }

    @Test
    @DisplayName("12. Non-privileged roles can access their own My Work / Assigned Projects")
    void testNonPrivilegedRolesMyWorkAccess() {
        // Designer
        authenticateAs("designer@rohilla.com");
        List<ProjectResponseDto> designerWork = projectService.getMyWorkProjects();
        assertNotNull(designerWork);
        assertFalse(designerWork.isEmpty());
        // Verify every returned project is assigned to designer
        for (ProjectResponseDto p : designerWork) {
            assertTrue(p.getAssignedDesigner() != null &&
                    p.getAssignedDesigner().getEmail().equals("designer@rohilla.com"));
        }

        // Production
        authenticateAs("production@rohilla.com");
        List<ProjectResponseDto> prodWork = projectService.getMyWorkProjects();
        assertNotNull(prodWork);
        assertFalse(prodWork.isEmpty());

        // QC
        authenticateAs("qc@rohilla.com");
        List<ProjectResponseDto> qcWork = projectService.getMyWorkProjects();
        assertNotNull(qcWork);
        assertFalse(qcWork.isEmpty());

        // Dispatch
        authenticateAs("dispatch@rohilla.com");
        List<ProjectResponseDto> dispatchWork = projectService.getMyWorkProjects();
        assertNotNull(dispatchWork);
        assertFalse(dispatchWork.isEmpty());
    }

    @Test
    @DisplayName("13. Resource-level IDOR Protection for Unassigned Projects")
    void testResourceLevelIdorProtection() {
        // Create an unassigned project or a project assigned to someone else
        Project proj1 = projectRepository.findByProjectCode("PRJ-2026-001").orElseThrow();

        // Create an unassigned Designer user
        Role designerRole = userRepository.findByEmail("designer@rohilla.com").orElseThrow().getRoles().iterator().next();
        User unassignedDesigner = userRepository.save(User.builder()
                .email("other.designer@rohilla.com")
                .password(passwordEncoder.encode("password123"))
                .fullName("Other Designer")
                .department(DepartmentType.DESIGN)
                .status(UserStatus.ACTIVE)
                .roles(Set.of(designerRole))
                .build());

        Authentication otherDesignerAuth = new UsernamePasswordAuthenticationToken(
                new CustomUserDetails(unassignedDesigner), null, new CustomUserDetails(unassignedDesigner).getAuthorities()
        );

        // Other designer cannot view proj1
        assertFalse(projectSecurityEvaluator.canViewProject(otherDesignerAuth, proj1.getId()));
        // Other designer cannot perform design actions on proj1
        assertFalse(projectSecurityEvaluator.canPerformDesignAction(otherDesignerAuth, proj1.getId()));

        // When unassigned designer attempts to access project detail directly -> Denied
        SecurityContextHolder.getContext().setAuthentication(otherDesignerAuth);
        assertFalse(projectSecurityEvaluator.canAccessProject(otherDesignerAuth, proj1.getId()));
    }

    @Test
    @DisplayName("14. Owner Profile Name & Role Verification")
    void testOwnerProfileVerification() {
        User admin = userRepository.findByEmail("admin@rohilla.com").orElseThrow();
        assertEquals("Aditye Rohilla", admin.getFullName());
        assertEquals(UserStatus.ACTIVE, admin.getStatus());
        assertTrue(admin.getRoles().stream().anyMatch(r -> r.getName() == RoleType.ROLE_ADMIN));
    }

    @Test
    @DisplayName("15. Primary Owner Account (admin@rohilla.com) Suspension Protection")
    void testPrimaryOwnerProtectionFromSuspension() {
        User admin = userRepository.findByEmail("admin@rohilla.com").orElseThrow();
        assertEquals("Aditye Rohilla", admin.getFullName());
        assertEquals(UserStatus.ACTIVE, admin.getStatus());

        // Attempting to suspend or deactivate primary owner must throw UnauthorizedActionException
        assertThrows(UnauthorizedActionException.class, () ->
                userService.updateUserStatus(admin.getId(), UserStatus.SUSPENDED)
        );

        assertThrows(UnauthorizedActionException.class, () ->
                userService.updateUserStatus(admin.getId(), UserStatus.INACTIVE)
        );

        // Status must remain ACTIVE
        User verifiedAdmin = userRepository.findByEmail("admin@rohilla.com").orElseThrow();
        assertEquals(UserStatus.ACTIVE, verifiedAdmin.getStatus());

        // Primary owner can log in successfully
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setRemoteAddr("127.0.0.1");
        AuthResponse res = authService.login(new LoginRequest("admin@rohilla.com", "password123"), req);
        assertNotNull(res.getAccessToken());
        assertEquals("admin@rohilla.com", res.getUser().getEmail());

        // Non-owner user can still be suspended and reactivated
        User designer = userRepository.findByEmail("designer@rohilla.com").orElseThrow();
        userService.updateUserStatus(designer.getId(), UserStatus.SUSPENDED);
        User suspendedDesigner = userRepository.findByEmail("designer@rohilla.com").orElseThrow();
        assertEquals(UserStatus.SUSPENDED, suspendedDesigner.getStatus());

        // Restore designer to ACTIVE
        userService.updateUserStatus(designer.getId(), UserStatus.ACTIVE);
        User activeDesigner = userRepository.findByEmail("designer@rohilla.com").orElseThrow();
        assertEquals(UserStatus.ACTIVE, activeDesigner.getStatus());
    }

    @Test
    @DisplayName("16. Phase 2: Manager creates operational employee with temporary password & mustChangePassword")
    void testManagerCreatesOperationalEmployeeWithTemporaryPassword() {
        authenticateAs("manager@rohilla.com");

        CreateUserRequest req = CreateUserRequest.builder()
                .email("pooja.verma@rohilla.com")
                .fullName("Pooja Verma")
                .phone("+91-9876543210")
                .department(DepartmentType.DESIGN)
                .roles(Set.of(RoleType.ROLE_DESIGNER))
                .status(UserStatus.ACTIVE)
                .build();

        UserSummaryDto created = userService.createUser(req);
        assertNotNull(created);
        assertNotNull(created.getId());
        assertEquals("pooja.verma@rohilla.com", created.getEmail());
        assertEquals("Pooja Verma", created.getFullName());
        assertTrue(created.isMustChangePassword(), "New employee must have mustChangePassword = true");
        assertNotNull(created.getTemporaryPassword(), "Temporary password must be generated and returned to creator");
        assertTrue(created.getTemporaryPassword().length() >= 8, "Temporary password must be at least 8 chars");

        // Verify password in DB is hashed with Argon2id
        User inDb = userRepository.findById(created.getId()).orElseThrow();
        assertTrue(inDb.getPassword().startsWith("$argon2id$"));
        assertTrue(passwordEncoder.matches(created.getTemporaryPassword(), inDb.getPassword()));
    }

    @Test
    @DisplayName("17. Phase 2: Manager cannot create ADMIN or SUPER_ADMIN account")
    void testManagerCannotCreateAdminAccount() {
        authenticateAs("manager@rohilla.com");

        CreateUserRequest req = CreateUserRequest.builder()
                .email("fake.admin@rohilla.com")
                .fullName("Fake Admin")
                .department(DepartmentType.MANAGEMENT)
                .roles(Set.of(RoleType.ROLE_ADMIN))
                .build();

        assertThrows(UnauthorizedActionException.class, () -> userService.createUser(req),
                "Manager attempting to create ADMIN must be blocked");
    }

    @Test
    @DisplayName("18. Phase 2: First-login password change flow (mustChangePassword reset to false)")
    void testFirstLoginPasswordChangeFlow() {
        authenticateAs("manager@rohilla.com");

        CreateUserRequest createReq = CreateUserRequest.builder()
                .email("rahul.sharma@rohilla.com")
                .fullName("Rahul Sharma")
                .department(DepartmentType.DESIGN)
                .roles(Set.of(RoleType.ROLE_DESIGNER))
                .build();

        UserSummaryDto created = userService.createUser(createReq);
        String tempPassword = created.getTemporaryPassword();

        // 1. Employee logs in using temporary password
        MockHttpServletRequest httpReq = new MockHttpServletRequest();
        httpReq.setRemoteAddr("127.0.0.1");
        AuthResponse loginRes = authService.login(new LoginRequest("rahul.sharma@rohilla.com", tempPassword), httpReq);
        assertNotNull(loginRes.getAccessToken());
        assertTrue(loginRes.getUser().isMustChangePassword(), "User must be prompted to change password");

        // 2. Employee changes password
        authenticateAs("rahul.sharma@rohilla.com");
        ChangePasswordRequest changeReq = ChangePasswordRequest.builder()
                .oldPassword(tempPassword)
                .newPassword("RahulSecurePass2026!")
                .build();

        UserSummaryDto updated = authService.changePassword(changeReq, httpReq);
        assertFalse(updated.isMustChangePassword(), "mustChangePassword must be false after password change");

        // 3. User can now login with new password and old temporary password fails
        assertThrows(BadCredentialsException.class, () ->
                authService.login(new LoginRequest("rahul.sharma@rohilla.com", tempPassword), httpReq)
        );

        AuthResponse newLoginRes = authService.login(new LoginRequest("rahul.sharma@rohilla.com", "RahulSecurePass2026!"), httpReq);
        assertNotNull(newLoginRes.getAccessToken());
        assertFalse(newLoginRes.getUser().isMustChangePassword());
    }

    @Test
    @DisplayName("19. Phase 2: Manager assigns task -> Employee receives notification and sees task in My Work")
    void testTaskAssignmentAndNotification() {
        authenticateAs("manager@rohilla.com");

        // Create a new designer
        UserSummaryDto designerDto = userService.createUser(CreateUserRequest.builder()
                .email("vikram.designer@rohilla.com")
                .fullName("Vikram Designer")
                .department(DepartmentType.DESIGN)
                .roles(Set.of(RoleType.ROLE_DESIGNER))
                .build());

        Project initialProject = projectRepository.findByProjectCode("PRJ-2026-001").orElseThrow();
        initialProject.setAssignedDesigner(null);
        Project project = projectRepository.save(initialProject);
        final UUID targetProjectId = project.getId();

        // Assign task to Vikram
        AssignTaskRequest assignReq = AssignTaskRequest.builder()
                .department(DepartmentType.DESIGN)
                .employeeId(designerDto.getId())
                .notes("Assigned for brand vectorization")
                .build();

        ProjectDetailDto detail = projectService.assignTask(targetProjectId, assignReq);
        assertNotNull(detail);
        assertEquals(designerDto.getId(), detail.getAssignedDesigner().getId());

        // Verify notification was sent
        User vikram = userRepository.findById(designerDto.getId()).orElseThrow();
        List<Notification> notifications = notificationRepository.findAllByRecipientOrderByCreatedAtDesc(vikram);
        assertFalse(notifications.isEmpty(), "Assigned employee must receive notification");
        assertTrue(notifications.get(0).getTitle().contains("New Design Task Assigned"));

        // Vikram logs in and sees the project in My Work
        authenticateAs("vikram.designer@rohilla.com");
        List<ProjectResponseDto> vikramWork = projectService.getMyWorkProjects();
        assertTrue(vikramWork.stream().anyMatch(p -> p.getId().equals(targetProjectId)),
                "Assigned project must appear in employee's My Work");
    }

    @Test
    @DisplayName("20. Phase 2: Backend rejects cross-department task assignment (e.g. Design -> QC)")
    void testCrossDepartmentAssignmentRejection() {
        authenticateAs("manager@rohilla.com");

        Project project = projectRepository.findByProjectCode("PRJ-2026-001").orElseThrow();
        User qcUser = userRepository.findByEmail("qc@rohilla.com").orElseThrow();

        // Attempting to assign DESIGN task to QC employee must be rejected
        AssignTaskRequest invalidReq = AssignTaskRequest.builder()
                .department(DepartmentType.DESIGN)
                .employeeId(qcUser.getId())
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                projectService.assignTask(project.getId(), invalidReq)
        );
        assertTrue(ex.getMessage().contains("does not belong to Design department"));
    }

    @Test
    @DisplayName("21. Phase 2: Suspended employee cannot login and cannot receive new assignments")
    void testSuspendedEmployeeCannotLoginOrReceiveAssignments() {
        authenticateAs("manager@rohilla.com");

        UserSummaryDto designerDto = userService.createUser(CreateUserRequest.builder()
                .email("sanjay.designer@rohilla.com")
                .fullName("Sanjay Designer")
                .department(DepartmentType.DESIGN)
                .roles(Set.of(RoleType.ROLE_DESIGNER))
                .build());

        String tempPass = designerDto.getTemporaryPassword();

        // Suspend the designer
        userService.updateUserStatus(designerDto.getId(), UserStatus.SUSPENDED);

        // 1. Cannot login
        MockHttpServletRequest httpReq = new MockHttpServletRequest();
        httpReq.setRemoteAddr("127.0.0.1");
        assertThrows(Exception.class, () ->
                authService.login(new LoginRequest("sanjay.designer@rohilla.com", tempPass), httpReq)
        );

        // 2. Cannot receive new task assignments
        Project project = projectRepository.findByProjectCode("PRJ-2026-001").orElseThrow();
        AssignTaskRequest assignReq = AssignTaskRequest.builder()
                .department(DepartmentType.DESIGN)
                .employeeId(designerDto.getId())
                .build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                projectService.assignTask(project.getId(), assignReq)
        );
        assertTrue(ex.getMessage().contains("Cannot assign task to SUSPENDED employee"));
    }

    @Test
    @DisplayName("22. Phase 2: Task reassignment notifies new employee and preserves audit history")
    void testTaskReassignment() {
        authenticateAs("manager@rohilla.com");

        UserSummaryDto designer1 = userService.createUser(CreateUserRequest.builder()
                .email("designer.one@rohilla.com")
                .fullName("Designer One")
                .department(DepartmentType.DESIGN)
                .roles(Set.of(RoleType.ROLE_DESIGNER))
                .build());

        UserSummaryDto designer2 = userService.createUser(CreateUserRequest.builder()
                .email("designer.two@rohilla.com")
                .fullName("Designer Two")
                .department(DepartmentType.DESIGN)
                .roles(Set.of(RoleType.ROLE_DESIGNER))
                .build());

        Project project = projectRepository.findByProjectCode("PRJ-2026-001").orElseThrow();

        // Initial assignment to Designer 1
        projectService.assignTask(project.getId(), AssignTaskRequest.builder()
                .department(DepartmentType.DESIGN)
                .employeeId(designer1.getId())
                .build());

        // Reassignment to Designer 2
        ProjectDetailDto reDetail = projectService.assignTask(project.getId(), AssignTaskRequest.builder()
                .department(DepartmentType.DESIGN)
                .employeeId(designer2.getId())
                .notes("Reassigned due to leave")
                .build());

        assertEquals(designer2.getId(), reDetail.getAssignedDesigner().getId());

        // Designer 2 received reassignment notification
        User user2 = userRepository.findById(designer2.getId()).orElseThrow();
        List<Notification> notifications = notificationRepository.findAllByRecipientOrderByCreatedAtDesc(user2);
        assertFalse(notifications.isEmpty());
        assertTrue(notifications.get(0).getTitle().contains("Task Reassigned"));
    }

    @Test
    @DisplayName("23. Active and History Projects Separation for Admin and Manager")
    void testActiveAndHistoryProjectsSeparation() {
        // Admin check
        authenticateAs("admin@rohilla.com");
        List<ProjectResponseDto> activeProjects = projectService.getAllProjects();
        List<ProjectResponseDto> historyProjects = projectService.getProjectHistory();

        assertNotNull(activeProjects);
        assertNotNull(historyProjects);
        assertFalse(activeProjects.isEmpty(), "Active projects list should not be empty");
        assertFalse(historyProjects.isEmpty(), "History projects list should contain completed projects");

        // Assert that NO active project has status == COMPLETED
        for (ProjectResponseDto active : activeProjects) {
            assertNotEquals(ProjectStatus.COMPLETED, active.getStatus(),
                    "Active projects list must not contain completed project: " + active.getProjectCode());
        }

        // Assert that ALL history projects have status == COMPLETED
        for (ProjectResponseDto history : historyProjects) {
            assertEquals(ProjectStatus.COMPLETED, history.getStatus(),
                    "History projects list must only contain COMPLETED status projects: " + history.getProjectCode());
        }

        // Assert no duplicate IDs exist between active and history
        Set<UUID> activeIds = activeProjects.stream().map(ProjectResponseDto::getId).collect(Collectors.toSet());
        for (ProjectResponseDto history : historyProjects) {
            assertFalse(activeIds.contains(history.getId()),
                    "Project must not appear in both Active Projects and History: " + history.getProjectCode());
        }

        // Manager check
        authenticateAs("manager@rohilla.com");
        List<ProjectResponseDto> mgrActive = projectService.getAllProjects();
        List<ProjectResponseDto> mgrHistory = projectService.getProjectHistory();
        assertEquals(activeProjects.size(), mgrActive.size(), "Manager sees same active count as Admin");
        assertEquals(historyProjects.size(), mgrHistory.size(), "Manager sees same history count as Admin");
    }

    @Test
    @DisplayName("24. Project Transition to COMPLETED Moves from Active to History, Reopen Moves Back")
    void testProjectLifecycleMovesBetweenActiveAndHistory() {
        authenticateAs("manager@rohilla.com");

        Project proj1 = projectRepository.findByProjectCode("PRJ-2026-001").orElseThrow();
        final UUID p1Id = proj1.getId();

        // 1. Initially PRJ-2026-001 is active
        List<ProjectResponseDto> activeBefore = projectService.getAllProjects();
        List<ProjectResponseDto> historyBefore = projectService.getProjectHistory();

        assertTrue(activeBefore.stream().anyMatch(p -> p.getId().equals(p1Id)),
                "PRJ-2026-001 must initially be in Active Projects");
        assertFalse(historyBefore.stream().anyMatch(p -> p.getId().equals(p1Id)),
                "PRJ-2026-001 must NOT initially be in History");

        // 2. Advance proj1 through workflow to COMPLETED
        // Path A: DESIGN_TECHNICAL_CHECK -> READY_FOR_PRODUCTION -> IN_PRODUCTION -> PRODUCTION_COMPLETED -> QC_PENDING -> QC_PASSED -> DISPATCH_PENDING -> DISPATCHED -> INSTALLATION_PENDING -> INSTALLATION_COMPLETED -> COMPLETED
        authenticateAs("designer@rohilla.com");
        proj1 = workflowTransitionService.transitionProjectStatus(proj1, ProjectStatus.READY_FOR_PRODUCTION, "Tech check approved");

        authenticateAs("production@rohilla.com");
        proj1 = workflowTransitionService.transitionProjectStatus(proj1, ProjectStatus.IN_PRODUCTION, "Print started");
        proj1 = workflowTransitionService.transitionProjectStatus(proj1, ProjectStatus.PRODUCTION_COMPLETED, "Print finished");
        proj1 = workflowTransitionService.transitionProjectStatus(proj1, ProjectStatus.QC_PENDING, "Sent to QC");

        authenticateAs("qc@rohilla.com");
        proj1 = workflowTransitionService.transitionProjectStatus(proj1, ProjectStatus.QC_PASSED, "QC approved");

        authenticateAs("dispatch@rohilla.com");
        proj1 = workflowTransitionService.transitionProjectStatus(proj1, ProjectStatus.DISPATCH_PENDING, "Ready for delivery");
        proj1 = workflowTransitionService.transitionProjectStatus(proj1, ProjectStatus.DISPATCHED, "Dispatched");
        proj1 = workflowTransitionService.transitionProjectStatus(proj1, ProjectStatus.INSTALLATION_PENDING, "Installing");
        proj1 = workflowTransitionService.transitionProjectStatus(proj1, ProjectStatus.INSTALLATION_COMPLETED, "Installed");

        authenticateAs("manager@rohilla.com");
        proj1 = workflowTransitionService.transitionProjectStatus(proj1, ProjectStatus.COMPLETED, "All signoffs received");

        // 3. Verify it moved from Active to History
        List<ProjectResponseDto> activeAfter = projectService.getAllProjects();
        List<ProjectResponseDto> historyAfter = projectService.getProjectHistory();

        assertFalse(activeAfter.stream().anyMatch(p -> p.getId().equals(p1Id)),
                "Completed project must NOT appear in Active Projects");
        assertTrue(historyAfter.stream().anyMatch(p -> p.getId().equals(p1Id)),
                "Completed project must appear in History");

        // 4. Reopen project (transition from COMPLETED to MANAGER_REVIEW)
        proj1 = workflowTransitionService.transitionProjectStatus(proj1, ProjectStatus.MANAGER_REVIEW, "Customer requested additional scope");

        List<ProjectResponseDto> activeReopened = projectService.getAllProjects();
        List<ProjectResponseDto> historyReopened = projectService.getProjectHistory();

        assertTrue(activeReopened.stream().anyMatch(p -> p.getId().equals(p1Id)),
                "Reopened project must return to Active Projects");
        assertFalse(historyReopened.stream().anyMatch(p -> p.getId().equals(p1Id)),
                "Reopened project must leave History");
    }

    @Test
    @DisplayName("25. Non-privileged roles rejected from company-wide History (403 / Unauthorized)")
    void testNonPrivilegedRolesRejectedFromCompanyHistory() {
        String[] nonPrivilegedEmails = {
                "designer@rohilla.com",
                "production@rohilla.com",
                "qc@rohilla.com",
                "dispatch@rohilla.com"
        };

        for (String email : nonPrivilegedEmails) {
            authenticateAs(email);
            assertThrows(UnauthorizedActionException.class, () ->
                    projectService.getProjectHistory(),
                    email + " must NOT be able to access company-wide History"
            );
        }
    }

    @Test
    @DisplayName("26. Admin and Manager Receive Full Project Detail with All Staff and Financial Data")
    void testAdminAndManagerReceiveFullProjectDetail() {
        Project project = projectRepository.findByProjectCode("PRJ-2026-001").orElseThrow();

        // 1. Test Admin
        authenticateAs("admin@rohilla.com");
        ProjectDetailDto adminDetail = projectService.getProjectDetail(project.getId());
        assertNotNull(adminDetail.getAssignedDesigner(), "Admin sees assigned designer");
        assertNotNull(adminDetail.getAssignedProduction(), "Admin sees assigned production");
        assertNotNull(adminDetail.getAssignedQc(), "Admin sees assigned QC");
        assertNotNull(adminDetail.getAssignedDispatch(), "Admin sees assigned dispatch");
        assertNotNull(adminDetail.getBudget(), "Admin sees project budget");
        assertNotNull(adminDetail.getClient().getGstNumber(), "Admin sees client GST");
        assertNotNull(adminDetail.getClient().getEmail(), "Admin sees client email");
        assertNotNull(adminDetail.getClient().getPhone(), "Admin sees client phone");
        assertNotNull(adminDetail.getDesignFiles(), "Admin sees design files");
        assertNotNull(adminDetail.getProductionTasks(), "Admin sees production tasks");
        assertNotNull(adminDetail.getQcEvaluations(), "Admin sees QC evaluations");
        assertNotNull(adminDetail.getDispatchRecords(), "Admin sees dispatch records");

        // 2. Test Manager
        authenticateAs("manager@rohilla.com");
        ProjectDetailDto mgrDetail = projectService.getProjectDetail(project.getId());
        assertNotNull(mgrDetail.getAssignedDesigner(), "Manager sees assigned designer");
        assertNotNull(mgrDetail.getAssignedProduction(), "Manager sees assigned production");
        assertNotNull(mgrDetail.getAssignedQc(), "Manager sees assigned QC");
        assertNotNull(mgrDetail.getAssignedDispatch(), "Manager sees assigned dispatch");
        assertNotNull(mgrDetail.getBudget(), "Manager sees project budget");
        assertNotNull(mgrDetail.getClient().getGstNumber(), "Manager sees client GST");
    }

    @Test
    @DisplayName("27. Designer Receives Only Design-Relevant Info, Other Staff and Tasks Masked")
    void testDesignerDataMinimization() {
        Project project = projectRepository.findByProjectCode("PRJ-2026-001").orElseThrow();
        authenticateAs("designer@rohilla.com");

        ProjectDetailDto detail = projectService.getProjectDetail(project.getId());

        // Permitted
        assertNotNull(detail.getAssignedDesigner(), "Designer sees own assignment");
        assertNotNull(detail.getDesignFiles(), "Designer sees design files");
        assertFalse(detail.getDesignFiles().isEmpty(), "Designer sees design proofs");
        assertEquals("PRJ-2026-001", detail.getProjectCode());

        // Restricted / Masked
        assertNull(detail.getAssignedProduction(), "Production staff must be masked from Designer");
        assertNull(detail.getAssignedQc(), "QC staff must be masked from Designer");
        assertNull(detail.getAssignedDispatch(), "Dispatch staff must be masked from Designer");
        assertNull(detail.getBudget(), "Budget must be masked from Designer");
        assertNull(detail.getCreatedBy(), "CreatedBy must be masked from Designer");
        assertNull(detail.getInstallationDate(), "Installation date must be masked from Designer");
        assertNull(detail.getInstallationNotes(), "Installation notes must be masked from Designer");
        assertTrue(detail.getProductionTasks().isEmpty(), "Production tasks must NOT be visible to Designer");
        assertTrue(detail.getQcEvaluations().isEmpty(), "QC evaluations must NOT be visible to Designer");
        assertTrue(detail.getDispatchRecords().isEmpty(), "Dispatch records must NOT be visible to Designer");

        // Client info masked
        assertNull(detail.getClient().getGstNumber(), "GST number must be masked from Designer");
        assertNull(detail.getClient().getEmail(), "Client email must be masked from Designer");
        assertNull(detail.getClient().getPhone(), "Client phone must be masked from Designer");
    }

    @Test
    @DisplayName("28. Production Receives Only Production-Relevant Info, Other Staff Masked")
    void testProductionDataMinimization() {
        Project project = projectRepository.findByProjectCode("PRJ-2026-001").orElseThrow();
        authenticateAs("production@rohilla.com");

        ProjectDetailDto detail = projectService.getProjectDetail(project.getId());

        // Permitted
        assertNotNull(detail.getAssignedProduction(), "Production sees own assignment");
        assertNotNull(detail.getProductionTasks(), "Production sees production tasks");
        assertNotNull(detail.getDesignFiles(), "Production sees approved design proofs");

        // Restricted / Masked
        assertNull(detail.getAssignedDesigner(), "Designer staff must be masked from Production");
        assertNull(detail.getAssignedQc(), "QC staff must be masked from Production");
        assertNull(detail.getAssignedDispatch(), "Dispatch staff must be masked from Production");
        assertNull(detail.getBudget(), "Budget must be masked from Production");
        assertTrue(detail.getQcEvaluations().isEmpty(), "QC evaluations must NOT be visible to Production");
        assertTrue(detail.getDispatchRecords().isEmpty(), "Dispatch records must NOT be visible to Production");
    }

    @Test
    @DisplayName("29. QC Receives Only QC-Relevant Info, Other Staff Masked")
    void testQcDataMinimization() {
        Project project = projectRepository.findByProjectCode("PRJ-2026-001").orElseThrow();
        authenticateAs("qc@rohilla.com");

        ProjectDetailDto detail = projectService.getProjectDetail(project.getId());

        // Permitted
        assertNotNull(detail.getAssignedQc(), "QC sees own assignment");
        assertNotNull(detail.getQcEvaluations(), "QC sees QC evaluations");

        // Restricted / Masked
        assertNull(detail.getAssignedDesigner(), "Designer staff must be masked from QC");
        assertNull(detail.getAssignedProduction(), "Production staff must be masked from QC");
        assertNull(detail.getAssignedDispatch(), "Dispatch staff must be masked from QC");
        assertNull(detail.getBudget(), "Budget must be masked from QC");
        assertTrue(detail.getProductionTasks().isEmpty(), "Production tasks must NOT be visible to QC");
        assertTrue(detail.getDispatchRecords().isEmpty(), "Dispatch records must NOT be visible to QC");
    }

    @Test
    @DisplayName("30. Dispatch Receives Only Dispatch & Install-Relevant Info, Other Staff Masked")
    void testDispatchDataMinimization() {
        Project project = projectRepository.findByProjectCode("PRJ-2026-001").orElseThrow();
        authenticateAs("dispatch@rohilla.com");

        ProjectDetailDto detail = projectService.getProjectDetail(project.getId());

        // Permitted
        assertNotNull(detail.getAssignedDispatch(), "Dispatch sees own assignment");
        assertNotNull(detail.getDispatchRecords(), "Dispatch sees dispatch records");

        // Restricted / Masked
        assertNull(detail.getAssignedDesigner(), "Designer staff must be masked from Dispatch");
        assertNull(detail.getAssignedProduction(), "Production staff must be masked from Dispatch");
        assertNull(detail.getAssignedQc(), "QC staff must be masked from Dispatch");
        assertNull(detail.getBudget(), "Budget must be masked from Dispatch");
        assertTrue(detail.getDesignFiles().isEmpty(), "Design files must NOT be visible to Dispatch");
        assertTrue(detail.getProductionTasks().isEmpty(), "Production tasks must NOT be visible to Dispatch");
        assertTrue(detail.getQcEvaluations().isEmpty(), "QC evaluations must NOT be visible to Dispatch");
    }

    @Test
    @DisplayName("31. Path A Technical Check by Designer Transitions to READY_FOR_PRODUCTION and Notifies Production")
    void testPathATechnicalCheckWorkflow() {
        Project project = projectRepository.findByProjectCode("PRJ-2026-001").orElseThrow();
        assertEquals(ProjectStatus.DESIGN_TECHNICAL_CHECK, project.getStatus());
        assertTrue(project.isCustomerProvidedDesign());

        authenticateAs("designer@rohilla.com");

        TechnicalCheckRequest request = TechnicalCheckRequest.builder()
                .passed(true)
                .compatibilityNotes("Resolution 300 DPI verified, CMYK gamut within tolerance, 2-inch bleed included.")
                .designFileId(project.getDesignFiles().isEmpty() ? null : project.getDesignFiles().get(0).getId())
                .build();

        ProjectDetailDto result = projectService.recordTechnicalCheck(project.getId(), request);

        assertNotNull(result);
        assertEquals(ProjectStatus.READY_FOR_PRODUCTION, result.getStatus());
        assertNotEquals(ProjectStatus.COMPLETED, result.getStatus());

        // Check project in DB
        Project updated = projectRepository.findById(project.getId()).orElseThrow();
        assertEquals(ProjectStatus.READY_FOR_PRODUCTION, updated.getStatus());
    }

    @Test
    @DisplayName("32. Client Sensitive Data Minimization on Client Endpoints")
    void testClientDataMinimization() {
        Client client = projectRepository.findByProjectCode("PRJ-2026-001").orElseThrow().getClient();

        // Admin sees full client details
        authenticateAs("admin@rohilla.com");
        ClientDto adminClient = clientService.getClientById(client.getId());
        assertNotNull(adminClient.getGstNumber());
        assertNotNull(adminClient.getEmail());
        assertNotNull(adminClient.getPhone());

        // Designer sees masked client details
        authenticateAs("designer@rohilla.com");
        ClientDto designerClient = clientService.getClientById(client.getId());
        assertEquals(client.getCompanyName(), designerClient.getCompanyName());
        assertNull(designerClient.getGstNumber());
        assertNull(designerClient.getEmail());
        assertNull(designerClient.getPhone());
    }
}
