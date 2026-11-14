package com.rohilla.crm.security.repository;

import com.rohilla.crm.security.entity.Role;
import com.rohilla.crm.security.enums.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleType name);
}
