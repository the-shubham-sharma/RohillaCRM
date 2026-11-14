package com.rohilla.crm.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateInventoryItemRequest {

    @NotBlank(message = "Item code is required")
    private String itemCode;

    @NotBlank(message = "Item name is required")
    private String name;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Unit is required")
    private String unit;

    @NotNull(message = "Initial stock is required")
    @Builder.Default
    private BigDecimal initialStock = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal reorderLevel = new BigDecimal("10.00");

    private BigDecimal unitCost;

    private String location;

    private String notes;
}
