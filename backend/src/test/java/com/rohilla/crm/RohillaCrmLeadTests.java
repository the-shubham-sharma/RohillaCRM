package com.rohilla.crm;

import com.rohilla.crm.client.entity.Client;
import com.rohilla.crm.client.repository.ClientRepository;
import com.rohilla.crm.common.exception.FileValidationException;
import com.rohilla.crm.common.exception.InvalidRequestException;
import com.rohilla.crm.common.util.PhoneUtils;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.lead.entity.Lead;
import com.rohilla.crm.project.dto.ProjectResponseDto;
import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.project.enums.ProjectStatus;
import com.rohilla.crm.project.repository.ProjectRepository;
import com.rohilla.crm.project.service.ProjectService;
import com.rohilla.crm.project.workflow.WorkflowTransitionService;
import com.rohilla.crm.security.authentication.CustomUserDetails;

import com.rohilla.crm.lead.enums.LeadStatus;
import com.rohilla.crm.lead.dto.CustomerEnquiryRequest;
import com.rohilla.crm.lead.dto.LeadResponseDto;
import com.rohilla.crm.lead.dto.UpdateLeadStatusRequest;
import com.rohilla.crm.common.exception.FileValidationException;
import com.rohilla.crm.common.exception.InvalidRequestException;
import com.rohilla.crm.lead.repository.LeadRepository;
import com.rohilla.crm.file.service.FileStorageService;
import com.rohilla.crm.lead.service.LeadService;
import com.rohilla.crm.common.util.PhoneUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class RohillaCrmLeadTests {

    @Autowired
    private LeadService leadService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private LeadRepository leadRepository;

    @Test
    @DisplayName("Phone Validation: Strictly enforces 10-digit Indian mobile numbers")
    void testIndianPhoneValidation() {
        assertTrue(PhoneUtils.isValid10DigitPhone("9810001111"));
        assertTrue(PhoneUtils.isValid10DigitPhone("+91-9810001111"));
        assertTrue(PhoneUtils.isValid10DigitPhone("09810001111"));
        assertTrue(PhoneUtils.isValid10DigitPhone("+91 98100 01111"));

        assertFalse(PhoneUtils.isValid10DigitPhone("981000111"));    // 9 digits
        assertFalse(PhoneUtils.isValid10DigitPhone("98100011111"));  // 11 digits
        assertFalse(PhoneUtils.isValid10DigitPhone("98ABC01111"));   // letters
        assertFalse(PhoneUtils.isValid10DigitPhone(null));
    }

    @Test
    @DisplayName("Public Lead Submission: Creates NEW LEAD with unique code LEAD-2026-XXXX")
    void testSubmitEnquirySuccess() {
        CustomerEnquiryRequest request = CustomerEnquiryRequest.builder()
                .name("Karan Singhania")
                .phone("9812345678")
                .email("karan@singhania.com")
                .company("Singhania Retail")
                .requirement("Outdoor Flex Banners and Backlit Glow Signage")
                .productService("Outdoor Advertising")
                .quantity(3)
                .size("15x8 ft")
                .location("Golf Course Road, Gurugram")
                .designRequired(false)
                .notes("Need prompt quotation")
                .build();

        LeadResponseDto response = leadService.submitEnquiry(request);

        assertNotNull(response);
        assertNotNull(response.getId());
        assertTrue(response.getLeadCode().startsWith("LEAD-2026-"));
        assertEquals("Karan Singhania", response.getCustomerName());
        assertEquals("9812345678", response.getPhone());
        assertEquals(LeadStatus.NEW_LEAD, response.getStatus());

        // Verify in database
        assertTrue(leadRepository.findByLeadCode(response.getLeadCode()).isPresent());
    }

    @Test
    @DisplayName("Public Lead Submission: Rejects invalid phone numbers")
    void testSubmitEnquiryInvalidPhone() {
        CustomerEnquiryRequest request = CustomerEnquiryRequest.builder()
                .name("Invalid Phone User")
                .phone("12345") // Invalid phone
                .requirement("Signage")
                .productService("Signage")
                .quantity(1)
                .size("5x3 ft")
                .location("Delhi")
                .build();

        assertThrows(InvalidRequestException.class, () -> leadService.submitEnquiry(request));
    }

    @Test
    @DisplayName("Manager Lead Management: Can view and update lead status")
    void testManagerLeadManagement() {
        CustomerEnquiryRequest request = CustomerEnquiryRequest.builder()
                .name("Simran Kaur")
                .phone("9876501234")
                .requirement("Rollup Standees for exhibition")
                .productService("Standee")
                .quantity(10)
                .size("3x6 ft")
                .location("Pragati Maidan, New Delhi")
                .build();

        LeadResponseDto created = leadService.submitEnquiry(request);

        // List leads
        List<LeadResponseDto> allLeads = leadService.getAllLeads(null, null);
        assertFalse(allLeads.isEmpty());

        // Update status to CONTACTED
        UpdateLeadStatusRequest updateReq = UpdateLeadStatusRequest.builder()
                .status(LeadStatus.CONTACTED)
                .notes("Spoke with client, sending catalog")
                .build();

        LeadResponseDto updated = leadService.updateLeadStatus(created.getId(), updateReq);
        assertEquals(LeadStatus.CONTACTED, updated.getStatus());
        assertTrue(updated.getNotes().contains("Spoke with client"));
    }

    @Test
    @DisplayName("Public Customer Upload: Accepts valid artworks and rejects malicious/unauthorized files")
    void testPublicCustomerFileUploadSecurity() {
        // 1. Valid PDF file
        MockMultipartFile validPdf = new MockMultipartFile(
                "file",
                "customer_artwork.pdf",
                "application/pdf",
                "%PDF-1.4 valid pdf content for banner printing".getBytes()
        );
        String storageKey = fileStorageService.storePublicCustomerFile(validPdf);
        assertNotNull(storageKey);
        assertTrue(storageKey.startsWith("customer_uploads/"));

        // 2. Disallowed extension (.exe)
        MockMultipartFile exeFile = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/x-msdownload",
                "MZ executable content".getBytes()
        );
        assertThrows(FileValidationException.class, () -> fileStorageService.storePublicCustomerFile(exeFile));

        // 3. Disallowed script extension (.sh)
        MockMultipartFile shFile = new MockMultipartFile(
                "file",
                "script.sh",
                "application/x-sh",
                "#!/bin/bash echo hello".getBytes()
        );
        assertThrows(FileValidationException.class, () -> fileStorageService.storePublicCustomerFile(shFile));

        // 4. Empty file
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);
        assertThrows(FileValidationException.class, () -> fileStorageService.storePublicCustomerFile(emptyFile));
    }

    @Autowired
    private com.rohilla.crm.project.service.ProjectService projectService;

    @Autowired
    private com.rohilla.crm.project.workflow.WorkflowTransitionService workflowTransitionService;

    @Autowired
    private com.rohilla.crm.project.repository.ProjectRepository projectRepository;

    @Autowired
    private com.rohilla.crm.client.repository.ClientRepository clientRepository;

    @Autowired
    private com.rohilla.crm.employee.repository.UserRepository userRepository;

    @Test
    @DisplayName("Phone Normalization: Handles +91, 91, 0, whitespace, and hyphens properly")
    void testPhoneNormalizationDetails() {
        assertEquals("9810001111", PhoneUtils.cleanPhoneNumber("+91-9810001111"));
        assertEquals("9810001111", PhoneUtils.cleanPhoneNumber("91 9810001111"));
        assertEquals("9810001111", PhoneUtils.cleanPhoneNumber("09810001111"));
        assertEquals("9810001111", PhoneUtils.cleanPhoneNumber("(9810001111)"));
        assertEquals("+919810001111", PhoneUtils.toWhatsAppFormat("9810001111"));
    }

    @Test
    @DisplayName("Lead Conversion: Design Assistance NO -> Creates Path A Project in MANAGER_REVIEW visible in Project Pipeline")
    void testLeadConversionCreatesPipelineVisibleProject_PathA() {
        CustomerEnquiryRequest request = CustomerEnquiryRequest.builder()
                .name("Test Customer")
                .phone("9810001111")
                .email("test@customer.com")
                .company("Test Co")
                .productService("LED Signage")
                .quantity(1)
                .size("10x4")
                .location("Dehradun")
                .requirement("Test Lead to Project conversion")
                .designRequired(false) // Design Assistance = NO -> Path A
                .build();

        LeadResponseDto submitted = leadService.submitEnquiry(request);
        assertEquals(LeadStatus.NEW_LEAD, submitted.getStatus());

        // Authenticate as Manager for pipeline queries
        com.rohilla.crm.employee.entity.User manager = userRepository.findByEmail("manager@rohilla.com").orElseThrow();
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        new com.rohilla.crm.security.authentication.CustomUserDetails(manager),
                        null,
                        List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_MANAGER"))
                )
        );

        // Convert Lead to Project
        com.rohilla.crm.project.dto.ProjectResponseDto convertedProject = leadService.convertLeadToProject(submitted.getId(), manager.getId());

        // 1. Verify Project created & linked
        assertNotNull(convertedProject);
        assertNotNull(convertedProject.getId());
        assertTrue(convertedProject.getProjectCode().startsWith("PRJ-2026-"));
        assertEquals(com.rohilla.crm.project.enums.ProjectStatus.MANAGER_REVIEW, convertedProject.getStatus());
        assertTrue(convertedProject.isCustomerProvidedDesign()); // Path A
        assertEquals(submitted.getId(), convertedProject.getLeadId());
        assertEquals(submitted.getLeadCode(), convertedProject.getLeadCode());

        // 2. Verify Lead status updated
        com.rohilla.crm.lead.entity.Lead updatedLead = leadRepository.findById(submitted.getId()).orElseThrow();
        assertEquals(LeadStatus.CONVERTED, updatedLead.getStatus());
        assertNotNull(updatedLead.getConvertedProject());
        assertEquals(convertedProject.getId(), updatedLead.getConvertedProject().getId());

        // 3. Verify Project returned by Manager/Admin Project Pipeline query
        List<com.rohilla.crm.project.dto.ProjectResponseDto> pipelineProjects = projectService.getAllProjects();
        boolean inPipeline = pipelineProjects.stream().anyMatch(p -> p.getId().equals(convertedProject.getId()));
        assertTrue(inPipeline, "Converted Lead Project MUST be returned by the active Project Pipeline query!");
    }

    @Test
    @DisplayName("Lead Conversion: Design Assistance YES -> Creates Path B Project in MANAGER_REVIEW visible in Project Pipeline")
    void testLeadConversionCreatesPipelineVisibleProject_PathB() {
        CustomerEnquiryRequest request = CustomerEnquiryRequest.builder()
                .name("Aarav Patel")
                .phone("9822334455")
                .email("aarav@pateldesigns.in")
                .company("Patel Retail Ventures")
                .productService("Acrylic Letter Signage")
                .quantity(3)
                .size("8x4 ft")
                .location("Sector 18, Noida")
                .requirement("New showroom branding requiring full custom 3D design")
                .designRequired(true) // Design Assistance = YES -> Path B
                .build();

        LeadResponseDto submitted = leadService.submitEnquiry(request);

        com.rohilla.crm.employee.entity.User manager = userRepository.findByEmail("manager@rohilla.com").orElseThrow();
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        new com.rohilla.crm.security.authentication.CustomUserDetails(manager),
                        null,
                        List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_MANAGER"))
                )
        );

        // Convert Lead via status update request to CONVERTED
        UpdateLeadStatusRequest updateReq = UpdateLeadStatusRequest.builder()
                .status(LeadStatus.CONVERTED)
                .notes("Client approved commercial terms, initiating artwork workflow")
                .build();

        LeadResponseDto updated = leadService.updateLeadStatus(submitted.getId(), updateReq);
        assertEquals(LeadStatus.CONVERTED, updated.getStatus());
        assertNotNull(updated.getConvertedProjectId());
        assertNotNull(updated.getConvertedProjectCode());

        // Verify project is Path B
        com.rohilla.crm.project.entity.Project project = projectRepository.findById(updated.getConvertedProjectId()).orElseThrow();
        assertFalse(project.isCustomerProvidedDesign()); // Path B: Design Required
        assertEquals(com.rohilla.crm.project.enums.ProjectStatus.MANAGER_REVIEW, project.getStatus());

        // Verify visible in Pipeline
        List<com.rohilla.crm.project.dto.ProjectResponseDto> pipeline = projectService.getAllProjects();
        assertTrue(pipeline.stream().anyMatch(p -> p.getId().equals(project.getId())));
    }

    @Test
    @DisplayName("Lead Conversion: Duplicate conversion attempts are rejected safely")
    void testDuplicateLeadConversionProtection() {
        CustomerEnquiryRequest request = CustomerEnquiryRequest.builder()
                .name("Neha Gupta")
                .phone("9833445566")
                .productService("Flex Board")
                .quantity(1)
                .size("6x3 ft")
                .location("Delhi")
                .requirement("Flex Board Printing")
                .designRequired(false)
                .build();

        LeadResponseDto submitted = leadService.submitEnquiry(request);

        com.rohilla.crm.employee.entity.User manager = userRepository.findByEmail("manager@rohilla.com").orElseThrow();
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        new com.rohilla.crm.security.authentication.CustomUserDetails(manager),
                        null,
                        List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_MANAGER"))
                )
        );

        // First conversion succeeds
        leadService.convertLeadToProject(submitted.getId(), manager.getId());

        // Second conversion fails safely
        assertThrows(InvalidRequestException.class, () ->
                leadService.convertLeadToProject(submitted.getId(), manager.getId())
        );
    }

    @Test
    @DisplayName("Lead Conversion: Reuses existing client if phone number matches")
    void testClientReuseOnLeadConversion() {
        // Use phone from seeded client Apex Retail Brands Ltd. ("9811007700")
        CustomerEnquiryRequest request = CustomerEnquiryRequest.builder()
                .name("Kavita Rao")
                .phone("9811007700")
                .email("kavita@apexbrands.com")
                .company("Apex Retail Brands Ltd.")
                .productService("Directional Signage")
                .quantity(4)
                .size("4x2 ft")
                .location("Gurugram")
                .requirement("Additional directional signages for new parking wing")
                .designRequired(false)
                .build();

        long clientCountBefore = clientRepository.count();

        LeadResponseDto submitted = leadService.submitEnquiry(request);

        com.rohilla.crm.employee.entity.User manager = userRepository.findByEmail("manager@rohilla.com").orElseThrow();
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        new com.rohilla.crm.security.authentication.CustomUserDetails(manager),
                        null,
                        List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_MANAGER"))
                )
        );

        com.rohilla.crm.project.dto.ProjectResponseDto converted = leadService.convertLeadToProject(submitted.getId(), manager.getId());

        // Client count must not increase (reused existing client)
        assertEquals(clientCountBefore, clientRepository.count());
        assertEquals("Apex Retail Brands Ltd.", converted.getClient().getCompanyName());
    }

    @Test
    @DisplayName("Lead Conversion: Completed Project moves from Active Pipeline to History")
    void testLeadProjectCompletionMovesToHistory() {
        CustomerEnquiryRequest request = CustomerEnquiryRequest.builder()
                .name("Ritu Sen")
                .phone("9844556677")
                .productService("Vinyl Print")
                .quantity(1)
                .size("5x3 ft")
                .location("Delhi")
                .requirement("Short-run vinyl poster print")
                .designRequired(false) // Path A
                .build();

        LeadResponseDto submitted = leadService.submitEnquiry(request);

        com.rohilla.crm.employee.entity.User manager = userRepository.findByEmail("manager@rohilla.com").orElseThrow();
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        new com.rohilla.crm.security.authentication.CustomUserDetails(manager),
                        null,
                        List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_MANAGER"))
                )
        );

        com.rohilla.crm.project.dto.ProjectResponseDto converted = leadService.convertLeadToProject(submitted.getId(), manager.getId());
        final java.util.UUID convertedProjectId = converted.getId();
        com.rohilla.crm.project.entity.Project project = projectRepository.findById(convertedProjectId).orElseThrow();

        // While in MANAGER_REVIEW: in active pipeline, not in history
        assertTrue(projectService.getAllProjects().stream().anyMatch(p -> p.getId().equals(convertedProjectId)));
        assertFalse(projectService.getProjectHistory().stream().anyMatch(p -> p.getId().equals(convertedProjectId)));

        // Advance through Path A workflow to COMPLETED
        project = workflowTransitionService.transitionProjectStatus(project, com.rohilla.crm.project.enums.ProjectStatus.DESIGN_TECHNICAL_CHECK, "Technical check passed");
        project = workflowTransitionService.transitionProjectStatus(project, com.rohilla.crm.project.enums.ProjectStatus.READY_FOR_PRODUCTION, "Approved for print");
        project = workflowTransitionService.transitionProjectStatus(project, com.rohilla.crm.project.enums.ProjectStatus.IN_PRODUCTION, "Started printing");
        project = workflowTransitionService.transitionProjectStatus(project, com.rohilla.crm.project.enums.ProjectStatus.PRODUCTION_COMPLETED, "Printing complete");
        project = workflowTransitionService.transitionProjectStatus(project, com.rohilla.crm.project.enums.ProjectStatus.QC_PENDING, "Sent to QC");
        project = workflowTransitionService.transitionProjectStatus(project, com.rohilla.crm.project.enums.ProjectStatus.QC_PASSED, "QC passed");
        project = workflowTransitionService.transitionProjectStatus(project, com.rohilla.crm.project.enums.ProjectStatus.DISPATCHED, "Delivered");
        project = workflowTransitionService.transitionProjectStatus(project, com.rohilla.crm.project.enums.ProjectStatus.INSTALLATION_COMPLETED, "Installed");
        project = workflowTransitionService.transitionProjectStatus(project, com.rohilla.crm.project.enums.ProjectStatus.COMPLETED, "Job completed");

        // When COMPLETED: disappears from Active Pipeline, appears in History
        assertFalse(projectService.getAllProjects().stream().anyMatch(p -> p.getId().equals(convertedProjectId)));
        assertTrue(projectService.getProjectHistory().stream().anyMatch(p -> p.getId().equals(convertedProjectId)));
    }
}
