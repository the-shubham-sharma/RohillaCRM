package com.rohilla.crm.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "inventory_items", indexes = {
    @Index(name = "idx_item_code", columnList = "itemCode", unique = true),
    @Index(name = "idx_item_category", columnList = "category"),
    @Index(name = "idx_item_name", columnList = "name")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String itemCode;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 100)
    private String category; // e.g. "Flex & Vinyl", "Metal & Structural", "Sheets & Boards", "LED & Electrical", "Hardware & Fasteners"

    @Column(nullable = false, length = 50)
    private String unit; // e.g. "Sq. Ft.", "Running Ft.", "Kg", "Piece", "Roll", "Sheet"

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal currentStock = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal reservedStock = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal reorderLevel = new BigDecimal("10.00");

    @Column(precision = 12, scale = 2)
    private BigDecimal unitCost;

    @Column(length = 150)
    private String location; // e.g. "Rack A-1", "Shop Floor"

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public BigDecimal getAvailableStock() {
        BigDecimal cur = currentStock != null ? currentStock : BigDecimal.ZERO;
        BigDecimal res = reservedStock != null ? reservedStock : BigDecimal.ZERO;
        return cur.subtract(res);
    }
}
