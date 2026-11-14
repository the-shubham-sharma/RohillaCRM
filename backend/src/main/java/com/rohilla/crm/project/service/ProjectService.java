package com.rohilla.crm.project.service;

import com.rohilla.crm.audit.service.AuditService;
import com.rohilla.crm.auth.service.AuthService;
import com.rohilla.crm.client.dto.ClientDto;
import com.rohilla.crm.client.entity.Client;
import com.rohilla.crm.client.repository.ClientRepository;
import com.rohilla.crm.client.service.ClientService;
import com.rohilla.crm.common.enums.DepartmentType;
import com.rohilla.crm.common.enums.Priority;
import com.rohilla.crm.common.exception.InvalidStateTransitionException;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.common.util.PhoneUtils;
import com.rohilla.crm.design.dto.CustomerApprovalRequest;
import com.rohilla.crm.design.dto.DesignFileDto;
import com.rohilla.crm.design.dto.ManagerApprovalRequest;
import com.rohilla.crm.design.dto.TechnicalCheckRequest;
import com.rohilla.crm.design.entity.DesignFile;
import com.rohilla.crm.design.repository.DesignFileRepository;
import com.rohilla.crm.dispatch.dto.DispatchRecordDto;
import com.rohilla.crm.dispatch.dto.RecordInstallationRequest;
import com.rohilla.crm.dispatch.entity.DispatchRecord;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.employee.enums.UserStatus;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.notification.entity.Notification;
import com.rohilla.crm.notification.service.NotificationService;
import com.rohilla.crm.production.dto.ProductionTaskDto;
import com.rohilla.crm.production.entity.ProductionTask;
import com.rohilla.crm.project.dto.AssignTaskRequest;
import com.rohilla.crm.project.dto.CreateProjectRequest;
import com.rohilla.crm.project.dto.ProjectDetailDto;
import com.rohilla.crm.project.dto.ProjectResponseDto;
import com.rohilla.crm.project.dto.UpdateProjectRequest;
import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.project.repository.ProjectRepository;
import com.rohilla.crm.project.workflow.WorkflowTransitionService;
import com.rohilla.crm.qc.dto.QCEvaluationDto;
import com.rohilla.crm.qc.entity.QCEvaluation;
import com.rohilla.crm.security.entity.Role;


import com.rohilla.crm.audit.enums.AuditAction;
import com.rohilla.crm.project.enums.ProjectStatus;
import com.rohilla.crm.security.enums.RoleType;

import com.rohilla.crm.common.exception.InvalidStateTransitionException;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;

