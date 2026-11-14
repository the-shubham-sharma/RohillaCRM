package com.rohilla.crm.inventory.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItemDto {
    private UUID id;
    private String itemCode;
    private String name;
    private String category;
    private String unit;
    private BigDecimal currentStock;
    private BigDecimal reservedStock;
    private BigDecimal availableStock;
    private BigDecimal reorderLevel;
    private BigDecimal unitCost;
    private String location;
    private String notes;
    private boolean lowStock;
    private Instant createdAt;
    private Instant updatedAt;
}
