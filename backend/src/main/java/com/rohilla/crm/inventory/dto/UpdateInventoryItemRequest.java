package com.rohilla.crm.inventory.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateInventoryItemRequest {
    private String name;
    private String category;
    private String unit;
    private BigDecimal reorderLevel;
    private BigDecimal unitCost;
    private String location;
    private String notes;
}
