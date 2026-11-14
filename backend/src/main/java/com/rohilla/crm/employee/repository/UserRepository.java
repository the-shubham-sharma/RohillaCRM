package com.rohilla.crm.employee.repository;

import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.common.enums.DepartmentType;
import com.rohilla.crm.security.enums.RoleType;
import com.rohilla.crm.employee.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByEmployeeId(String employeeId);
    boolean existsByEmployeeId(String employeeId);
    List<User> findAllByStatus(UserStatus status);
    List<User> findAllByDepartment(DepartmentType department);
    List<User> findAllByRoles_Name(RoleType roleName);
}
