package com.rohilla.crm.employee.repository;

import com.rohilla.crm.employee.entity.EmployeeDocument;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.employee.enums.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeDocumentRepository extends JpaRepository<EmployeeDocument, UUID> {
    List<EmployeeDocument> findAllByUserOrderByCreatedAtDesc(User user);
    List<EmployeeDocument> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    List<EmployeeDocument> findAllByUserIdAndCurrentTrue(UUID userId);
    Optional<EmployeeDocument> findByUserIdAndDocumentTypeAndCurrentTrue(UUID userId, DocumentType documentType);

    List<EmployeeDocument> findAllByUserIdAndDocumentTypeOrderByVersionDesc(UUID userId, DocumentType documentType);
}
