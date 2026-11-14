package com.rohilla.crm.design.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManagerApprovalRequest {

    @NotNull(message = "Approved status is required")
    private Boolean approved;

    @NotNull(message = "Approved design file ID is required to lock production version")
    private UUID approvedDesignFileId;

    private String notes;
}
