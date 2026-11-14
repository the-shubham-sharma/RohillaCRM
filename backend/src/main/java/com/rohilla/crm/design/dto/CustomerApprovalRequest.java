package com.rohilla.crm.design.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerApprovalRequest {

    @NotNull(message = "Approved status is required")
    private Boolean approved;

    private String feedback;

    private UUID designFileId;
}
