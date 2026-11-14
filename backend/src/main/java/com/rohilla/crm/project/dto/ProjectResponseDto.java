package com.rohilla.crm.project.dto;

import com.rohilla.crm.client.dto.ClientDto;
import com.rohilla.crm.client.entity.Client;
import com.rohilla.crm.employee.dto.UserSummaryDto;
import com.rohilla.crm.project.entity.Project;

import com.rohilla.crm.common.enums.Priority;
import com.rohilla.crm.project.enums.ProjectStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectResponseDto {
    private UUID id;
    private String projectCode;
    private String title;
    private String description;
    private ClientDto client;
    private ProjectStatus status;
    private Priority priority;
    private boolean customerProvidedDesign;
    private UUID approvedDesignFileId;
    private boolean installationRequired;
    private UUID leadId;
    private String leadCode;
    private UserSummaryDto assignedDesigner;
    private UserSummaryDto assignedProduction;
    private UserSummaryDto assignedQc;
    private UserSummaryDto assignedDispatch;
    private UserSummaryDto createdBy;
    private LocalDate dueDate;
    private BigDecimal budget; // May be null/masked for Designers & Production
    private int designFilesCount;
    private int productionTasksCount;
    private Boolean qcPassed;
    private boolean isDispatched;
    private Instant createdAt;
    private Instant updatedAt;
}
