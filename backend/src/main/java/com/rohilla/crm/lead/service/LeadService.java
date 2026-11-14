package com.rohilla.crm.lead.service;

import com.rohilla.crm.audit.service.AuditService;
import com.rohilla.crm.client.entity.Client;
import com.rohilla.crm.client.repository.ClientRepository;
import com.rohilla.crm.common.exception.InvalidRequestException;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.util.PhoneUtils;
import com.rohilla.crm.design.entity.DesignFile;
import com.rohilla.crm.design.repository.DesignFileRepository;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.lead.entity.Lead;
import com.rohilla.crm.lead.repository.LeadRepository;
import com.rohilla.crm.notification.entity.Notification;
import com.rohilla.crm.notification.service.NotificationService;
import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.project.repository.ProjectRepository;
import com.rohilla.crm.project.service.ProjectService;


import com.rohilla.crm.audit.enums.AuditAction;
import com.rohilla.crm.lead.enums.LeadStatus;
import com.rohilla.crm.common.enums.Priority;
import com.rohilla.crm.project.enums.ProjectStatus;
import com.rohilla.crm.security.enums.RoleType;
import com.rohilla.crm.lead.dto.CustomerEnquiryRequest;
import com.rohilla.crm.lead.dto.LeadResponseDto;
import com.rohilla.crm.project.dto.ProjectResponseDto;
import com.rohilla.crm.lead.dto.UpdateLeadStatusRequest;
import com.rohilla.crm.common.exception.InvalidRequestException;
import com.rohilla.crm.common.exception.ResourceNotFoundException;

