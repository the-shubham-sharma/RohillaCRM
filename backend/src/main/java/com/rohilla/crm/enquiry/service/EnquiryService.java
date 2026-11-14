package com.rohilla.crm.enquiry.service;

import com.rohilla.crm.audit.enums.AuditAction;
import com.rohilla.crm.audit.service.AuditService;
import com.rohilla.crm.employee.dto.UserSummaryDto;
import com.rohilla.crm.auth.service.AuthService;
import com.rohilla.crm.client.dto.ClientDto;
import com.rohilla.crm.client.entity.Client;
import com.rohilla.crm.client.repository.ClientRepository;
import com.rohilla.crm.client.service.ClientService;
import com.rohilla.crm.common.enums.Priority;
import com.rohilla.crm.common.exception.InvalidRequestException;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.common.util.PhoneUtils;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.enquiry.dto.*;
import com.rohilla.crm.enquiry.entity.Enquiry;
import com.rohilla.crm.enquiry.entity.EnquiryLineItem;
import com.rohilla.crm.enquiry.enums.*;
import com.rohilla.crm.enquiry.repository.EnquiryLineItemRepository;
import com.rohilla.crm.enquiry.repository.EnquiryRepository;
import com.rohilla.crm.enquiry.util.DimensionCalculator;
import com.rohilla.crm.inventory.entity.InventoryItem;
import com.rohilla.crm.inventory.entity.ProjectMaterialRequirement;
import com.rohilla.crm.inventory.enums.RequirementStatus;
import com.rohilla.crm.inventory.repository.InventoryItemRepository;
import com.rohilla.crm.inventory.repository.ProjectMaterialRequirementRepository;
import com.rohilla.crm.project.dto.ProjectResponseDto;
import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.project.entity.ProjectLineItem;
import com.rohilla.crm.project.enums.ProjectStatus;
import com.rohilla.crm.project.repository.ProjectLineItemRepository;
import com.rohilla.crm.project.repository.ProjectRepository;
import com.rohilla.crm.project.service.ProjectService;
import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.security.authorization.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnquiryService {

    private final EnquiryRepository enquiryRepository;
    private final EnquiryLineItemRepository enquiryLineItemRepository;
    private final ClientRepository clientRepository;
    private final ClientService clientService;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProjectLineItemRepository projectLineItemRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final ProjectMaterialRequirementRepository materialRequirementRepository;
    private final ProjectService projectService;
    private final AuthService authService;
    private final AuditService auditService;

    private static final AtomicLong ENQUIRY_SEQUENCE = new AtomicLong(100);
    private static final AtomicLong PROJECT_SEQUENCE = new AtomicLong(100);

    @Transactional
    public EnquiryResponseDto createOrSaveEnquiry(EnquiryCreateRequest request) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        User recordedBy = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Validate 10-digit Indian phone
        if (!PhoneUtils.isValid10DigitPhone(request.getPhone())) {
            throw new InvalidRequestException("Invalid Indian mobile number. Must contain exactly 10 digits (e.g. 9810001111).");
        }
        String cleanedPhone = PhoneUtils.cleanPhoneNumber(request.getPhone());

        // Validate alternate phone if provided
        String cleanedAltPhone = null;
        if (request.getAlternatePhone() != null && !request.getAlternatePhone().isBlank()) {
            if (!PhoneUtils.isValid10DigitPhone(request.getAlternatePhone())) {
                throw new InvalidRequestException("Invalid alternate mobile number. Must contain exactly 10 digits.");
            }
            cleanedAltPhone = PhoneUtils.cleanPhoneNumber(request.getAlternatePhone());
        }

        // Reuse existing client record by ID or by phone to avoid duplicates
        Client client = null;
        if (request.getClientId() != null) {
            client = clientRepository.findById(request.getClientId()).orElse(null);
        }
        if (client == null) {
            client = clientRepository.findFirstByPhone(cleanedPhone).orElse(null);
        }

        if (client == null) {
            String companyName = (request.getCompanyName() != null && !request.getCompanyName().isBlank())
                    ? request.getCompanyName().trim()
                    : request.getClientName().trim();

            client = Client.builder()
                    .companyName(companyName)
                    .contactPerson(request.getClientName().trim())
                    .phone(cleanedPhone)
                    .email(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null)
                    .address(request.getAddress().trim())
                    .gstNumber(request.getGstNumber() != null && !request.getGstNumber().isBlank() ? request.getGstNumber().trim() : null)
                    .build();
            client = clientRepository.save(client);
            log.info("Created new client {} ({}) from Front Office enquiry", client.getCompanyName(), client.getPhone());
        }

        String enquiryNumber = generateUniqueEnquiryNumber();
        EnquiryStatus initialStatus = request.isDraft() ? EnquiryStatus.DRAFT : EnquiryStatus.SUBMITTED;

        Enquiry enquiry = Enquiry.builder()
                .enquiryNumber(enquiryNumber)
                .enquiryDate(LocalDate.now())
                .client(client)
                .clientName(request.getClientName().trim())
                .companyName(request.getCompanyName() != null ? request.getCompanyName().trim() : client.getCompanyName())
                .phone(cleanedPhone)
                .alternatePhone(cleanedAltPhone)
                .email(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null)
                .address(request.getAddress().trim())
                .gstNumber(request.getGstNumber() != null && !request.getGstNumber().isBlank() ? request.getGstNumber().trim() : null)
                .leadSource(request.getLeadSource() != null ? request.getLeadSource() : LeadSource.WALK_IN)
                .recordedBy(recordedBy)
                .status(initialStatus)
                .priority(request.getPriority() != null ? request.getPriority() : EnquiryPriority.NORMAL)
                .expectedCompletionDate(request.getExpectedCompletionDate())
                .quotationStatus(request.getQuotationStatus() != null ? request.getQuotationStatus() : QuotationStatus.PENDING)
                .estimatedAmount(request.getEstimatedAmount())
                .designStatus(request.getDesignStatus() != null ? request.getDesignStatus() : DesignRequirementStatus.CLIENT_PROVIDED)
                .customerRemarks(request.getCustomerRemarks() != null ? request.getCustomerRemarks().trim() : null)
                .internalRemarks(request.getInternalRemarks() != null ? request.getInternalRemarks().trim() : null)
                .build();

        // Process Line Items with automatic area calculations
        if (request.getLineItems() != null && !request.getLineItems().isEmpty()) {
            for (EnquiryLineItemRequest itemReq : request.getLineItems()) {
                DimensionCalculator.AreaResult areaResult = DimensionCalculator.calculateArea(
                        itemReq.getWidth(),
                        itemReq.getHeight(),
                        itemReq.getDimensionUnit(),
                        itemReq.getPrintSides()
                );

                EnquiryLineItem item = EnquiryLineItem.builder()
                        .serviceName(itemReq.getServiceName())
                        .width(itemReq.getWidth())
                        .height(itemReq.getHeight())
                        .dimensionUnit(itemReq.getDimensionUnit() != null ? itemReq.getDimensionUnit() : DimensionUnit.FEET)
                        .siteMeasurementRequired(itemReq.isSiteMeasurementRequired())
                        .quantity(itemReq.getQuantity() != null && itemReq.getQuantity() > 0 ? itemReq.getQuantity() : 1)
                        .quantityUnit(itemReq.getQuantityUnit() != null ? itemReq.getQuantityUnit() : QuantityUnit.PIECE)
                        .printSides(itemReq.getPrintSides() != null ? itemReq.getPrintSides() : PrintSides.SINGLE_SIDED)
                        .printingType(itemReq.getPrintingType() != null ? itemReq.getPrintingType() : PrintingType.FULL_COLOUR)
                        .areaPerSideSqFt(areaResult.getAreaPerSideSqFt())
                        .totalAreaSqFt(areaResult.getTotalAreaSqFt())
                        .areaPerSideSqM(areaResult.getAreaPerSideSqM())
                        .totalAreaSqM(areaResult.getTotalAreaSqM())
                        .installationRequired(itemReq.isInstallationRequired())
                        .installationLocation(itemReq.getInstallationLocation())
                        .siteInspectionRequired(itemReq.isSiteInspectionRequired())
                        .deliveryDate(itemReq.getDeliveryDate())
                        .designStatus(itemReq.getDesignStatus() != null ? itemReq.getDesignStatus() : DesignRequirementStatus.CLIENT_PROVIDED)
                        .selectedMaterials(itemReq.getSelectedMaterials() != null ? new ArrayList<>(itemReq.getSelectedMaterials()) : new ArrayList<>())
                        .materialConfirmedByManager(itemReq.isMaterialConfirmedByManager())
                        .finishingRequirements(itemReq.getFinishingRequirements() != null ? new ArrayList<>(itemReq.getFinishingRequirements()) : new ArrayList<>())
                        .remarks(itemReq.getRemarks())
                        .build();

                enquiry.addLineItem(item);
            }
        }

        Enquiry saved = enquiryRepository.save(enquiry);
        log.info("Enquiry {} created by {} with {} line items (status: {})",
                saved.getEnquiryNumber(), recordedBy.getFullName(), saved.getLineItems().size(), saved.getStatus());

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<EnquiryResponseDto> getAllEnquiries(EnquiryStatus status, String query) {
        List<Enquiry> list;
        if (query != null && !query.isBlank() && status != null) {
            list = enquiryRepository.searchEnquiriesWithStatus(query.trim(), status);
        } else if (query != null && !query.isBlank()) {
            list = enquiryRepository.searchEnquiries(query.trim());
        } else if (status != null) {
            list = enquiryRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            list = enquiryRepository.findAllByOrderByCreatedAtDesc();
        }

        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EnquiryResponseDto getEnquiryById(UUID enquiryId) {
        Enquiry enquiry = enquiryRepository.findById(enquiryId)
                .orElseThrow(() -> new ResourceNotFoundException("Enquiry not found: " + enquiryId));
        return mapToDto(enquiry);
    }

    @Transactional
    public EnquiryResponseDto updateEnquiry(UUID enquiryId, EnquiryCreateRequest request) {
        Enquiry enquiry = enquiryRepository.findById(enquiryId)
                .orElseThrow(() -> new ResourceNotFoundException("Enquiry not found: " + enquiryId));

        if (enquiry.getStatus() == EnquiryStatus.CONVERTED_TO_PROJECT) {
            throw new InvalidRequestException("Cannot edit enquiry " + enquiry.getEnquiryNumber() + " because it is already converted to a project.");
        }

        if (request.getClientName() != null) enquiry.setClientName(request.getClientName().trim());
        if (request.getCompanyName() != null) enquiry.setCompanyName(request.getCompanyName().trim());
        if (request.getPhone() != null) {
            if (!PhoneUtils.isValid10DigitPhone(request.getPhone())) {
                throw new InvalidRequestException("Invalid Indian mobile number. Must contain exactly 10 digits.");
            }
            enquiry.setPhone(PhoneUtils.cleanPhoneNumber(request.getPhone()));
        }
        if (request.getAlternatePhone() != null && !request.getAlternatePhone().isBlank()) {
            if (!PhoneUtils.isValid10DigitPhone(request.getAlternatePhone())) {
                throw new InvalidRequestException("Invalid alternate mobile number. Must contain exactly 10 digits.");
            }
            enquiry.setAlternatePhone(PhoneUtils.cleanPhoneNumber(request.getAlternatePhone()));
        }
        if (request.getEmail() != null) enquiry.setEmail(request.getEmail().trim());
        if (request.getAddress() != null) enquiry.setAddress(request.getAddress().trim());
        if (request.getGstNumber() != null) enquiry.setGstNumber(request.getGstNumber().trim());
        if (request.getLeadSource() != null) enquiry.setLeadSource(request.getLeadSource());
        if (request.getPriority() != null) enquiry.setPriority(request.getPriority());
        if (request.getExpectedCompletionDate() != null) enquiry.setExpectedCompletionDate(request.getExpectedCompletionDate());
        if (request.getQuotationStatus() != null) enquiry.setQuotationStatus(request.getQuotationStatus());
        if (request.getEstimatedAmount() != null) enquiry.setEstimatedAmount(request.getEstimatedAmount());
        if (request.getDesignStatus() != null) enquiry.setDesignStatus(request.getDesignStatus());
        if (request.getCustomerRemarks() != null) enquiry.setCustomerRemarks(request.getCustomerRemarks().trim());
        if (request.getInternalRemarks() != null) enquiry.setInternalRemarks(request.getInternalRemarks().trim());

        if (request.isDraft()) {
            enquiry.setStatus(EnquiryStatus.DRAFT);
        } else if (enquiry.getStatus() == EnquiryStatus.DRAFT) {
            enquiry.setStatus(EnquiryStatus.SUBMITTED);
        }

        // Replace Line Items if provided
        if (request.getLineItems() != null) {
            enquiry.getLineItems().clear();
            for (EnquiryLineItemRequest itemReq : request.getLineItems()) {
                DimensionCalculator.AreaResult areaResult = DimensionCalculator.calculateArea(
                        itemReq.getWidth(),
                        itemReq.getHeight(),
                        itemReq.getDimensionUnit(),
                        itemReq.getPrintSides()
                );

                EnquiryLineItem item = EnquiryLineItem.builder()
                        .serviceName(itemReq.getServiceName())
                        .width(itemReq.getWidth())
                        .height(itemReq.getHeight())
                        .dimensionUnit(itemReq.getDimensionUnit() != null ? itemReq.getDimensionUnit() : DimensionUnit.FEET)
                        .siteMeasurementRequired(itemReq.isSiteMeasurementRequired())
                        .quantity(itemReq.getQuantity() != null && itemReq.getQuantity() > 0 ? itemReq.getQuantity() : 1)
                        .quantityUnit(itemReq.getQuantityUnit() != null ? itemReq.getQuantityUnit() : QuantityUnit.PIECE)
                        .printSides(itemReq.getPrintSides() != null ? itemReq.getPrintSides() : PrintSides.SINGLE_SIDED)
                        .printingType(itemReq.getPrintingType() != null ? itemReq.getPrintingType() : PrintingType.FULL_COLOUR)
                        .areaPerSideSqFt(areaResult.getAreaPerSideSqFt())
                        .totalAreaSqFt(areaResult.getTotalAreaSqFt())
                        .areaPerSideSqM(areaResult.getAreaPerSideSqM())
                        .totalAreaSqM(areaResult.getTotalAreaSqM())
                        .installationRequired(itemReq.isInstallationRequired())
                        .installationLocation(itemReq.getInstallationLocation())
                        .siteInspectionRequired(itemReq.isSiteInspectionRequired())
                        .deliveryDate(itemReq.getDeliveryDate())
                        .designStatus(itemReq.getDesignStatus() != null ? itemReq.getDesignStatus() : DesignRequirementStatus.CLIENT_PROVIDED)
                        .selectedMaterials(itemReq.getSelectedMaterials() != null ? new ArrayList<>(itemReq.getSelectedMaterials()) : new ArrayList<>())
                        .materialConfirmedByManager(itemReq.isMaterialConfirmedByManager())
                        .finishingRequirements(itemReq.getFinishingRequirements() != null ? new ArrayList<>(itemReq.getFinishingRequirements()) : new ArrayList<>())
                        .remarks(itemReq.getRemarks())
                        .build();

                enquiry.addLineItem(item);
            }
        }

        Enquiry saved = enquiryRepository.save(enquiry);
        log.info("Enquiry {} updated", saved.getEnquiryNumber());
        return mapToDto(saved);
    }

    @Transactional
    public ProjectResponseDto convertEnquiryToProject(UUID enquiryId, UUID managerUserId) {
        Enquiry enquiry = enquiryRepository.findById(enquiryId)
                .orElseThrow(() -> new ResourceNotFoundException("Enquiry not found: " + enquiryId));

        // 1. Strict Duplicate conversion protection
        if (enquiry.getStatus() == EnquiryStatus.CONVERTED_TO_PROJECT || enquiry.getConvertedProject() != null) {
            String existingCode = enquiry.getConvertedProject() != null ? enquiry.getConvertedProject().getProjectCode() : "";
            throw new InvalidRequestException("Enquiry " + enquiry.getEnquiryNumber() + " has already been converted to project " + existingCode);
        }

        // 2. Identify/Resolve Creator (Manager/Admin)
        User creator = null;
        if (managerUserId != null) {
            creator = userRepository.findById(managerUserId).orElse(null);
        }
        if (creator == null) {
            CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails().orElse(null);
            if (currentUser != null) {
                creator = userRepository.findById(currentUser.getId()).orElse(null);
            }
        }
        if (creator == null) {
            creator = userRepository.findByEmail("manager@rohilla.com")
                    .orElseGet(() -> userRepository.findAll().stream().findFirst()
                            .orElseThrow(() -> new ResourceNotFoundException("No valid creator user found")));
        }

        // 3. Resolve / Reuse Client
        Client client = enquiry.getClient();
        if (client == null) {
            String cleanedPhone = PhoneUtils.cleanPhoneNumber(enquiry.getPhone());
            client = clientRepository.findFirstByPhone(cleanedPhone).orElse(null);
            if (client == null) {
                client = Client.builder()
                        .companyName(enquiry.getCompanyName() != null ? enquiry.getCompanyName() : enquiry.getClientName())
                        .contactPerson(enquiry.getClientName())
                        .phone(cleanedPhone)
                        .email(enquiry.getEmail())
                        .address(enquiry.getAddress())
                        .gstNumber(enquiry.getGstNumber())
                        .build();
                client = clientRepository.save(client);
            }
            enquiry.setClient(client);
        }

        // 4. Determine Workflow Path:
        // Client Provided final artwork -> Path A (customerProvidedDesign = true)
        // Design required / modification / pending approval -> Path B (customerProvidedDesign = false)
        boolean customerProvidedDesign = (enquiry.getDesignStatus() == DesignRequirementStatus.CLIENT_PROVIDED);

        // 5. Generate unique Project Code
        String projectCode = generateUniqueProjectCode();

        // 6. Build Project Title & Description
        String servicesSummary = enquiry.getLineItems().stream()
                .map(EnquiryLineItem::getServiceName)
                .distinct()
                .collect(Collectors.joining(", "));
        if (servicesSummary.isBlank()) {
            servicesSummary = "Commercial Advertising Project";
        }
        String projectTitle = servicesSummary + " - " + (enquiry.getCompanyName() != null ? enquiry.getCompanyName() : enquiry.getClientName());
        String projectDescription = String.format("Converted from Front Office Enquiry %s. Client: %s (%s). Notes: %s",
                enquiry.getEnquiryNumber(), enquiry.getClientName(), enquiry.getPhone(),
                enquiry.getCustomerRemarks() != null ? enquiry.getCustomerRemarks() : "None");

        // Any line item requiring installation?
        boolean anyInstallation = enquiry.getLineItems().stream().anyMatch(EnquiryLineItem::isInstallationRequired);

        // Map priority
        Priority projPriority = switch (enquiry.getPriority()) {
            case EMERGENCY -> Priority.URGENT;
            case URGENT -> Priority.HIGH;
            case NORMAL -> Priority.MEDIUM;
        };

        // 7. Instantiate and save Project
        Project project = Project.builder()
                .projectCode(projectCode)
                .title(projectTitle)
                .description(projectDescription)
                .client(client)
                .status(ProjectStatus.MANAGER_REVIEW) // Clean starting state for project workflow
                .priority(projPriority)
                .customerProvidedDesign(customerProvidedDesign)
                .installationRequired(anyInstallation)
                .dueDate(enquiry.getExpectedCompletionDate())
                .budget(enquiry.getEstimatedAmount())
                .createdBy(creator)
                .enquiry(enquiry)
                .build();

        Project savedProject = projectRepository.save(project);

        // 8. Copy EnquiryLineItems to ProjectLineItems
        for (EnquiryLineItem item : enquiry.getLineItems()) {
            ProjectLineItem pli = ProjectLineItem.builder()
                    .project(savedProject)
                    .serviceName(item.getServiceName())
                    .width(item.getWidth())
                    .height(item.getHeight())
                    .dimensionUnit(item.getDimensionUnit())
                    .siteMeasurementRequired(item.isSiteMeasurementRequired())
                    .quantity(item.getQuantity())
                    .quantityUnit(item.getQuantityUnit())
                    .printSides(item.getPrintSides())
                    .printingType(item.getPrintingType())
                    .areaPerSideSqFt(item.getAreaPerSideSqFt())
                    .totalAreaSqFt(item.getTotalAreaSqFt())
                    .areaPerSideSqM(item.getAreaPerSideSqM())
                    .totalAreaSqM(item.getTotalAreaSqM())
                    .installationRequired(item.isInstallationRequired())
                    .installationLocation(item.getInstallationLocation())
                    .siteInspectionRequired(item.isSiteInspectionRequired())
                    .deliveryDate(item.getDeliveryDate())
                    .designStatus(item.getDesignStatus())
                    .selectedMaterials(new ArrayList<>(item.getSelectedMaterials()))
                    .materialConfirmedByManager(item.isMaterialConfirmedByManager())
                    .finishingRequirements(new ArrayList<>(item.getFinishingRequirements()))
                    .remarks(item.getRemarks())
                    .build();
            projectLineItemRepository.save(pli);

            // 9. Create ProjectMaterialRequirement records for Inventory Tracking
            for (String materialName : item.getSelectedMaterials()) {
                if (materialName != null && !materialName.isBlank() && !materialName.contains("to be confirmed")) {
                    InventoryItem matchedStock = inventoryItemRepository.findFirstByNameIgnoreCase(materialName.trim()).orElse(null);
                    BigDecimal reqQty = (item.getTotalAreaSqFt() != null && item.getTotalAreaSqFt().compareTo(BigDecimal.ZERO) > 0)
                            ? item.getTotalAreaSqFt()
                            : new BigDecimal(item.getQuantity());

                    ProjectMaterialRequirement pmr = ProjectMaterialRequirement.builder()
                            .project(savedProject)
                            .inventoryItem(matchedStock)
                            .materialName(materialName.trim())
                            .serviceName(item.getServiceName())
                            .requiredQuantity(reqQty)
                            .unit(matchedStock != null ? matchedStock.getUnit() : item.getQuantityUnit().name())
                            .status(RequirementStatus.PENDING)
                            .notes("Generated from enquiry line item: " + item.getServiceName())
                            .build();
                    materialRequirementRepository.save(pmr);
                }
            }
        }

        // 10. Update Enquiry status and link
        enquiry.setStatus(EnquiryStatus.CONVERTED_TO_PROJECT);
        enquiry.setConvertedProject(savedProject);
        String existingNotes = enquiry.getInternalRemarks() != null ? enquiry.getInternalRemarks() + "\n" : "";
        enquiry.setInternalRemarks(existingNotes + String.format("[Converted to Project]: %s (%s) on %s",
                savedProject.getProjectCode(), customerProvidedDesign ? "Path A" : "Path B", LocalDate.now()));
        enquiryRepository.save(enquiry);

        // 11. Audit Logging
        auditService.publishAudit(
                creator.getId(),
                creator.getEmail(),
                creator.getRoles().iterator().next().getName().name(),
                AuditAction.PROJECT_CREATED,
                "PROJECT",
                savedProject.getId().toString(),
                null,
                "Converted Front Office enquiry " + enquiry.getEnquiryNumber() + " to project " + savedProject.getProjectCode(),
                null,
                null
        );

        log.info("Enquiry {} successfully converted to Project {} by {}",
                enquiry.getEnquiryNumber(), savedProject.getProjectCode(), creator.getEmail());

        return projectService.mapToResponseDto(savedProject, true);
    }

    private synchronized String generateUniqueEnquiryNumber() {
        int year = Year.now().getValue();
        long seq = ENQUIRY_SEQUENCE.incrementAndGet();
        String candidate = String.format("ENQ-%d-%04d", year, seq);
        while (enquiryRepository.existsByEnquiryNumber(candidate)) {
            seq = ENQUIRY_SEQUENCE.incrementAndGet();
            candidate = String.format("ENQ-%d-%04d", year, seq);
        }
        return candidate;
    }

    private synchronized String generateUniqueProjectCode() {
        int year = Year.now().getValue();
        long seq = PROJECT_SEQUENCE.incrementAndGet();
        String candidate = String.format("PRJ-%d-%03d", year, seq);
        while (projectRepository.existsByProjectCode(candidate)) {
            seq = PROJECT_SEQUENCE.incrementAndGet();
            candidate = String.format("PRJ-%d-%03d", year, seq);
        }
        return candidate;
    }

    public EnquiryResponseDto mapToDto(Enquiry e) {
        ClientDto clientDto = e.getClient() != null ? clientService.mapToDto(e.getClient(), true) : null;
        UserSummaryDto recordedByDto = e.getRecordedBy() != null ? authService.mapToUserSummary(e.getRecordedBy()) : null;

        List<EnquiryLineItemDto> items = e.getLineItems().stream().map(i -> EnquiryLineItemDto.builder()
                .id(i.getId())
                .serviceName(i.getServiceName())
                .width(i.getWidth())
                .height(i.getHeight())
                .dimensionUnit(i.getDimensionUnit())
                .siteMeasurementRequired(i.isSiteMeasurementRequired())
                .quantity(i.getQuantity())
                .quantityUnit(i.getQuantityUnit())
                .printSides(i.getPrintSides())
                .printingType(i.getPrintingType())
                .areaPerSideSqFt(i.getAreaPerSideSqFt())
                .totalAreaSqFt(i.getTotalAreaSqFt())
                .areaPerSideSqM(i.getAreaPerSideSqM())
                .totalAreaSqM(i.getTotalAreaSqM())
                .installationRequired(i.isInstallationRequired())
                .installationLocation(i.getInstallationLocation())
                .siteInspectionRequired(i.isSiteInspectionRequired())
                .deliveryDate(i.getDeliveryDate())
                .designStatus(i.getDesignStatus())
                .selectedMaterials(new ArrayList<>(i.getSelectedMaterials()))
                .materialConfirmedByManager(i.isMaterialConfirmedByManager())
                .finishingRequirements(new ArrayList<>(i.getFinishingRequirements()))
                .remarks(i.getRemarks())
                .build()
        ).collect(Collectors.toList());

        return EnquiryResponseDto.builder()
                .id(e.getId())
                .enquiryNumber(e.getEnquiryNumber())
                .enquiryDate(e.getEnquiryDate())
                .client(clientDto)
                .clientName(e.getClientName())
                .companyName(e.getCompanyName())
                .phone(e.getPhone())
                .alternatePhone(e.getAlternatePhone())
                .email(e.getEmail())
                .address(e.getAddress())
                .gstNumber(e.getGstNumber())
                .leadSource(e.getLeadSource())
                .recordedBy(recordedByDto)
                .status(e.getStatus())
                .priority(e.getPriority())
                .expectedCompletionDate(e.getExpectedCompletionDate())
                .quotationStatus(e.getQuotationStatus())
                .estimatedAmount(e.getEstimatedAmount())
                .designStatus(e.getDesignStatus())
                .customerRemarks(e.getCustomerRemarks())
                .internalRemarks(e.getInternalRemarks())
                .convertedProjectId(e.getConvertedProject() != null ? e.getConvertedProject().getId() : null)
                .convertedProjectCode(e.getConvertedProject() != null ? e.getConvertedProject().getProjectCode() : null)
                .lineItems(items)
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
