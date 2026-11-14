package com.rohilla.crm.qc.dto;

import com.rohilla.crm.employee.dto.UserSummaryDto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QCEvaluationDto {
    private UUID id;
    private UUID projectId;
    private UserSummaryDto inspector;
    private boolean passed;
    private int colorAccuracyScore;
    private int dimensionAccuracyScore;
    private int finishingScore;
    private String remarks;
    private String defectsNotes;
    private String inspectionPhotoStorageKey;
    private Instant createdAt;
}
