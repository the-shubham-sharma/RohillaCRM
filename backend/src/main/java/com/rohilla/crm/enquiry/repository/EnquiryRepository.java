package com.rohilla.crm.enquiry.repository;

import com.rohilla.crm.enquiry.entity.Enquiry;
import com.rohilla.crm.enquiry.enums.EnquiryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnquiryRepository extends JpaRepository<Enquiry, UUID> {

    Optional<Enquiry> findByEnquiryNumber(String enquiryNumber);

    boolean existsByEnquiryNumber(String enquiryNumber);

    List<Enquiry> findAllByOrderByCreatedAtDesc();

    List<Enquiry> findByStatusOrderByCreatedAtDesc(EnquiryStatus status);

    @Query("SELECT e FROM Enquiry e WHERE " +
           "LOWER(e.enquiryNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.clientName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "(e.companyName IS NOT NULL AND LOWER(e.companyName) LIKE LOWER(CONCAT('%', :query, '%'))) OR " +
           "e.phone LIKE CONCAT('%', :query, '%') " +
           "ORDER BY e.createdAt DESC")
    List<Enquiry> searchEnquiries(@Param("query") String query);

    @Query("SELECT e FROM Enquiry e WHERE e.status = :status AND (" +
           "LOWER(e.enquiryNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.clientName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "(e.companyName IS NOT NULL AND LOWER(e.companyName) LIKE LOWER(CONCAT('%', :query, '%'))) OR " +
           "e.phone LIKE CONCAT('%', :query, '%')) " +
           "ORDER BY e.createdAt DESC")
    List<Enquiry> searchEnquiriesWithStatus(@Param("query") String query, @Param("status") EnquiryStatus status);

    long countByStatus(EnquiryStatus status);
}
