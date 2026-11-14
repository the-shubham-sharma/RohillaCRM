package com.rohilla.crm.inventory.dto;

import com.rohilla.crm.inventory.enums.StockTransactionType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockTransactionRequest {

    @NotNull(message = "Inventory item ID is required")
    private UUID inventoryItemId;

    @NotNull(message = "Transaction type is required")
    private StockTransactionType transactionType;

    @NotNull(message = "Quantity is required")
    private BigDecimal quantity;

    private UUID projectId;

    private UUID enquiryId;

    private String reason;
}
