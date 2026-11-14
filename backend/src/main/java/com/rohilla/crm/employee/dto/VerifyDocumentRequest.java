package com.rohilla.crm.employee.dto;

import com.rohilla.crm.employee.enums.DocumentVerificationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyDocumentRequest {

    @NotNull(message = "Status is required (VERIFIED or REJECTED)")
    private DocumentVerificationStatus status;

    private String rejectionReason;

    private String documentNumber;
}
