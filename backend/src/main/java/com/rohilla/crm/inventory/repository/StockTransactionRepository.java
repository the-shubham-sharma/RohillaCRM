package com.rohilla.crm.inventory.repository;

import com.rohilla.crm.inventory.entity.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, UUID> {

    List<StockTransaction> findAllByOrderByCreatedAtDesc();

    List<StockTransaction> findByInventoryItemIdOrderByCreatedAtDesc(UUID inventoryItemId);

    List<StockTransaction> findByProjectIdOrderByCreatedAtDesc(UUID projectId);
}
