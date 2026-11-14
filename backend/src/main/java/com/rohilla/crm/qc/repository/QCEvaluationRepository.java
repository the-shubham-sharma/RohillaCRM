package com.rohilla.crm.qc.repository;

import com.rohilla.crm.qc.entity.QCEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QCEvaluationRepository extends JpaRepository<QCEvaluation, UUID> {
    List<QCEvaluation> findAllByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
