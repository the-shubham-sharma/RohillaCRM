package com.rohilla.crm.production.dto;

import com.rohilla.crm.employee.dto.UserSummaryDto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionTaskDto {
    private UUID id;
    private UUID projectId;
    private String taskName;
    private String materialSpecification;
    private String machineType;
    private Integer quantity;
    private String status;
    private Instant startedAt;
    private Instant completedAt;
    private UserSummaryDto assignedTo;
    private String notes;
    private Instant createdAt;
}