import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.security.authorization.SecurityUtils;
import com.rohilla.crm.common.util.PhoneUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final ProjectRepository projectRepository;
    private final ClientRepository clientRepository;
    private final DesignFileRepository designFileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final ProjectService projectService;

    private static final AtomicLong LEAD_SEQUENCE = new AtomicLong(100);
    private static final AtomicLong PROJECT_SEQUENCE = new AtomicLong(100);

    @Transactional
    public LeadResponseDto submitEnquiry(CustomerEnquiryRequest request) {
        // Strict Indian Phone Validation (10 digits)
        if (!PhoneUtils.isValid10DigitPhone(request.getPhone())) {
            throw new InvalidRequestException("Invalid Indian mobile number. Must contain exactly 10 digits (e.g. 9810001111).");
        }

        String cleanedPhone = PhoneUtils.cleanPhoneNumber(request.getPhone());
        String leadCode = generateUniqueLeadCode();

        Lead lead = Lead.builder()
                .leadCode(leadCode)
                .customerName(request.getName().trim())
                .phone(cleanedPhone)
                .email(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null)
                .companyName(request.getCompany() != null && !request.getCompany().isBlank() ? request.getCompany().trim() : null)
                .requirement(request.getRequirement().trim())
                .productService(request.getProductService().trim())
                .quantity(request.getQuantity())
                .size(request.getSize().trim())
                .location(request.getLocation().trim())
                .designRequired(Boolean.TRUE.equals(request.getDesignRequired()))
                .designFileStorageKey(request.getDesignFileStorageKey())
                .designFileName(request.getDesignFileName())
                .notes(request.getNotes() != null ? request.getNotes().trim() : null)
                .status(LeadStatus.NEW_LEAD)
                .build();

        Lead savedLead = leadRepository.save(lead);
        log.info("New customer lead submitted: {} by {} ({})", leadCode, savedLead.getCustomerName(), savedLead.getPhone());

        // Notify Managers & Admins in Internal CRM
        notifyManagersOfNewLead(savedLead);

        return mapToDto(savedLead);
    }

    @Transactional(readOnly = true)
    public List<LeadResponseDto> getAllLeads(LeadStatus status, String query) {
        List<Lead> leads;
        if (query != null && !query.isBlank()) {
            leads = leadRepository.searchLeads(query.trim());
        } else if (status != null) {
            leads = leadRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            leads = leadRepository.findAllByOrderByCreatedAtDesc();
        }

        return leads.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LeadResponseDto getLeadById(UUID leadId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found: " + leadId));
        return mapToDto(lead);
    }

    @Transactional
    public LeadResponseDto updateLeadStatus(UUID leadId, UpdateLeadStatusRequest request) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found: " + leadId));

        if (request.getStatus() == LeadStatus.CONVERTED) {
            if (lead.getStatus() != LeadStatus.CONVERTED && lead.getConvertedProject() == null) {
                convertLeadToProject(leadId, null);
                lead = leadRepository.findById(leadId)
                        .orElseThrow(() -> new ResourceNotFoundException("Lead not found: " + leadId));
            }
        } else {
            lead.setStatus(request.getStatus());
        }

        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            String existingNotes = lead.getNotes() != null ? lead.getNotes() + "\n" : "";
            lead.setNotes(existingNotes + "[Status updated to " + request.getStatus() + "]: " + request.getNotes());
        }

        Lead saved = leadRepository.save(lead);
        log.info("Lead {} status updated to {}", lead.getLeadCode(), request.getStatus());
        return mapToDto(saved);
    }

    @Transactional
    public ProjectResponseDto convertLeadToProject(UUID leadId, UUID managerUserId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found: " + leadId));

        // 1. Duplicate conversion protection
        if (lead.getStatus() == LeadStatus.CONVERTED || lead.getConvertedProject() != null) {
            String existingCode = lead.getConvertedProject() != null ? lead.getConvertedProject().getProjectCode() : "";
            throw new InvalidRequestException("Lead " + lead.getLeadCode() + " has already been converted to project " + existingCode);
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
        if (creator == null && lead.getAssignedManager() != null) {
            creator = lead.getAssignedManager();
        }
        if (creator == null) {
            creator = userRepository.findByEmail("manager@rohilla.com")
                    .orElseGet(() -> userRepository.findAll().stream().findFirst()
                            .orElseThrow(() -> new ResourceNotFoundException("No valid creator user found")));
        }

        // 3. Find existing Client by phone, or create new Client
        String cleanedPhone = PhoneUtils.cleanPhoneNumber(lead.getPhone());
        Client client = clientRepository.findFirstByPhone(cleanedPhone).orElse(null);

        if (client == null) {
            String companyName = (lead.getCompanyName() != null && !lead.getCompanyName().isBlank())
                    ? lead.getCompanyName().trim()
                    : lead.getCustomerName().trim();
            String address = (lead.getLocation() != null && !lead.getLocation().isBlank())
                    ? lead.getLocation().trim()
                    : "Address from Lead " + lead.getLeadCode();

            client = Client.builder()
                    .companyName(companyName)
                    .contactPerson(lead.getCustomerName().trim())
                    .phone(cleanedPhone)
                    .email(lead.getEmail() != null && !lead.getEmail().isBlank() ? lead.getEmail().trim() : null)
                    .address(address)
                    .build();
            client = clientRepository.save(client);
            log.info("Created new client {} for lead conversion {}", client.getCompanyName(), lead.getLeadCode());
        }

        // 4. Determine Workflow Path:
        // Design Assistance NO (designRequired == false) -> Path A (customerProvidedDesign = true)
        // Design Assistance YES (designRequired == true) -> Path B (customerProvidedDesign = false)
        boolean customerProvidedDesign = !lead.isDesignRequired();

        // 5. Generate unique Project Code (e.g. PRJ-2026-0101)
        String projectCode = generateUniqueProjectCode();

        // 6. Build Project Title & Description
        String projectTitle = lead.getProductService() + " - " + (lead.getCompanyName() != null && !lead.getCompanyName().isBlank() ? lead.getCompanyName().trim() : lead.getCustomerName().trim());
        String projectDescription = String.format("Requirement: %s | Qty: %d | Size: %s | Location: %s [Converted from Lead %s]",
                lead.getRequirement(), lead.getQuantity(), lead.getSize(), lead.getLocation(), lead.getLeadCode());

        // 7. Instantiate and save Project
        Project project = Project.builder()
                .projectCode(projectCode)
                .title(projectTitle)
                .description(projectDescription)
                .client(client)
                .status(ProjectStatus.MANAGER_REVIEW) // Valid starting point for workflow pipeline
                .priority(Priority.MEDIUM)
                .customerProvidedDesign(customerProvidedDesign)
                .installationRequired(true)
                .createdBy(creator)
                .lead(lead)
                .build();

        Project savedProject = projectRepository.save(project);
        log.info("Project {} created from Lead {} (Path: {})", projectCode, lead.getLeadCode(), customerProvidedDesign ? "Path A" : "Path B");

        // 8. If lead has artwork uploaded, create DesignFile version 1
        if (lead.getDesignFileStorageKey() != null && !lead.getDesignFileStorageKey().isBlank()) {
            DesignFile designFile = DesignFile.builder()
                    .project(savedProject)
                    .originalFileName(lead.getDesignFileName() != null ? lead.getDesignFileName() : "Lead_Artwork.pdf")
                    .storageKey(lead.getDesignFileStorageKey())
                    .fileSizeBytes(1024L)
                    .mimeType("application/pdf")
                    .versionNumber(1)
                    .uploadedBy(creator)
                    .build();
            designFileRepository.save(designFile);
        }

        // 9. Update Lead
        lead.setStatus(LeadStatus.CONVERTED);
        lead.setConvertedProject(savedProject);
        String existingNotes = lead.getNotes() != null ? lead.getNotes() + "\n" : "";
        lead.setNotes(existingNotes + String.format("[Lead Converted to Job/Project]: Project %s (%s) created.",
                savedProject.getProjectCode(), customerProvidedDesign ? "Path A" : "Path B"));
        leadRepository.save(lead);

        // 10. Audit Log
        auditService.publishAudit(
                creator.getId(),
                creator.getEmail(),
                creator.getRoles().iterator().hasNext() ? creator.getRoles().iterator().next().getName().name() : "ROLE_MANAGER",
                AuditAction.PROJECT_CREATED,
                "PROJECT",
                savedProject.getId().toString(),
                null,
                String.format("Converted lead %s to project %s (%s) for client %s",
                        lead.getLeadCode(), savedProject.getProjectCode(), customerProvidedDesign ? "Path A" : "Path B", client.getCompanyName()),
                null,
                null
        );

        // 11. Internal CRM Notification to Managers & Admins
        notifyManagersOfLeadConversion(lead, savedProject);

        return projectService.mapToResponseDto(savedProject, true);
    }

    private synchronized String generateUniqueProjectCode() {
        int currentYear = Year.now().getValue();
        String code;
        do {
            long count = projectRepository.count() + PROJECT_SEQUENCE.incrementAndGet();
            code = String.format("PRJ-%d-%03d", currentYear, count % 1000);
        } while (projectRepository.findByProjectCode(code).isPresent());
        return code;
    }

    private synchronized String generateUniqueLeadCode() {
        int currentYear = Year.now().getValue();
        long count = leadRepository.count() + LEAD_SEQUENCE.incrementAndGet();
        return String.format("LEAD-%d-%04d", currentYear, count % 10000);
    }

    private void notifyManagersOfNewLead(Lead lead) {
        try {
            List<User> managersAndAdmins = userRepository.findAll().stream()
                    .filter(u -> u.getRoles().stream().anyMatch(r ->
                            r.getName() == RoleType.ROLE_MANAGER || r.getName() == RoleType.ROLE_ADMIN))
                    .collect(Collectors.toList());

            for (User user : managersAndAdmins) {
                notificationService.sendNotification(
                        user,
                        "New Website Lead: " + lead.getLeadCode(),
                        String.format("Customer %s submitted enquiry for %s (Qty: %d, Location: %s)",
                                lead.getCustomerName(), lead.getProductService(), lead.getQuantity(), lead.getLocation()),
                        "/leads"
                );
            }
        } catch (Exception e) {
            log.warn("Could not dispatch lead notification to managers: {}", e.getMessage());
        }
    }

    private void notifyManagersOfLeadConversion(Lead lead, Project project) {
        try {
            List<User> managersAndAdmins = userRepository.findAll().stream()
                    .filter(u -> u.getRoles().stream().anyMatch(r ->
                            r.getName() == RoleType.ROLE_MANAGER || r.getName() == RoleType.ROLE_ADMIN))
                    .collect(Collectors.toList());

            for (User user : managersAndAdmins) {
                notificationService.sendNotification(
                        user,
                        "Lead Converted: " + project.getProjectCode(),
                        String.format("Lead %s for %s was converted to project %s (Status: %s)",
                                lead.getLeadCode(), lead.getCustomerName(), project.getProjectCode(), project.getStatus()),
                        "/projects/" + project.getId()
                );
            }
        } catch (Exception e) {
            log.warn("Could not dispatch conversion notification: {}", e.getMessage());
        }
    }

    public LeadResponseDto mapToDto(Lead lead) {
        return LeadResponseDto.builder()
                .id(lead.getId())
                .leadCode(lead.getLeadCode())
                .customerName(lead.getCustomerName())
                .phone(lead.getPhone())
                .email(lead.getEmail())
                .companyName(lead.getCompanyName())
                .requirement(lead.getRequirement())
                .productService(lead.getProductService())
                .quantity(lead.getQuantity())
                .size(lead.getSize())
                .location(lead.getLocation())
                .designRequired(lead.isDesignRequired())
                .designFileStorageKey(lead.getDesignFileStorageKey())
                .designFileName(lead.getDesignFileName())
                .notes(lead.getNotes())
                .status(lead.getStatus())
                .convertedProjectId(lead.getConvertedProject() != null ? lead.getConvertedProject().getId() : null)
                .convertedProjectCode(lead.getConvertedProject() != null ? lead.getConvertedProject().getProjectCode() : null)
                .assignedManagerName(lead.getAssignedManager() != null ? lead.getAssignedManager().getFullName() : null)
                .createdAt(lead.getCreatedAt())
                .updatedAt(lead.getUpdatedAt())
                .build();
    }
}
