package com.rohilla.crm.workspace.dto;

import com.rohilla.crm.common.enums.Priority;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class HistoryDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DesignerHistoryDto {
        private UUID projectId;
        private String projectCode;
        private String title;
        private String taskType;
        private Instant assignedAt;
        private Instant startedAt;
        private Instant submittedAt;
        private Instant completedAt;
        private int versionCount;
        private int reworkCount;
        private String finalStatus;
        private Double completionTimeHours;
        private Double completionTimeDays;
        private Priority priority;
        private LocalDate dueDate;
        private boolean onTime;
        private String latestFeedback;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductionHistoryDto {
        private UUID projectId;
        private String projectCode;
        private String title;
        private UUID taskId;
        private String taskName;
        private String materialSpecification;
        private String machineType;
        private Integer quantity;
        private Instant assignedAt;
        private Instant startedAt;
        private Instant completedAt;
        private Double durationHours;
        private int reworkCount;
        private Instant qcSubmissionDate;
        private String status;
        private Priority priority;
        private LocalDate dueDate;
        private boolean onTime;
        private String notes;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QcHistoryDto {
        private UUID projectId;
        private String projectCode;
        private String title;
        private UUID evaluationId;
        private Instant inspectionDate;
        private String inspectionType;
        private boolean passed;
        private int colorAccuracyScore;
        private int dimensionAccuracyScore;
        private int finishingScore;
        private double averageScore;
        private String remarks;
        private String defectsNotes;
        private boolean reworkRequested;
        private Integer inspectionDurationMinutes;
        private int totalInspections;
        private boolean onTime;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DispatchHistoryDto {
        private UUID projectId;
        private String projectCode;
        private String title;
        private UUID recordId;
        private String courierPartner;
        private String trackingNumber;
        private Instant assignedAt;
        private LocalDate dispatchDate;
        private boolean installationRequired;
        private LocalDate installationDate;
        private Instant completedAt;
        private String deliveryStatus;
        private String recipientSummary;
        private String destinationSummary;
        private boolean onTime;
        private String dispatchNotes;
        private String installationNotes;
    }
}
