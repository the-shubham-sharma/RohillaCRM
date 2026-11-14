package com.rohilla.crm.production.repository;

import com.rohilla.crm.production.entity.ProductionTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductionTaskRepository extends JpaRepository<ProductionTask, UUID> {
    List<ProductionTask> findAllByProjectIdOrderByCreatedAtAsc(UUID projectId);
}
