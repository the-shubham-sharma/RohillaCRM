package com.rohilla.crm.project.repository;

import com.rohilla.crm.project.entity.ProjectLineItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectLineItemRepository extends JpaRepository<ProjectLineItem, UUID> {
    List<ProjectLineItem> findByProjectId(UUID projectId);
}
