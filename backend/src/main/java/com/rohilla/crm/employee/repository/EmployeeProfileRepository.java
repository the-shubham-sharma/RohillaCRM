package com.rohilla.crm.employee.repository;

import com.rohilla.crm.employee.entity.EmployeeProfile;
import com.rohilla.crm.employee.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeProfileRepository extends JpaRepository<EmployeeProfile, UUID> {
    Optional<EmployeeProfile> findByUser(User user);
    Optional<EmployeeProfile> findByUserId(UUID userId);
}
