package com.rohilla.crm.inventory.dto;

import com.rohilla.crm.employee.dto.UserSummaryDto;
import com.rohilla.crm.inventory.enums.StockTransactionType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockTransactionDto {
    private UUID id;
    private String transactionCode;
    private UUID inventoryItemId;
    private String itemCode;
    private String itemName;
    private StockTransactionType transactionType;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal balanceBefore;
    private BigDecimal balanceAfter;
    private UUID projectId;
    private String projectCode;
    private UUID enquiryId;
    private String enquiryNumber;
    private UserSummaryDto performedBy;
    private String reason;
    private Instant createdAt;
}
