package com.rohilla.crm.project.dto;

import com.rohilla.crm.client.dto.ClientDto;
import com.rohilla.crm.client.entity.Client;
import com.rohilla.crm.design.dto.DesignFileDto;
import com.rohilla.crm.dispatch.dto.DispatchRecordDto;
import com.rohilla.crm.employee.dto.UserSummaryDto;
import com.rohilla.crm.production.dto.ProductionTaskDto;
import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.qc.dto.QCEvaluationDto;

import com.rohilla.crm.common.enums.Priority;
import com.rohilla.crm.project.enums.ProjectStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectDetailDto {
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
    private UUID enquiryId;
    private String enquiryNumber;
    private List<ProjectLineItemDto> lineItems;
    private List<com.rohilla.crm.inventory.dto.ProjectMaterialRequirementDto> materialRequirements;
    private LocalDate installationDate;
    private String installationNotes;
    private UserSummaryDto installationCompletedBy;
    private UserSummaryDto assignedDesigner;
    private UserSummaryDto assignedProduction;
    private UserSummaryDto assignedQc;
    private UserSummaryDto assignedDispatch;
    private UserSummaryDto createdBy;
    private LocalDate dueDate;
    private BigDecimal budget; // Masked for Designer / Production
    private List<DesignFileDto> designFiles;
    private List<ProductionTaskDto> productionTasks;
    private List<QCEvaluationDto> qcEvaluations;
    private List<DispatchRecordDto> dispatchRecords;
    private Set<ProjectStatus> allowedNextStatuses;
    private Instant createdAt;
    private Instant updatedAt;
}
