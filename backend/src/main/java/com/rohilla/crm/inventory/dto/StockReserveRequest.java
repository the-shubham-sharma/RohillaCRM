package com.rohilla.crm.inventory.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockReserveRequest {

    @NotNull(message = "Requirement ID is required")
    private UUID requirementId;

    @NotNull(message = "Quantity to reserve is required")
    private BigDecimal quantity;

    private UUID inventoryItemId; // Optional override if linking to specific stock item

    private String notes;
}
