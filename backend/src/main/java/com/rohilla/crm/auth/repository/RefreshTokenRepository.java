package com.rohilla.crm.auth.repository;

import com.rohilla.crm.auth.entity.RefreshToken;
import com.rohilla.crm.employee.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Modifying
    void deleteAllByUser(User user);
}
