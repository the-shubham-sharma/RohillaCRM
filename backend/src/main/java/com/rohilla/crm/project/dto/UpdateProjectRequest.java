package com.rohilla.crm.project.dto;

import com.rohilla.crm.project.entity.Project;

import com.rohilla.crm.common.enums.Priority;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProjectRequest {
    private String title;
    private String description;
    private Priority priority;
    private LocalDate dueDate;
    private BigDecimal budget;
    private UUID assignedDesignerId;
    private UUID assignedProductionId;
    private UUID assignedQcId;
    private UUID assignedDispatchId;
}
