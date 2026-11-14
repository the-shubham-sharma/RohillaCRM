package com.rohilla.crm.project.dto;

import com.rohilla.crm.client.entity.Client;
import com.rohilla.crm.project.entity.Project;

import com.rohilla.crm.common.enums.Priority;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateProjectRequest {

    @NotBlank(message = "Project code is required")
    private String projectCode;

    @NotBlank(message = "Project title is required")
    private String title;

    private String description;

    // Client Reference (if selecting an existing client)
    private UUID clientId;

    // Embedded Client Details (Required if new client or updating existing client)
    private String clientName;

    private String clientPhone;

    private String clientAddress;

    @Email(message = "Please enter a valid email address")
    private String clientEmail;

    private String contactPerson;

    private String gstNumber;

    private Map<String, String> clientCustomFields;

    @NotNull(message = "Priority is required")
    private Priority priority;

    @Builder.Default
    private boolean customerProvidedDesign = false;

    @Builder.Default
    private boolean installationRequired = true;

    private LocalDate dueDate;

    private BigDecimal budget;

    private UUID assignedDesignerId;

    private UUID assignedProductionId;

    private UUID assignedQcId;

    private UUID assignedDispatchId;

    // Optional link to Front Office Enquiry
    private UUID enquiryId;

    // Service checklist line items
    private java.util.List<com.rohilla.crm.enquiry.dto.EnquiryLineItemRequest> lineItems;
}

