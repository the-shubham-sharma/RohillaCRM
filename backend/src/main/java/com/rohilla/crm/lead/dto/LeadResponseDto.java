package com.rohilla.crm.lead.dto;

import com.rohilla.crm.lead.entity.Lead;

import com.rohilla.crm.lead.enums.LeadStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadResponseDto {

    private UUID id;
    private String leadCode;
    private String customerName;
    private String phone;
    private String email;
    private String companyName;
    private String requirement;
    private String productService;
    private Integer quantity;
    private String size;
    private String location;
    private boolean designRequired;
    private String designFileStorageKey;
    private String designFileName;
    private String notes;
    private LeadStatus status;
    private UUID convertedProjectId;
    private String convertedProjectCode;
    private String assignedManagerName;
    private Instant createdAt;
    private Instant updatedAt;
}
