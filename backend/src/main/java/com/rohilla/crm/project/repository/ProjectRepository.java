package com.rohilla.crm.project.repository;

import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.project.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    Optional<Project> findByProjectCode(String projectCode);

    boolean existsByProjectCode(String projectCode);

    List<Project> findAllByOrderByCreatedAtDesc();

    List<Project> findAllByStatusOrderByCreatedAtDesc(ProjectStatus status);

    List<Project> findAllByStatusNotOrderByCreatedAtDesc(ProjectStatus status);

    List<Project> findAllByStatusOrderByUpdatedAtDesc(ProjectStatus status);

    @Query("SELECT COUNT(p) > 0 FROM Project p WHERE p.id = :projectId AND (" +
           "p.assignedDesigner.id = :userId OR " +
           "p.assignedProduction.id = :userId OR " +
           "p.assignedQc.id = :userId OR " +
           "p.assignedDispatch.id = :userId OR " +
           "p.createdBy.id = :userId)")
    boolean isUserAssignedToProject(@Param("projectId") UUID projectId, @Param("userId") UUID userId);

    @Query("SELECT p FROM Project p WHERE " +
           "p.assignedDesigner.id = :userId OR " +
           "p.assignedProduction.id = :userId OR " +
           "p.assignedQc.id = :userId OR " +
           "p.assignedDispatch.id = :userId OR " +
           "p.createdBy.id = :userId " +
           "ORDER BY p.createdAt DESC")
    List<Project> findProjectsAccessibleByUser(@Param("userId") UUID userId);
}
