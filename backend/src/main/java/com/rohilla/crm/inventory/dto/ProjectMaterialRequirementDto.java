package com.rohilla.crm.inventory.dto;

import com.rohilla.crm.inventory.enums.RequirementStatus;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectMaterialRequirementDto {
    private UUID id;
    private UUID projectId;
    private UUID inventoryItemId;
    private String itemCode;
    private String materialName;
    private String serviceName;
    private BigDecimal requiredQuantity;
    private String unit;
    private BigDecimal reservedQuantity;
    private BigDecimal issuedQuantity;
    private BigDecimal availableInStock;
    private RequirementStatus status;
    private String notes;
}
