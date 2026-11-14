package com.rohilla.crm.workspace.dto;

import com.rohilla.crm.common.enums.DateRangeFilter;
import lombok.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class PerformanceMetricsDto {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DesignerPerformanceDto {
        private DateRangeFilter period;
        private int designsCompleted;
        private int designsSubmitted;
        private int revisionsCount;
        private double averageCompletionTimeDays;
        private double onTimeCompletionRate;
        private int activeJobs;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductionPerformanceDto {
        private DateRangeFilter period;
        private int jobsCompleted;
        private int jobsInProgress;
        private int reworkJobs;
        private double averageProductionTimeHours;
        private double onTimeCompletionRate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QcPerformanceDto {
        private DateRangeFilter period;
        private int inspectionsCompleted;
        private int inspectionsPassed;
        private int inspectionsFailed;
        private double passRate;
        private double reworkRate;
        private double averageInspectionTimeMinutes;
        private double averageQualityScore;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DispatchPerformanceDto {
        private DateRangeFilter period;
        private int dispatchesCompleted;
        private int installationsCompleted;
        private int pendingJobs;
        private double onTimeCompletionRate;
        private double averageCompletionTimeDays;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmployeePerformanceSummary {
        private UUID userId;
        private String fullName;
        private String email;
        private String department;
        private int completedCount;
        private int submittedOrActiveCount;
        private int reworkCount;
        private double onTimeRate;
        private double averageTime; // Days or Hours depending on dept
        private String timeUnit;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TeamPerformanceDto {
        private DateRangeFilter period;

        @Builder.Default
        private List<EmployeePerformanceSummary> designerMetrics = new ArrayList<>();

        @Builder.Default
        private List<EmployeePerformanceSummary> productionMetrics = new ArrayList<>();

        @Builder.Default
        private List<EmployeePerformanceSummary> qcMetrics = new ArrayList<>();

        @Builder.Default
        private List<EmployeePerformanceSummary> dispatchMetrics = new ArrayList<>();
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CompanyPerformanceDto {
        private DateRangeFilter period;
        private int totalProjects;
        private int activeProjects;
        private int completedProjects;
        private double overallOnTimeRate;
        private int delaysCount;
        private int totalReworkCount;

        @Builder.Default
        private Map<String, Integer> departmentWorkload = new HashMap<>();

        private DesignerPerformanceDto designerProductivity;
        private ProductionPerformanceDto productionProductivity;
        private QcPerformanceDto qcProductivity;
        private DispatchPerformanceDto dispatchProductivity;
    }
}
