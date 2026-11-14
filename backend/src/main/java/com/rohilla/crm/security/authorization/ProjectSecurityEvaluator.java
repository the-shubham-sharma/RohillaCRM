package com.rohilla.crm.security.authorization;

import com.rohilla.crm.security.authentication.CustomUserDetails;

import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.security.enums.RoleType;
import com.rohilla.crm.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component("projectSecurity")
@RequiredArgsConstructor
public class ProjectSecurityEvaluator {

    private final ProjectRepository projectRepository;

    private boolean isPrivileged(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(RoleType.ROLE_ADMIN.name()) ||
                a.getAuthority().equals(RoleType.ROLE_MANAGER.name()) ||
                a.getAuthority().equals("project:read:all")
        );
    }

    private Optional<UUID> getUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return Optional.empty();
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            return Optional.of(userDetails.getId());
        }
        return Optional.empty();
    }

    /**
     * VIEW check: Admin/Manager OR any assigned staff member / creator
     */
    public boolean canViewProject(Authentication authentication, UUID projectId) {
        if (isPrivileged(authentication)) return true;

        Optional<UUID> userId = getUserId(authentication);
        if (userId.isEmpty() || projectId == null) return false;

        return projectRepository.isUserAssignedToProject(projectId, userId.get());
    }

    public boolean canAccessProject(Authentication authentication, UUID projectId) {
        return canViewProject(authentication, projectId);
    }

    /**
     * EDIT / METADATA check: Only Admin & Manager
     */
    public boolean canEditProject(Authentication authentication, UUID projectId) {
        return isPrivileged(authentication);
    }

    /**
     * ASSIGN STAFF check: Only Admin & Manager
     */
    public boolean canAssignStaff(Authentication authentication, UUID projectId) {
        return isPrivileged(authentication);
    }

    /**
     * DESIGN ACTION check: Admin/Manager OR the specifically assigned Designer
     */
    public boolean canPerformDesignAction(Authentication authentication, UUID projectId) {
        if (isPrivileged(authentication)) return true;

        Optional<UUID> userId = getUserId(authentication);
        if (userId.isEmpty() || projectId == null) return false;

        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) return false;

        Project project = projectOpt.get();
        return project.getAssignedDesigner() != null &&
               project.getAssignedDesigner().getId().equals(userId.get());
    }

    /**
     * DESIGN APPROVAL check: Admin & Manager
     */
    public boolean canApproveDesign(Authentication authentication, UUID projectId) {
        return isPrivileged(authentication);
    }

    /**
     * PRODUCTION ACTION check: Admin/Manager OR the specifically assigned Production specialist
     */
    public boolean canPerformProduction(Authentication authentication, UUID projectId) {
        if (isPrivileged(authentication)) return true;

        Optional<UUID> userId = getUserId(authentication);
        if (userId.isEmpty() || projectId == null) return false;

        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) return false;

        Project project = projectOpt.get();
        return project.getAssignedProduction() != null &&
               project.getAssignedProduction().getId().equals(userId.get());
    }

    /**
     * QC INSPECTION check: Admin/Manager OR the specifically assigned QC inspector
     */
    public boolean canPerformQc(Authentication authentication, UUID projectId) {
        if (isPrivileged(authentication)) return true;

        Optional<UUID> userId = getUserId(authentication);
        if (userId.isEmpty() || projectId == null) return false;

        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) return false;

        Project project = projectOpt.get();
        return project.getAssignedQc() != null &&
               project.getAssignedQc().getId().equals(userId.get());
    }

    /**
     * DISPATCH ACTION check: Admin/Manager OR the specifically assigned Dispatch personnel
     */
    public boolean canPerformDispatch(Authentication authentication, UUID projectId) {
        if (isPrivileged(authentication)) return true;

        Optional<UUID> userId = getUserId(authentication);
        if (userId.isEmpty() || projectId == null) return false;

        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (projectOpt.isEmpty()) return false;

        Project project = projectOpt.get();
        return project.getAssignedDispatch() != null &&
               project.getAssignedDispatch().getId().equals(userId.get());
    }

    /**
     * DOWNLOAD FILE check: Admin/Manager OR any assigned project staff member
     */
    public boolean canDownloadFile(Authentication authentication, UUID projectId) {
        return canViewProject(authentication, projectId);
    }
}
