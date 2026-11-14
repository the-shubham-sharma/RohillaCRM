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
public class StockIssueRequest {

    @NotNull(message = "Requirement ID is required")
    private UUID requirementId;

    @NotNull(message = "Quantity to issue is required")
    private BigDecimal quantity;

    private String notes;
}
