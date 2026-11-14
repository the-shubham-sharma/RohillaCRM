package com.rohilla.crm;

import com.rohilla.crm.client.entity.Client;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.project.dto.ProjectResponseDto;
import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.security.entity.Role;
import com.rohilla.crm.workspace.dto.DepartmentWorkspaceDto;
import com.rohilla.crm.workspace.dto.HistoryDto;
import com.rohilla.crm.workspace.dto.PerformanceMetricsDto;

import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.common.enums.DateRangeFilter;

import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.project.repository.ProjectRepository;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.workspace.service.DepartmentWorkspaceService;
import com.rohilla.crm.project.service.ProjectService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class RohillaCrmWorkspaceTests {

    @Autowired
    private DepartmentWorkspaceService workspaceService;

    @Autowired
    private ProjectService projectService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    private void authenticateAs(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        CustomUserDetails principal = new CustomUserDetails(user);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("1. Designer Workspace: Active, Waiting, and Recent Work Sections")
    void testDesignerWorkspaceSections() {
        authenticateAs("designer@rohilla.com");

        DepartmentWorkspaceDto workspace = workspaceService.getDesignerWorkspace();
        assertNotNull(workspace);
        assertNotNull(workspace.getActiveWork());
        assertNotNull(workspace.getWaitingWork());
        assertNotNull(workspace.getRecentWork());

        // Active work contains tasks requiring action
        assertFalse(workspace.getActiveWork().isEmpty(), "Designer should have active work");
        for (ProjectResponseDto p : workspace.getActiveWork()) {
            assertTrue(
                    p.getStatus().name().contains("DESIGN") || p.getStatus().name().contains("DRAFT") || p.getStatus().name().contains("REWORK") || p.getStatus().name().contains("MANAGER_REVIEW"),
                    "Active work must be in active design states"
            );
        }

        // Recent work contains downstream or approved tasks
        assertFalse(workspace.getRecentWork().isEmpty(), "Designer should have recent work history");
    }

    @Test
    @DisplayName("2. Production Workspace: Active, Waiting, and Recent Jobs")
    void testProductionWorkspaceSections() {
        authenticateAs("production@rohilla.com");

        DepartmentWorkspaceDto workspace = workspaceService.getProductionWorkspace();
        assertNotNull(workspace);
        assertNotNull(workspace.getActiveWork());
        assertNotNull(workspace.getWaitingWork());
        assertNotNull(workspace.getRecentWork());
    }

    @Test
    @DisplayName("3. QC Workspace: Active Inspections and Recent Evaluations")
    void testQcWorkspaceSections() {
        authenticateAs("qc@rohilla.com");

        DepartmentWorkspaceDto workspace = workspaceService.getQcWorkspace();
        assertNotNull(workspace);
        assertNotNull(workspace.getActiveWork());
        assertNotNull(workspace.getWaitingWork());
        assertNotNull(workspace.getRecentWork());
    }

    @Test
    @DisplayName("4. Dispatch Workspace: Active Logistics and Delivered Jobs")
    void testDispatchWorkspaceSections() {
        authenticateAs("dispatch@rohilla.com");

        DepartmentWorkspaceDto workspace = workspaceService.getDispatchWorkspace();
        assertNotNull(workspace);
        assertNotNull(workspace.getActiveWork());
        assertNotNull(workspace.getWaitingWork());
        assertNotNull(workspace.getRecentWork());
    }

    @Test
    @DisplayName("5. Designer Permanent History with Date Filter Support")
    void testDesignerHistoryAndFilters() {
        authenticateAs("designer@rohilla.com");

        List<HistoryDto.DesignerHistoryDto> monthHistory = workspaceService.getDesignerHistory(DateRangeFilter.THIS_MONTH, null, null);
        assertNotNull(monthHistory);
        assertFalse(monthHistory.isEmpty());

        for (HistoryDto.DesignerHistoryDto h : monthHistory) {
            assertNotNull(h.getProjectCode());
            assertNotNull(h.getTitle());
            assertNotNull(h.getTaskType());
            assertNotNull(h.getAssignedAt());
            assertTrue(h.getVersionCount() >= 0);
        }

        List<HistoryDto.DesignerHistoryDto> yearHistory = workspaceService.getDesignerHistory(DateRangeFilter.THIS_YEAR, null, null);
        assertNotNull(yearHistory);
        assertTrue(yearHistory.size() >= monthHistory.size());
    }

    @Test
    @DisplayName("6. Designer Performance Calculation from Real Timestamps")
    void testDesignerPerformanceCalculation() {
        authenticateAs("designer@rohilla.com");

        PerformanceMetricsDto.DesignerPerformanceDto perf = workspaceService.getDesignerPerformance(DateRangeFilter.THIS_MONTH, null, null);
        assertNotNull(perf);
        assertTrue(perf.getDesignsCompleted() >= 0);
        assertTrue(perf.getAverageCompletionTimeDays() > 0);
        assertTrue(perf.getOnTimeCompletionRate() >= 0.0 && perf.getOnTimeCompletionRate() <= 100.0);
    }

    @Test
    @DisplayName("7. Production Performance Calculation")
    void testProductionPerformanceCalculation() {
        authenticateAs("production@rohilla.com");

        PerformanceMetricsDto.ProductionPerformanceDto perf = workspaceService.getProductionPerformance(DateRangeFilter.THIS_MONTH, null, null);
        assertNotNull(perf);
        assertTrue(perf.getAverageProductionTimeHours() > 0);
        assertTrue(perf.getOnTimeCompletionRate() >= 0.0 && perf.getOnTimeCompletionRate() <= 100.0);
    }

    @Test
    @DisplayName("8. QC Performance Calculation (Pass & Rework Rates)")
    void testQcPerformanceCalculation() {
        authenticateAs("qc@rohilla.com");

        PerformanceMetricsDto.QcPerformanceDto perf = workspaceService.getQcPerformance(DateRangeFilter.THIS_MONTH, null, null);
        assertNotNull(perf);
        assertTrue(perf.getPassRate() >= 0.0 && perf.getPassRate() <= 100.0);
        assertTrue(perf.getReworkRate() >= 0.0 && perf.getReworkRate() <= 100.0);
        assertTrue(perf.getAverageQualityScore() >= 0.0 && perf.getAverageQualityScore() <= 10.0);
    }

    @Test
    @DisplayName("9. Dispatch Performance Calculation")
    void testDispatchPerformanceCalculation() {
        authenticateAs("dispatch@rohilla.com");

        PerformanceMetricsDto.DispatchPerformanceDto perf = workspaceService.getDispatchPerformance(DateRangeFilter.THIS_MONTH, null, null);
        assertNotNull(perf);
        assertTrue(perf.getOnTimeCompletionRate() >= 0.0 && perf.getOnTimeCompletionRate() <= 100.0);
    }

    @Test
    @DisplayName("10. Manager Access to Team Performance Matrix & Operational Restriction")
    void testManagerTeamPerformanceAccess() {
        // Manager allowed
        authenticateAs("manager@rohilla.com");
        PerformanceMetricsDto.TeamPerformanceDto teamPerf = workspaceService.getTeamPerformance(DateRangeFilter.THIS_MONTH, null, null);
        assertNotNull(teamPerf);
        assertFalse(teamPerf.getDesignerMetrics().isEmpty());
        assertFalse(teamPerf.getProductionMetrics().isEmpty());
        assertFalse(teamPerf.getQcMetrics().isEmpty());
        assertFalse(teamPerf.getDispatchMetrics().isEmpty());

        // Operational role (Designer) restricted from team performance matrix
        authenticateAs("designer@rohilla.com");
        assertThrows(UnauthorizedActionException.class, () ->
                workspaceService.getTeamPerformance(DateRangeFilter.THIS_MONTH, null, null)
        );
    }

    @Test
    @DisplayName("11. Owner Access to Company-Wide Performance & Operational Restriction")
    void testOwnerCompanyPerformanceAccess() {
        // Admin / Owner allowed
        authenticateAs("admin@rohilla.com");
        PerformanceMetricsDto.CompanyPerformanceDto companyPerf = workspaceService.getCompanyPerformance(DateRangeFilter.THIS_MONTH, null, null);
        assertNotNull(companyPerf);
        assertTrue(companyPerf.getTotalProjects() > 0);
        assertNotNull(companyPerf.getDepartmentWorkload());
        assertNotNull(companyPerf.getDesignerProductivity());
        assertNotNull(companyPerf.getProductionProductivity());

        // Operational role (Production) restricted from company analytics
        authenticateAs("production@rohilla.com");
        assertThrows(UnauthorizedActionException.class, () ->
                workspaceService.getCompanyPerformance(DateRangeFilter.THIS_MONTH, null, null)
        );
    }

    @Test
    @DisplayName("12. Client Confidentiality Enforcement (Email, Phone, GST, Budget Masked for Staff)")
    void testClientConfidentialityEnforcement() {
        // 1. Designer receives masked client data
        authenticateAs("designer@rohilla.com");
        List<ProjectResponseDto> myWork = projectService.getMyWorkProjects();
        assertFalse(myWork.isEmpty());
        for (ProjectResponseDto p : myWork) {
            assertNotNull(p.getClient());
            assertNull(p.getClient().getEmail(), "Client email must be masked for non-privileged staff");
            assertNull(p.getClient().getPhone(), "Client phone must be masked for non-privileged staff");
            assertNull(p.getClient().getGstNumber(), "Client GST must be masked for non-privileged staff");
            assertNull(p.getBudget(), "Budget must be masked for non-privileged staff");
        }

        // 2. Manager receives full client details & financial budget
        authenticateAs("manager@rohilla.com");
        List<ProjectResponseDto> allProjects = projectService.getAllProjects();
        assertFalse(allProjects.isEmpty());
        boolean hasEmail = allProjects.stream().anyMatch(p -> p.getClient() != null && p.getClient().getEmail() != null);
        boolean hasPhone = allProjects.stream().anyMatch(p -> p.getClient() != null && p.getClient().getPhone() != null);
        boolean hasBudget = allProjects.stream().anyMatch(p -> p.getBudget() != null);
        assertTrue(hasEmail, "Manager must be able to view client email");
        assertTrue(hasPhone, "Manager must be able to view client phone");
        assertTrue(hasBudget, "Manager must be able to view project budget");
    }
}
