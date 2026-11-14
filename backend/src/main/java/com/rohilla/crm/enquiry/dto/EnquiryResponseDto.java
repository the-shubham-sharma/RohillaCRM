package com.rohilla.crm.enquiry.dto;

import com.rohilla.crm.employee.dto.UserSummaryDto;
import com.rohilla.crm.client.dto.ClientDto;
import com.rohilla.crm.enquiry.enums.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnquiryResponseDto {
    private UUID id;
    private String enquiryNumber;
    private LocalDate enquiryDate;
    private ClientDto client;
    private String clientName;
    private String companyName;
    private String phone;
    private String alternatePhone;
    private String email;
    private String address;
    private String gstNumber;
    private LeadSource leadSource;
    private UserSummaryDto recordedBy;
    private EnquiryStatus status;
    private EnquiryPriority priority;
    private LocalDate expectedCompletionDate;
    private QuotationStatus quotationStatus;
    private BigDecimal estimatedAmount;
    private DesignRequirementStatus designStatus;
    private String customerRemarks;
    private String internalRemarks;
    private UUID convertedProjectId;
    private String convertedProjectCode;
    private List<EnquiryLineItemDto> lineItems;
    private Instant createdAt;
    private Instant updatedAt;
}
