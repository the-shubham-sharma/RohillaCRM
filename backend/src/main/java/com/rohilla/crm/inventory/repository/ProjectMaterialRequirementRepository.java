package com.rohilla.crm.inventory.repository;

import com.rohilla.crm.inventory.entity.ProjectMaterialRequirement;
import com.rohilla.crm.inventory.enums.RequirementStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectMaterialRequirementRepository extends JpaRepository<ProjectMaterialRequirement, UUID> {

    List<ProjectMaterialRequirement> findByProjectId(UUID projectId);

    List<ProjectMaterialRequirement> findByProjectIdAndStatus(UUID projectId, RequirementStatus status);

    List<ProjectMaterialRequirement> findByStatus(RequirementStatus status);
}
