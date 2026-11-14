package com.rohilla.crm.design.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TechnicalCheckRequest {

    @NotNull(message = "Passed status is required")
    private Boolean passed;

    private String compatibilityNotes;

    private UUID designFileId;
}
