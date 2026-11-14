package com.rohilla.crm.design.repository;

import com.rohilla.crm.design.entity.DesignFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DesignFileRepository extends JpaRepository<DesignFile, UUID> {
    List<DesignFile> findAllByProjectIdOrderByVersionNumberDesc(UUID projectId);
    Optional<DesignFile> findByStorageKey(String storageKey);
}
