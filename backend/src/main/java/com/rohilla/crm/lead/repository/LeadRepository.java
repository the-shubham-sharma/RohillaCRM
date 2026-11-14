package com.rohilla.crm.lead.repository;

import com.rohilla.crm.lead.entity.Lead;
import com.rohilla.crm.lead.enums.LeadStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeadRepository extends JpaRepository<Lead, UUID> {

    Optional<Lead> findByLeadCode(String leadCode);

    List<Lead> findByStatusOrderByCreatedAtDesc(LeadStatus status);

    List<Lead> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COUNT(l) FROM Lead l WHERE l.status = :status")
    long countByStatus(LeadStatus status);

    @Query("SELECT l FROM Lead l WHERE LOWER(l.customerName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(l.phone) LIKE CONCAT('%', :query, '%') OR LOWER(l.leadCode) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Lead> searchLeads(String query);
}
