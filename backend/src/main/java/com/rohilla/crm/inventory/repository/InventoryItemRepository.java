package com.rohilla.crm.inventory.repository;

import com.rohilla.crm.inventory.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, UUID> {

    Optional<InventoryItem> findByItemCode(String itemCode);

    Optional<InventoryItem> findFirstByNameIgnoreCase(String name);

    boolean existsByItemCode(String itemCode);

    List<InventoryItem> findAllByOrderByCategoryAscNameAsc();

    List<InventoryItem> findByCategoryOrderByNameAsc(String category);

    @Query("SELECT i FROM InventoryItem i WHERE i.currentStock <= i.reorderLevel ORDER BY i.currentStock ASC")
    List<InventoryItem> findLowStockItems();

    @Query("SELECT i FROM InventoryItem i WHERE " +
           "LOWER(i.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.itemCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(i.category) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY i.name ASC")
    List<InventoryItem> searchItems(@Param("query") String query);
}
