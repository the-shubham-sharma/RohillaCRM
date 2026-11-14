package com.rohilla.crm.qc.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordQcEvaluationRequest {

    @NotNull(message = "Passed status is required")
    private Boolean passed;

    @Min(value = 1, message = "Color accuracy must be between 1 and 10")
    @Max(value = 10, message = "Color accuracy must be between 1 and 10")
    private int colorAccuracyScore;

    @Min(value = 1, message = "Dimension accuracy must be between 1 and 10")
    @Max(value = 10, message = "Dimension accuracy must be between 1 and 10")
    private int dimensionAccuracyScore;

    @Min(value = 1, message = "Finishing score must be between 1 and 10")
    @Max(value = 10, message = "Finishing score must be between 1 and 10")
    private int finishingScore;

    private String remarks;

    private String defectsNotes;
}