import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.security.authorization.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final DesignFileRepository designFileRepository;
    private final AuthService authService;
    private final ClientService clientService;
    private final WorkflowTransitionService workflowTransitionService;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final com.rohilla.crm.enquiry.repository.EnquiryRepository enquiryRepository;
    private final com.rohilla.crm.project.repository.ProjectLineItemRepository projectLineItemRepository;
    private final com.rohilla.crm.inventory.repository.InventoryItemRepository inventoryItemRepository;
    private final com.rohilla.crm.inventory.repository.ProjectMaterialRequirementRepository materialRequirementRepository;

    @Transactional(readOnly = true)
    public List<ProjectResponseDto> getAllProjects() {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        boolean isPrivileged = currentUser.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(RoleType.ROLE_ADMIN.name()) ||
                a.getAuthority().equals(RoleType.ROLE_MANAGER.name()) ||
                a.getAuthority().equals("project:read:all")
        );

        if (!isPrivileged) {
            throw new UnauthorizedActionException("Access denied: Only Admin/Owner and Manager can access company-wide projects list and pipeline.");
        }

        List<Project> projects = projectRepository.findAllByStatusNotOrderByCreatedAtDesc(ProjectStatus.COMPLETED);
        return projects.stream()
                .map(p -> mapToResponseDto(p, true))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponseDto> getProjectHistory() {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        boolean isPrivileged = currentUser.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(RoleType.ROLE_ADMIN.name()) ||
                a.getAuthority().equals(RoleType.ROLE_MANAGER.name()) ||
                a.getAuthority().equals("project:read:all")
        );

        if (!isPrivileged) {
            throw new UnauthorizedActionException("Access denied: Only Admin/Owner and Manager can access company-wide completed projects history.");
        }

        List<Project> projects = projectRepository.findAllByStatusOrderByUpdatedAtDesc(ProjectStatus.COMPLETED);
        return projects.stream()
                .map(p -> mapToResponseDto(p, true))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponseDto> getAllAccessibleProjects() {
        return getAllProjects();
    }

    @Transactional(readOnly = true)
    public List<ProjectResponseDto> getMyWorkProjects() {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        boolean isPrivileged = currentUser.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(RoleType.ROLE_ADMIN.name()) ||
                a.getAuthority().equals(RoleType.ROLE_MANAGER.name())
        );

        List<Project> projects = isPrivileged
                ? projectRepository.findAllByOrderByCreatedAtDesc()
                : projectRepository.findProjectsAccessibleByUser(currentUser.getId());

        return projects.stream()
                .map(p -> mapToResponseDto(p, isPrivileged))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectDetailDto getProjectDetail(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        boolean isAdminOrManager = currentUser.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(RoleType.ROLE_ADMIN.name()) ||
                a.getAuthority().equals(RoleType.ROLE_MANAGER.name()) ||
                a.getAuthority().equals("project:read:all")
        );

        boolean isDesigner = currentUser.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(RoleType.ROLE_DESIGNER.name())
        );

        boolean isProduction = currentUser.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(RoleType.ROLE_PRODUCTION.name())
        );

        boolean isQc = currentUser.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(RoleType.ROLE_QC.name())
        );

        boolean isDispatch = currentUser.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(RoleType.ROLE_DISPATCH.name())
        );

        Set<ProjectStatus> allowedNext = workflowTransitionService.getAllowedNextStatuses(project);

        ClientDto clientDto = clientService.mapToDto(project.getClient(), isAdminOrManager);

        // Design files: Designer, Production (needs approved artwork), QC (needs approved artwork proof), Admin, Manager
        List<DesignFileDto> designFiles = (isAdminOrManager || isDesigner || isProduction || isQc)
                ? project.getDesignFiles().stream().map(this::mapDesignFile).collect(Collectors.toList())
                : Collections.emptyList();

        // Production tasks: Production staff, Admin, Manager
        List<ProductionTaskDto> productionTasks = (isAdminOrManager || isProduction)
                ? project.getProductionTasks().stream().map(this::mapProductionTask).collect(Collectors.toList())
                : Collections.emptyList();

        // QC evaluations: QC staff, Admin, Manager
        List<QCEvaluationDto> qcEvaluations = (isAdminOrManager || isQc)
                ? project.getQcEvaluations().stream().map(this::mapQcEvaluation).collect(Collectors.toList())
                : Collections.emptyList();

        // Dispatch records: Dispatch staff, Admin, Manager
        List<DispatchRecordDto> dispatchRecords = (isAdminOrManager || isDispatch)
                ? project.getDispatchRecords().stream().map(this::mapDispatchRecord).collect(Collectors.toList())
                : Collections.emptyList();

        return ProjectDetailDto.builder()
                .id(project.getId())
                .projectCode(project.getProjectCode())
                .title(project.getTitle())
                .description(project.getDescription())
                .client(clientDto)
                .status(project.getStatus())
                .priority(project.getPriority())
                .customerProvidedDesign(project.isCustomerProvidedDesign())
                .approvedDesignFileId(project.getApprovedDesignFileId())
                .installationRequired(project.isInstallationRequired())
                .leadId(project.getLead() != null ? project.getLead().getId() : null)
                .leadCode(project.getLead() != null ? project.getLead().getLeadCode() : null)
                .enquiryId(project.getEnquiry() != null ? project.getEnquiry().getId() : null)
                .enquiryNumber(project.getEnquiry() != null ? project.getEnquiry().getEnquiryNumber() : null)
                .lineItems(project.getLineItems().stream().map(this::mapProjectLineItem).collect(Collectors.toList()))
                .materialRequirements(project.getMaterialRequirements().stream().map(this::mapProjectMaterialRequirement).collect(Collectors.toList()))
                .installationDate((isAdminOrManager || isDispatch) ? project.getInstallationDate() : null)
                .installationNotes((isAdminOrManager || isDispatch) ? project.getInstallationNotes() : null)
                .installationCompletedBy((isAdminOrManager || isDispatch) && project.getInstallationCompletedBy() != null ? authService.mapToUserSummary(project.getInstallationCompletedBy()) : null)
                .assignedDesigner((isAdminOrManager || isDesigner) && project.getAssignedDesigner() != null ? authService.mapToUserSummary(project.getAssignedDesigner()) : null)
                .assignedProduction((isAdminOrManager || isProduction) && project.getAssignedProduction() != null ? authService.mapToUserSummary(project.getAssignedProduction()) : null)
                .assignedQc((isAdminOrManager || isQc) && project.getAssignedQc() != null ? authService.mapToUserSummary(project.getAssignedQc()) : null)
                .assignedDispatch((isAdminOrManager || isDispatch) && project.getAssignedDispatch() != null ? authService.mapToUserSummary(project.getAssignedDispatch()) : null)
                .createdBy(isAdminOrManager ? authService.mapToUserSummary(project.getCreatedBy()) : null)
                .dueDate(project.getDueDate())
                .budget(isAdminOrManager ? project.getBudget() : null)
                .designFiles(designFiles)
                .productionTasks(productionTasks)
                .qcEvaluations(qcEvaluations)
                .dispatchRecords(dispatchRecords)
                .allowedNextStatuses(allowedNext)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }


    @Transactional
    public ProjectResponseDto createProject(CreateProjectRequest request) {
        Client client;

        if (request.getClientId() != null) {
            client = clientRepository.findById(request.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Client not found: " + request.getClientId()));

            if (request.getClientName() != null || request.getClientPhone() != null || request.getClientAddress() != null) {
                String name = request.getClientName() != null ? request.getClientName() : client.getCompanyName();
                String phone = request.getClientPhone() != null ? request.getClientPhone() : client.getPhone();
                String address = request.getClientAddress() != null ? request.getClientAddress() : client.getAddress();
                String email = request.getClientEmail() != null ? request.getClientEmail() : client.getEmail();

                clientService.validateClientData(name, phone, address, email);

                client.setCompanyName(name.trim());
                client.setPhone(com.rohilla.crm.common.util.PhoneUtils.cleanPhoneNumber(phone));
                client.setAddress(address.trim());
                client.setEmail(email != null && !email.trim().isEmpty() ? email.trim() : null);
                if (request.getContactPerson() != null) {
                    client.setContactPerson(request.getContactPerson().trim());
                }
                if (request.getGstNumber() != null) {
                    client.setGstNumber(request.getGstNumber().trim());
                }
                if (request.getClientCustomFields() != null) {
                    client.getCustomFields().putAll(request.getClientCustomFields());
                }
                client = clientRepository.save(client);
            } else {
                clientService.validateClientData(client.getCompanyName(), client.getPhone(), client.getAddress(), client.getEmail());
            }
        } else {
            clientService.validateClientData(
                    request.getClientName(),
                    request.getClientPhone(),
                    request.getClientAddress(),
                    request.getClientEmail()
            );

            String cleanedName = request.getClientName().trim();
            String cleanedPhone = com.rohilla.crm.common.util.PhoneUtils.cleanPhoneNumber(request.getClientPhone());
            String cleanedAddress = request.getClientAddress().trim();
            String cleanedEmail = (request.getClientEmail() != null && !request.getClientEmail().trim().isEmpty())
                    ? request.getClientEmail().trim() : null;

            java.util.Map<String, String> customMap = new java.util.LinkedHashMap<>();
            if (request.getClientCustomFields() != null) {
                request.getClientCustomFields().forEach((k, v) -> {
                    if (k != null && !k.trim().isEmpty() && v != null) {
                        customMap.put(k.trim(), v.trim());
                    }
                });
            }

            client = Client.builder()
                    .companyName(cleanedName)
                    .contactPerson(request.getContactPerson() != null ? request.getContactPerson().trim() : null)
                    .email(cleanedEmail)
                    .phone(cleanedPhone)
                    .address(cleanedAddress)
                    .gstNumber(request.getGstNumber() != null ? request.getGstNumber().trim() : null)
                    .customFields(customMap)
                    .build();

            client = clientRepository.save(client);
        }

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        User creator = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        User designer = request.getAssignedDesignerId() != null
                ? userRepository.findById(request.getAssignedDesignerId()).orElse(null) : null;
        User production = request.getAssignedProductionId() != null
                ? userRepository.findById(request.getAssignedProductionId()).orElse(null) : null;
        User qc = request.getAssignedQcId() != null
                ? userRepository.findById(request.getAssignedQcId()).orElse(null) : null;
        User dispatch = request.getAssignedDispatchId() != null
                ? userRepository.findById(request.getAssignedDispatchId()).orElse(null) : null;

        com.rohilla.crm.enquiry.entity.Enquiry linkedEnquiry = null;
        if (request.getEnquiryId() != null) {
            linkedEnquiry = enquiryRepository.findById(request.getEnquiryId()).orElse(null);
            if (linkedEnquiry != null && linkedEnquiry.getConvertedProject() != null) {
                throw new com.rohilla.crm.common.exception.InvalidRequestException("Enquiry " + linkedEnquiry.getEnquiryNumber() + " has already been converted to a project.");
            }
        }

        Project project = Project.builder()
                .projectCode(request.getProjectCode())
                .title(request.getTitle())
                .description(request.getDescription())
                .client(client)
                .priority(request.getPriority())
                .customerProvidedDesign(request.isCustomerProvidedDesign())
                .installationRequired(request.isInstallationRequired())
                .status(ProjectStatus.DRAFT)
                .assignedDesigner(designer)
                .assignedProduction(production)
                .assignedQc(qc)
                .assignedDispatch(dispatch)
                .createdBy(creator)
                .dueDate(request.getDueDate())
                .budget(request.getBudget())
                .enquiry(linkedEnquiry)
                .build();

        Project saved = projectRepository.save(project);

        if (linkedEnquiry != null) {
            linkedEnquiry.setStatus(com.rohilla.crm.enquiry.enums.EnquiryStatus.CONVERTED_TO_PROJECT);
            linkedEnquiry.setConvertedProject(saved);
            enquiryRepository.save(linkedEnquiry);
        }

        if (request.getLineItems() != null && !request.getLineItems().isEmpty()) {
            for (var itemReq : request.getLineItems()) {
                var areaResult = com.rohilla.crm.enquiry.util.DimensionCalculator.calculateArea(
                        itemReq.getWidth(),
                        itemReq.getHeight(),
                        itemReq.getDimensionUnit(),
                        itemReq.getPrintSides()
                );

                com.rohilla.crm.project.entity.ProjectLineItem pli = com.rohilla.crm.project.entity.ProjectLineItem.builder()
                        .project(saved)
                        .serviceName(itemReq.getServiceName())
                        .width(itemReq.getWidth())
                        .height(itemReq.getHeight())
                        .dimensionUnit(itemReq.getDimensionUnit() != null ? itemReq.getDimensionUnit() : com.rohilla.crm.enquiry.enums.DimensionUnit.FEET)
                        .siteMeasurementRequired(itemReq.isSiteMeasurementRequired())
                        .quantity(itemReq.getQuantity() != null && itemReq.getQuantity() > 0 ? itemReq.getQuantity() : 1)
                        .quantityUnit(itemReq.getQuantityUnit() != null ? itemReq.getQuantityUnit() : com.rohilla.crm.enquiry.enums.QuantityUnit.PIECE)
                        .printSides(itemReq.getPrintSides() != null ? itemReq.getPrintSides() : com.rohilla.crm.enquiry.enums.PrintSides.SINGLE_SIDED)
                        .printingType(itemReq.getPrintingType() != null ? itemReq.getPrintingType() : com.rohilla.crm.enquiry.enums.PrintingType.FULL_COLOUR)
                        .areaPerSideSqFt(areaResult.getAreaPerSideSqFt())
                        .totalAreaSqFt(areaResult.getTotalAreaSqFt())
                        .areaPerSideSqM(areaResult.getAreaPerSideSqM())
                        .totalAreaSqM(areaResult.getTotalAreaSqM())
                        .installationRequired(itemReq.isInstallationRequired())
                        .installationLocation(itemReq.getInstallationLocation())
                        .siteInspectionRequired(itemReq.isSiteInspectionRequired())
                        .deliveryDate(itemReq.getDeliveryDate())
                        .designStatus(itemReq.getDesignStatus() != null ? itemReq.getDesignStatus() : com.rohilla.crm.enquiry.enums.DesignRequirementStatus.CLIENT_PROVIDED)
                        .selectedMaterials(itemReq.getSelectedMaterials() != null ? new ArrayList<>(itemReq.getSelectedMaterials()) : new ArrayList<>())
                        .materialConfirmedByManager(itemReq.isMaterialConfirmedByManager())
                        .finishingRequirements(itemReq.getFinishingRequirements() != null ? new ArrayList<>(itemReq.getFinishingRequirements()) : new ArrayList<>())
                        .remarks(itemReq.getRemarks())
                        .build();

                projectLineItemRepository.save(pli);

                for (String mat : pli.getSelectedMaterials()) {
                    if (mat != null && !mat.isBlank() && !mat.contains("to be confirmed")) {
                        var matchedStock = inventoryItemRepository.findFirstByNameIgnoreCase(mat.trim()).orElse(null);
                        BigDecimal reqQty = (pli.getTotalAreaSqFt() != null && pli.getTotalAreaSqFt().compareTo(BigDecimal.ZERO) > 0)
                                ? pli.getTotalAreaSqFt()
                                : new BigDecimal(pli.getQuantity());

                        var pmr = com.rohilla.crm.inventory.entity.ProjectMaterialRequirement.builder()
                                .project(saved)
                                .inventoryItem(matchedStock)
                                .materialName(mat.trim())
                                .serviceName(pli.getServiceName())
                                .requiredQuantity(reqQty)
                                .unit(matchedStock != null ? matchedStock.getUnit() : pli.getQuantityUnit().name())
                                .status(com.rohilla.crm.inventory.enums.RequirementStatus.PENDING)
                                .notes("Requirement from direct project creation: " + pli.getServiceName())
                                .build();

                        materialRequirementRepository.save(pmr);
                    }
                }
            }
        }

        // Notify Designer if assigned on creation
        if (designer != null) {
            notificationService.sendNotification(
                    designer,
                    "New Project Assigned: " + saved.getProjectCode(),
                    "You have been assigned to project " + saved.getProjectCode() + " (" + (saved.isCustomerProvidedDesign() ? "Path A: Compatibility Check" : "Path B: Artwork Design") + ")",
                    "/projects/" + saved.getId()
            );
        }

        auditService.publishAudit(
                creator.getId(),
                creator.getEmail(),
                creator.getRoles().iterator().next().getName().name(),
                AuditAction.PROJECT_CREATED,
                "PROJECT",
                saved.getId().toString(),
                null,
                "Created project " + saved.getProjectCode() + " (" + (saved.isCustomerProvidedDesign() ? "Path A" : "Path B") + ") for client " + client.getCompanyName(),
                null,
                null
        );

        return mapToResponseDto(saved, true);
    }


    @Transactional
    public ProjectResponseDto updateProject(UUID projectId, UpdateProjectRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        if (request.getTitle() != null) project.setTitle(request.getTitle());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getPriority() != null) project.setPriority(request.getPriority());
        if (request.getDueDate() != null) project.setDueDate(request.getDueDate());
        if (request.getBudget() != null) project.setBudget(request.getBudget());

        if (request.getAssignedDesignerId() != null) {
            User newDesigner = userRepository.findById(request.getAssignedDesignerId()).orElse(null);
            project.setAssignedDesigner(newDesigner);
            if (newDesigner != null) {
                notificationService.sendNotification(
                        newDesigner,
                        "Project Assignment: " + project.getProjectCode(),
                        "You have been assigned to project " + project.getProjectCode(),
                        "/projects/" + project.getId()
                );
            }
        }
        if (request.getAssignedProductionId() != null) {
            project.setAssignedProduction(userRepository.findById(request.getAssignedProductionId()).orElse(null));
        }
        if (request.getAssignedQcId() != null) {
            project.setAssignedQc(userRepository.findById(request.getAssignedQcId()).orElse(null));
        }
        if (request.getAssignedDispatchId() != null) {
            project.setAssignedDispatch(userRepository.findById(request.getAssignedDispatchId()).orElse(null));
        }

        Project saved = projectRepository.save(project);

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails().orElse(null);
        UUID actorId = currentUser != null ? currentUser.getId() : null;
        String actorEmail = currentUser != null ? currentUser.getUsername() : "SYSTEM";

        auditService.publishAudit(
                actorId,
                actorEmail,
                "MANAGER",
                AuditAction.PROJECT_UPDATED,
                "PROJECT",
                saved.getId().toString(),
                null,
                "Updated project metadata & staff assignment",
                null,
                null
        );

        return mapToResponseDto(saved, true);
    }

    @Transactional
    public ProjectDetailDto assignTask(UUID projectId, AssignTaskRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        boolean isPrivileged = currentUser.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(RoleType.ROLE_ADMIN.name()) ||
                a.getAuthority().equals(RoleType.ROLE_MANAGER.name())
        );

        if (!isPrivileged) {
            throw new UnauthorizedActionException("Only Admins and Managers can assign or reassign project tasks.");
        }

        User assignee = userRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + request.getEmployeeId()));

        // STRICT SECURITY RULE 1: ONLY ACTIVE employees can receive task assignments
        if (assignee.getStatus() != com.rohilla.crm.employee.enums.UserStatus.ACTIVE) {
            throw new IllegalArgumentException("Cannot assign task to " + assignee.getStatus().name() + " employee: " + assignee.getFullName());
        }

        // STRICT SECURITY RULE 2: Department and Role matching
        com.rohilla.crm.common.enums.DepartmentType targetDepartment = request.getDepartment();
        User previousAssignee = null;
        String deptName = "";

        switch (targetDepartment) {
            case DESIGN:
                boolean isDesigner = assignee.getRoles().stream().anyMatch(r -> r.getName() == RoleType.ROLE_DESIGNER) ||
                                     assignee.getDepartment() == com.rohilla.crm.common.enums.DepartmentType.DESIGN;
                if (!isDesigner) {
                    throw new IllegalArgumentException("Assignment rejected: Employee " + assignee.getFullName() + 
                            " does not belong to Design department.");
                }
                previousAssignee = project.getAssignedDesigner();
                project.setAssignedDesigner(assignee);
                deptName = "Design";
                break;

            case PRODUCTION:
                boolean isProduction = assignee.getRoles().stream().anyMatch(r -> r.getName() == RoleType.ROLE_PRODUCTION) ||
                                       assignee.getDepartment() == com.rohilla.crm.common.enums.DepartmentType.PRODUCTION;
                if (!isProduction) {
                    throw new IllegalArgumentException("Assignment rejected: Employee " + assignee.getFullName() + 
                            " does not belong to Production department.");
                }
                previousAssignee = project.getAssignedProduction();
                project.setAssignedProduction(assignee);
                deptName = "Production";
                break;

            case QUALITY_CONTROL:
                boolean isQc = assignee.getRoles().stream().anyMatch(r -> r.getName() == RoleType.ROLE_QC) ||
                               assignee.getDepartment() == com.rohilla.crm.common.enums.DepartmentType.QUALITY_CONTROL;
                if (!isQc) {
                    throw new IllegalArgumentException("Assignment rejected: Employee " + assignee.getFullName() + 
                            " does not belong to QC department.");
                }
                previousAssignee = project.getAssignedQc();
                project.setAssignedQc(assignee);
                deptName = "QC";
                break;

            case DISPATCH:
                boolean isDispatch = assignee.getRoles().stream().anyMatch(r -> r.getName() == RoleType.ROLE_DISPATCH) ||
                                     assignee.getDepartment() == com.rohilla.crm.common.enums.DepartmentType.DISPATCH;
                if (!isDispatch) {
                    throw new IllegalArgumentException("Assignment rejected: Employee " + assignee.getFullName() + 
                            " does not belong to Dispatch department.");
                }
                previousAssignee = project.getAssignedDispatch();
                project.setAssignedDispatch(assignee);
                deptName = "Dispatch";
                break;

            default:
                throw new IllegalArgumentException("Invalid department for task assignment: " + targetDepartment);
        }

        Project saved = projectRepository.save(project);

        boolean isReassignment = (previousAssignee != null && !previousAssignee.getId().equals(assignee.getId()));
        AuditAction auditAction = isReassignment ? AuditAction.PROJECT_REASSIGNED : AuditAction.PROJECT_ASSIGNED;

        String auditDetails = isReassignment
                ? String.format("Reassigned %s task for project %s to %s (Previous: %s). Notes: %s",
                    deptName, project.getProjectCode(), assignee.getFullName(), previousAssignee.getFullName(),
                    request.getNotes() != null ? request.getNotes() : "N/A")
                : String.format("Assigned %s task for project %s to %s. Notes: %s",
                    deptName, project.getProjectCode(), assignee.getFullName(),
                    request.getNotes() != null ? request.getNotes() : "N/A");

        auditService.publishAudit(
                currentUser.getId(),
                currentUser.getUsername(),
                "ROLE_MANAGER",
                auditAction,
                "PROJECT",
                project.getId().toString(),
                previousAssignee != null ? previousAssignee.getFullName() : null,
                auditDetails,
                null,
                null
        );

        // Send notification to newly assigned employee
        String notificationTitle = isReassignment
                ? "Task Reassigned: " + project.getProjectCode() + " (" + deptName + ")"
                : "New " + deptName + " Task Assigned";
        String notificationMessage = String.format("Project %s has been %s to you by %s.",
                project.getProjectCode(),
                isReassignment ? "reassigned" : "assigned",
                currentUser.getFullName() != null ? currentUser.getFullName() : "Manager");

        notificationService.sendNotification(
                assignee,
                notificationTitle,
                notificationMessage,
                "/projects/" + project.getId()
        );

        return getProjectDetail(projectId);
    }

    // PATH A: Designer Technical / Machine Compatibility Check
    @Transactional
    public ProjectDetailDto recordTechnicalCheck(UUID projectId, TechnicalCheckRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        if (!project.isCustomerProvidedDesign()) {
            throw new InvalidStateTransitionException("Technical Check is only applicable for Path A (Customer Provided Design).");
        }

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        User designer = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // If specific design file supplied, update its technical check metadata
        if (request.getDesignFileId() != null) {
            DesignFile file = designFileRepository.findById(request.getDesignFileId())
                    .orElseThrow(() -> new ResourceNotFoundException("Design file not found"));
            file.setTechnicalCheckPassed(request.getPassed());
            file.setCompatibilityNotes(request.getCompatibilityNotes());
            file.setTechnicalCheckedBy(designer);
            if (request.getPassed()) {
                file.setProductionApproved(true);
                file.setLocked(true);
                project.setApprovedDesignFileId(file.getId());
            }
            designFileRepository.save(file);
        }

        auditService.publishAudit(
                designer.getId(),
                designer.getEmail(),
                "ROLE_DESIGNER",
                AuditAction.TECHNICAL_CHECK_RECORDED,
                "PROJECT",
                project.getId().toString(),
                project.getStatus().name(),
                "Technical Check " + (request.getPassed() ? "PASSED" : "FAILED") + ": " + request.getCompatibilityNotes(),
                null,
                null
        );

        if (request.getPassed()) {
            workflowTransitionService.transitionProjectStatus(project, ProjectStatus.READY_FOR_PRODUCTION,
                    "Passed machine & production compatibility check");
        } else {
            workflowTransitionService.transitionProjectStatus(project, ProjectStatus.MANAGER_REVIEW,
                    "Failed compatibility check: " + request.getCompatibilityNotes());
        }

        return getProjectDetail(projectId);
    }

    // PATH B: Customer Approval Sign-off
    @Transactional
    public ProjectDetailDto recordCustomerApproval(UUID projectId, CustomerApprovalRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        if (project.isCustomerProvidedDesign()) {
            throw new InvalidStateTransitionException("Customer Approval is not required for Path A.");
        }

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        if (request.getDesignFileId() != null) {
            DesignFile file = designFileRepository.findById(request.getDesignFileId())
                    .orElseThrow(() -> new ResourceNotFoundException("Design file not found"));
            file.setApprovedByCustomer(request.getApproved());
            file.setCustomerFeedback(request.getFeedback());
            designFileRepository.save(file);
        }

        auditService.publishAudit(
                currentUser.getId(),
                currentUser.getUsername(),
                "MANAGER",
                AuditAction.CUSTOMER_APPROVAL,
                "PROJECT",
                project.getId().toString(),
                project.getStatus().name(),
                "Customer " + (request.getApproved() ? "APPROVED" : "REJECTED") + ": " + request.getFeedback(),
                null,
                null
        );

        if (request.getApproved()) {
            workflowTransitionService.transitionProjectStatus(project, ProjectStatus.CUSTOMER_APPROVED, request.getFeedback());
        } else {
            workflowTransitionService.transitionProjectStatus(project, ProjectStatus.CUSTOMER_REWORK_REQUESTED, request.getFeedback());
        }

        return getProjectDetail(projectId);
    }

    // PATH B: Manager Final Production Approval & Version Lock
    @Transactional
    public ProjectDetailDto recordManagerApproval(UUID projectId, ManagerApprovalRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        User manager = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getApproved()) {
            DesignFile file = designFileRepository.findById(request.getApprovedDesignFileId())
                    .orElseThrow(() -> new ResourceNotFoundException("Approved design file not found: " + request.getApprovedDesignFileId()));

            // Lock design file for production
            file.setProductionApproved(true);
            file.setLocked(true);
            file.setApprovedByManager(manager);
            file.setManagerApprovedAt(Instant.now());
            designFileRepository.save(file);

            project.setApprovedDesignFileId(file.getId());
            projectRepository.save(project);

            auditService.publishAudit(
                    manager.getId(),
                    manager.getEmail(),
                    "ROLE_MANAGER",
                    AuditAction.MANAGER_APPROVAL,
                    "DESIGN_FILE",
                    file.getId().toString(),
                    null,
                    "Locked Design v" + file.getVersionNumber() + " for production (" + request.getNotes() + ")",
                    null,
                    null
            );

            workflowTransitionService.transitionProjectStatus(project, ProjectStatus.MANAGER_APPROVED, request.getNotes());
            workflowTransitionService.transitionProjectStatus(project, ProjectStatus.READY_FOR_PRODUCTION, "Released for fabrication");
        } else {
            workflowTransitionService.transitionProjectStatus(project, ProjectStatus.DESIGN_IN_PROGRESS,
                    "Manager requested revisions: " + request.getNotes());
        }

        return getProjectDetail(projectId);
    }

    // Installation Completion
    @Transactional
    public ProjectDetailDto recordInstallation(UUID projectId, RecordInstallationRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        User officer = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        project.setInstallationDate(request.getInstallationDate());
        project.setInstallationNotes(request.getInstallationNotes());
        project.setInstallationCompletedBy(officer);
        projectRepository.save(project);

        auditService.publishAudit(
                officer.getId(),
                officer.getEmail(),
                "ROLE_DISPATCH",
                AuditAction.INSTALLATION_COMPLETED,
                "PROJECT",
                project.getId().toString(),
                project.getStatus().name(),
                "Installation completed: " + request.getInstallationNotes(),
                null,
                null
        );

        workflowTransitionService.transitionProjectStatus(project, ProjectStatus.INSTALLATION_COMPLETED, request.getInstallationNotes());
        workflowTransitionService.transitionProjectStatus(project, ProjectStatus.COMPLETED, "Project lifecycle completed");

        return getProjectDetail(projectId);
    }

    public ProjectResponseDto mapToResponseDto(Project project, boolean isPrivileged) {
        boolean hasPassedQc = project.getQcEvaluations().stream().anyMatch(QCEvaluation::isPassed);
        boolean isDispatched = !project.getDispatchRecords().isEmpty();

        ClientDto clientDto = clientService.mapToDto(project.getClient(), isPrivileged);

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails().orElse(null);
        boolean isDesigner = currentUser != null && currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(RoleType.ROLE_DESIGNER.name()));
        boolean isProduction = currentUser != null && currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(RoleType.ROLE_PRODUCTION.name()));
        boolean isQc = currentUser != null && currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(RoleType.ROLE_QC.name()));
        boolean isDispatch = currentUser != null && currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(RoleType.ROLE_DISPATCH.name()));

        return ProjectResponseDto.builder()
                .id(project.getId())
                .projectCode(project.getProjectCode())
                .title(project.getTitle())
                .description(project.getDescription())
                .client(clientDto)
                .status(project.getStatus())
                .priority(project.getPriority())
                .customerProvidedDesign(project.isCustomerProvidedDesign())
                .approvedDesignFileId(project.getApprovedDesignFileId())
                .installationRequired(project.isInstallationRequired())
                .leadId(project.getLead() != null ? project.getLead().getId() : null)
                .leadCode(project.getLead() != null ? project.getLead().getLeadCode() : null)
                .assignedDesigner((isPrivileged || isDesigner) && project.getAssignedDesigner() != null ? authService.mapToUserSummary(project.getAssignedDesigner()) : null)
                .assignedProduction((isPrivileged || isProduction) && project.getAssignedProduction() != null ? authService.mapToUserSummary(project.getAssignedProduction()) : null)
                .assignedQc((isPrivileged || isQc) && project.getAssignedQc() != null ? authService.mapToUserSummary(project.getAssignedQc()) : null)
                .assignedDispatch((isPrivileged || isDispatch) && project.getAssignedDispatch() != null ? authService.mapToUserSummary(project.getAssignedDispatch()) : null)
                .createdBy(isPrivileged ? authService.mapToUserSummary(project.getCreatedBy()) : null)
                .dueDate(project.getDueDate())
                .budget(isPrivileged ? project.getBudget() : null)
                .designFilesCount(project.getDesignFiles().size())
                .productionTasksCount((isPrivileged || isProduction) ? project.getProductionTasks().size() : 0)
                .qcPassed(project.getQcEvaluations().isEmpty() ? null : hasPassedQc)
                .isDispatched(isDispatched)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    public ProjectResponseDto mapToResponseDto(Project project) {
        return mapToResponseDto(project, true);
    }

    private DesignFileDto mapDesignFile(DesignFile f) {
        return DesignFileDto.builder()
                .id(f.getId())
                .projectId(f.getProject().getId())
                .originalFileName(f.getOriginalFileName())
                .storageKey(f.getStorageKey())
                .fileSizeBytes(f.getFileSizeBytes())
                .mimeType(f.getMimeType())
                .versionNumber(f.getVersionNumber())
                .uploadedBy(authService.mapToUserSummary(f.getUploadedBy()))
                .technicalCheckPassed(f.getTechnicalCheckPassed())
                .compatibilityNotes(f.getCompatibilityNotes())
                .technicalCheckedBy(f.getTechnicalCheckedBy() != null ? authService.mapToUserSummary(f.getTechnicalCheckedBy()) : null)
                .approvedByCustomer(f.getApprovedByCustomer())
                .customerFeedback(f.getCustomerFeedback())
                .approvedByManager(f.getApprovedByManager() != null ? authService.mapToUserSummary(f.getApprovedByManager()) : null)
                .managerApprovedAt(f.getManagerApprovedAt())
                .isProductionApproved(f.isProductionApproved())
                .isLocked(f.isLocked())
                .createdAt(f.getCreatedAt())
                .build();
    }

    private ProductionTaskDto mapProductionTask(ProductionTask t) {
        return ProductionTaskDto.builder()
                .id(t.getId())
                .projectId(t.getProject().getId())
                .taskName(t.getTaskName())
                .materialSpecification(t.getMaterialSpecification())
                .machineType(t.getMachineType())
                .quantity(t.getQuantity())
                .status(t.getStatus())
                .startedAt(t.getStartedAt())
                .completedAt(t.getCompletedAt())
                .assignedTo(t.getAssignedTo() != null ? authService.mapToUserSummary(t.getAssignedTo()) : null)
                .notes(t.getNotes())
                .createdAt(t.getCreatedAt())
                .build();
    }

    private QCEvaluationDto mapQcEvaluation(QCEvaluation q) {
        return QCEvaluationDto.builder()
                .id(q.getId())
                .projectId(q.getProject().getId())
                .inspector(authService.mapToUserSummary(q.getInspector()))
                .passed(q.isPassed())
                .colorAccuracyScore(q.getColorAccuracyScore())
                .dimensionAccuracyScore(q.getDimensionAccuracyScore())
                .finishingScore(q.getFinishingScore())
                .remarks(q.getRemarks())
                .defectsNotes(q.getDefectsNotes())
                .inspectionPhotoStorageKey(q.getInspectionPhotoStorageKey())
                .createdAt(q.getCreatedAt())
                .build();
    }

    private DispatchRecordDto mapDispatchRecord(DispatchRecord d) {
        return DispatchRecordDto.builder()
                .id(d.getId())
                .projectId(d.getProject().getId())
                .dispatchDate(d.getDispatchDate())
                .courierPartner(d.getCourierPartner())
                .trackingNumber(d.getTrackingNumber())
                .recipientName(d.getRecipientName())
                .destinationAddress(d.getDestinationAddress())
                .podPhotoStorageKey(d.getPodPhotoStorageKey())
                .dispatchedBy(authService.mapToUserSummary(d.getDispatchedBy()))
                .dispatchNotes(d.getDispatchNotes())
                .createdAt(d.getCreatedAt())
                .build();
    }

    public com.rohilla.crm.project.dto.ProjectLineItemDto mapProjectLineItem(com.rohilla.crm.project.entity.ProjectLineItem pli) {
        return com.rohilla.crm.project.dto.ProjectLineItemDto.builder()
                .id(pli.getId())
                .serviceName(pli.getServiceName())
                .width(pli.getWidth())
                .height(pli.getHeight())
                .dimensionUnit(pli.getDimensionUnit())
                .siteMeasurementRequired(pli.isSiteMeasurementRequired())
                .quantity(pli.getQuantity())
                .quantityUnit(pli.getQuantityUnit())
                .printSides(pli.getPrintSides())
                .printingType(pli.getPrintingType())
                .areaPerSideSqFt(pli.getAreaPerSideSqFt())
                .totalAreaSqFt(pli.getTotalAreaSqFt())
                .areaPerSideSqM(pli.getAreaPerSideSqM())
                .totalAreaSqM(pli.getTotalAreaSqM())
                .installationRequired(pli.isInstallationRequired())
                .installationLocation(pli.getInstallationLocation())
                .siteInspectionRequired(pli.isSiteInspectionRequired())
                .deliveryDate(pli.getDeliveryDate())
                .designStatus(pli.getDesignStatus())
                .selectedMaterials(new ArrayList<>(pli.getSelectedMaterials()))
                .materialConfirmedByManager(pli.isMaterialConfirmedByManager())
                .finishingRequirements(new ArrayList<>(pli.getFinishingRequirements()))
                .remarks(pli.getRemarks())
                .build();
    }

    public com.rohilla.crm.inventory.dto.ProjectMaterialRequirementDto mapProjectMaterialRequirement(com.rohilla.crm.inventory.entity.ProjectMaterialRequirement req) {
        java.math.BigDecimal avail = req.getInventoryItem() != null ? req.getInventoryItem().getAvailableStock() : java.math.BigDecimal.ZERO;
        return com.rohilla.crm.inventory.dto.ProjectMaterialRequirementDto.builder()
                .id(req.getId())
                .projectId(req.getProject().getId())
                .inventoryItemId(req.getInventoryItem() != null ? req.getInventoryItem().getId() : null)
                .itemCode(req.getInventoryItem() != null ? req.getInventoryItem().getItemCode() : null)
                .materialName(req.getMaterialName())
                .serviceName(req.getServiceName())
                .requiredQuantity(req.getRequiredQuantity())
                .unit(req.getUnit())
                .reservedQuantity(req.getReservedQuantity())
                .issuedQuantity(req.getIssuedQuantity())
                .availableInStock(avail)
                .status(req.getStatus())
                .notes(req.getNotes())
                .build();
    }
}
