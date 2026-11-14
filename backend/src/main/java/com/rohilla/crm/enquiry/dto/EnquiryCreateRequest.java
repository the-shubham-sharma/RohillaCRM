package com.rohilla.crm.enquiry.dto;

import com.rohilla.crm.enquiry.enums.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnquiryCreateRequest {

    private UUID clientId; // If existing client selected

    @NotBlank(message = "Client name is required")
    private String clientName;

    private String companyName;

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String alternatePhone;

    private String email;

    @NotBlank(message = "Address is required")
    private String address;

    private String gstNumber;

    @Builder.Default
    private LeadSource leadSource = LeadSource.WALK_IN;

    @Builder.Default
    private boolean isDraft = false;

    @Builder.Default
    private EnquiryPriority priority = EnquiryPriority.NORMAL;

    private LocalDate expectedCompletionDate;

    @Builder.Default
    private QuotationStatus quotationStatus = QuotationStatus.PENDING;

    private BigDecimal estimatedAmount;

    @Builder.Default
    private DesignRequirementStatus designStatus = DesignRequirementStatus.CLIENT_PROVIDED;

    private String customerRemarks;

    private String internalRemarks;

    @Valid
    @Builder.Default
    private List<EnquiryLineItemRequest> lineItems = new ArrayList<>();
}
