package com.rohilla.crm.dispatch.repository;

import com.rohilla.crm.dispatch.entity.DispatchRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DispatchRecordRepository extends JpaRepository<DispatchRecord, UUID> {
    List<DispatchRecord> findAllByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
