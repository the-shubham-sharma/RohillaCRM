package com.rohilla.crm.client.repository;

import com.rohilla.crm.client.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClientRepository extends JpaRepository<Client, UUID> {
    List<Client> findAllByOrderByCompanyNameAsc();
    Optional<Client> findFirstByPhone(String phone);
    Optional<Client> findByCompanyNameIgnoreCase(String companyName);
}
