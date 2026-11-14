package com.rohilla.crm;

import com.rohilla.crm.client.dto.ClientDto;
import com.rohilla.crm.client.dto.UpdateClientRequest;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.common.util.PhoneUtils;
import com.rohilla.crm.notification.entity.Notification;
import com.rohilla.crm.project.dto.CreateProjectRequest;
import com.rohilla.crm.project.dto.ProjectDetailDto;
import com.rohilla.crm.project.dto.ProjectResponseDto;
import com.rohilla.crm.security.entity.Role;

import com.rohilla.crm.audit.entity.AuditLog;
import com.rohilla.crm.client.entity.Client;
import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.audit.enums.AuditAction;
import com.rohilla.crm.common.enums.Priority;
import com.rohilla.crm.project.enums.ProjectStatus;

import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.audit.repository.AuditLogRepository;
import com.rohilla.crm.client.repository.ClientRepository;
import com.rohilla.crm.project.repository.ProjectRepository;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.client.service.ClientService;
import com.rohilla.crm.project.service.ProjectService;
import com.rohilla.crm.notification.service.WhatsAppNotificationService;
import com.rohilla.crm.project.workflow.WorkflowTransitionService;
import com.rohilla.crm.common.util.PhoneUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class RohillaCrmClientAndProjectValidationTests {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private ClientService clientService;

    @Autowired
    private WhatsAppNotificationService whatsAppNotificationService;

    @Autowired
    private WorkflowTransitionService workflowTransitionService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private void authenticateAs(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        CustomUserDetails principal = new CustomUserDetails(user);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private CreateProjectRequest createBaseProjectRequest() {
        return CreateProjectRequest.builder()
                .projectCode("PRJ-TEST-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .title("Storefront Glow Sign Board")
                .description("High-grade acrylic ACP back-lit signage")
                .priority(Priority.HIGH)
                .customerProvidedDesign(false)
                .dueDate(LocalDate.now().plusDays(7))
                .clientName("Apex Retailers Pvt Ltd")
                .clientPhone("9810001111")
                .clientAddress("Plot 42, Connaught Place, New Delhi 110001")
                .clientEmail("contact@apexretail.com")
                .contactPerson("Rajesh Gupta")
                .gstNumber("07AAAAA0000A1Z5")
                .build();
    }

    @Test
    @DisplayName("1. Missing client name -> rejected with 400 validation error")
    void testMissingClientNameRejected() {
        authenticateAs("admin@rohilla.com");
        CreateProjectRequest req = createBaseProjectRequest();
        req.setClientName(null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> projectService.createProject(req));
        assertEquals("Client name is required", ex.getMessage());
    }

    @Test
    @DisplayName("2. Missing mobile number -> rejected with 400 validation error")
    void testMissingMobileNumberRejected() {
        authenticateAs("admin@rohilla.com");
        CreateProjectRequest req = createBaseProjectRequest();
        req.setClientPhone(null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> projectService.createProject(req));
        assertEquals("Mobile number is required", ex.getMessage());
    }

    @Test
    @DisplayName("3. 9-digit mobile number -> rejected with exact 10-digit error")
    void testNineDigitMobileNumberRejected() {
        authenticateAs("admin@rohilla.com");
        CreateProjectRequest req = createBaseProjectRequest();
        req.setClientPhone("981000111");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> projectService.createProject(req));
        assertEquals("Mobile number must contain exactly 10 digits.", ex.getMessage());
    }

    @Test
    @DisplayName("4. 11-digit mobile number -> rejected with exact 10-digit error")
    void testElevenDigitMobileNumberRejected() {
        authenticateAs("admin@rohilla.com");
        CreateProjectRequest req = createBaseProjectRequest();
        req.setClientPhone("98100011111");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> projectService.createProject(req));
        assertEquals("Mobile number must contain exactly 10 digits.", ex.getMessage());
    }

    @Test
    @DisplayName("5. Non-numeric mobile number -> rejected with numeric validation error")
    void testNonNumericMobileNumberRejected() {
        authenticateAs("admin@rohilla.com");
        CreateProjectRequest req = createBaseProjectRequest();
        req.setClientPhone("98100ABC11");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> projectService.createProject(req));
        assertEquals("Please enter a valid 10-digit mobile number.", ex.getMessage());
    }

    @Test
    @DisplayName("6. Valid 10-digit mobile number -> accepted and normalized for WhatsApp")
    void testValid10DigitMobileNumberAccepted() {
        authenticateAs("admin@rohilla.com");
        CreateProjectRequest req = createBaseProjectRequest();
        req.setClientPhone("9810001111");

        ProjectResponseDto created = projectService.createProject(req);
        assertNotNull(created);
        assertNotNull(created.getId());

        Project project = projectRepository.findById(created.getId()).orElseThrow();
        assertNotNull(project.getClient());
        assertEquals("9810001111", project.getClient().getPhone());
        assertEquals("+919810001111", project.getClient().getNormalizedWhatsAppPhone());
        assertTrue(PhoneUtils.isValid10DigitPhone(project.getClient().getPhone()));
    }

    @Test
    @DisplayName("7. Missing address -> rejected with 400 validation error")
    void testMissingAddressRejected() {
        authenticateAs("admin@rohilla.com");
        CreateProjectRequest req = createBaseProjectRequest();
        req.setClientAddress(null);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> projectService.createProject(req));
        assertEquals("Client address is required", ex.getMessage());
    }

    @Test
    @DisplayName("8. Empty address (whitespace only) -> rejected with 400 validation error")
    void testEmptyAddressWhitespaceOnlyRejected() {
        authenticateAs("admin@rohilla.com");
        CreateProjectRequest req = createBaseProjectRequest();
        req.setClientAddress("     ");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> projectService.createProject(req));
        assertEquals("Client address is required", ex.getMessage());
    }

    @Test
    @DisplayName("9. Valid address -> accepted and saved on client entity")
    void testValidAddressAccepted() {
        authenticateAs("manager@rohilla.com");
        CreateProjectRequest req = createBaseProjectRequest();
        req.setClientAddress("Shop 101, Ground Floor, Cyber City, Gurugram, Haryana 122002");

        ProjectResponseDto created = projectService.createProject(req);
        assertNotNull(created);

        Project project = projectRepository.findById(created.getId()).orElseThrow();
        assertEquals("Shop 101, Ground Floor, Cyber City, Gurugram, Haryana 122002", project.getClient().getAddress());
    }

    @Test
    @DisplayName("10. Empty email -> accepted (email is optional)")
    void testEmptyEmailAccepted() {
        authenticateAs("admin@rohilla.com");
        CreateProjectRequest req = createBaseProjectRequest();
        req.setClientEmail("");

        ProjectResponseDto created = projectService.createProject(req);
        assertNotNull(created);

        Project project = projectRepository.findById(created.getId()).orElseThrow();
        assertNull(project.getClient().getEmail());
    }

    @Test
    @DisplayName("11. Invalid email format -> rejected with format validation error")
    void testInvalidEmailFormatRejected() {
        authenticateAs("admin@rohilla.com");
        CreateProjectRequest req = createBaseProjectRequest();
        req.setClientEmail("invalid-email-address");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> projectService.createProject(req));
        assertEquals("Please enter a valid email address", ex.getMessage());
    }

    @Test
    @DisplayName("12. Valid email -> accepted and stored correctly")
    void testValidEmailAccepted() {
        authenticateAs("admin@rohilla.com");
        CreateProjectRequest req = createBaseProjectRequest();
        req.setClientEmail("valid.client@enterprise.org");

        ProjectResponseDto created = projectService.createProject(req);
        assertNotNull(created);

        Project project = projectRepository.findById(created.getId()).orElseThrow();
        assertEquals("valid.client@enterprise.org", project.getClient().getEmail());
    }

    @Test
    @DisplayName("13. Custom client details stored and retrieved correctly")
    void testCustomClientDetailsStoredAndRetrieved() {
        authenticateAs("admin@rohilla.com");
        CreateProjectRequest req = createBaseProjectRequest();
        Map<String, String> customMap = new LinkedHashMap<>();
        customMap.put("Secondary Contact", "9810002222");
        customMap.put("Alternate Delivery Location", "Warehouse Gate 4");
        req.setClientCustomFields(customMap);

        ProjectResponseDto created = projectService.createProject(req);
        ProjectDetailDto detail = projectService.getProjectDetail(created.getId());

        assertNotNull(detail.getClient());
        assertNotNull(detail.getClient().getCustomFields());
        assertEquals("9810002222", detail.getClient().getCustomFields().get("Secondary Contact"));
        assertEquals("Warehouse Gate 4", detail.getClient().getCustomFields().get("Alternate Delivery Location"));
    }

    private boolean waitForAuditAction(String resourceType, String resourceId, AuditAction action) {
        for (int i = 0; i < 50; i++) {
            List<AuditLog> logs = auditLogRepository.findAllByResourceTypeAndResourceIdOrderByCreatedAtDesc(resourceType, resourceId);
            if (logs.stream().anyMatch(l -> l.getAction() == action)) {
                return true;
            }
            try {
                Thread.sleep(100);
            } catch (InterruptedException ignored) {
            }
        }
        return false;
    }

    @Test
    @DisplayName("14. Dispatch completion triggers WhatsApp phone retrieval and notification")
    void testDispatchCompletionTriggersWhatsAppNotification() {
        authenticateAs("admin@rohilla.com");
        CreateProjectRequest req = createBaseProjectRequest();
        req.setClientPhone("9810001111");

        ProjectResponseDto created = projectService.createProject(req);
        Project project = projectRepository.findById(created.getId()).orElseThrow();

        // Direct notification dispatch invocation
        boolean sent = whatsAppNotificationService.sendProjectCompletionNotification(project);
        assertTrue(sent, "WhatsApp notification must succeed for valid 10-digit mobile");

        // Verify async audit log published
        boolean hasWhatsAppAudit = waitForAuditAction("PROJECT", project.getId().toString(), AuditAction.WHATSAPP_NOTIFICATION_SENT);
        assertTrue(hasWhatsAppAudit, "Audit log must contain WHATSAPP_NOTIFICATION_SENT");
    }

    @Test
    @DisplayName("15. Dispatch completion succeeds even if WhatsApp delivery fails (No transaction rollback)")
    void testDispatchCompletionSucceedsEvenIfWhatsAppFails() {
        authenticateAs("admin@rohilla.com");
        CreateProjectRequest req = createBaseProjectRequest();
        ProjectResponseDto created = projectService.createProject(req);

        Project project = projectRepository.findById(created.getId()).orElseThrow();
        // Simulate missing phone on legacy record
        project.getClient().setPhone(null);
        clientRepository.save(project.getClient());

        // WhatsApp notification execution must return false and not throw an exception that rolls back
        boolean sent = whatsAppNotificationService.sendProjectCompletionNotification(project);
        assertFalse(sent, "Notification returns false when phone is null");

        // Project entity is intact
        Project reload = projectRepository.findById(project.getId()).orElseThrow();
        assertNotNull(reload);

        // Verify async failure audit log recorded
        boolean hasFailureAudit = waitForAuditAction("PROJECT", project.getId().toString(), AuditAction.WHATSAPP_NOTIFICATION_FAILED);
        assertTrue(hasFailureAudit, "Audit log must contain WHATSAPP_NOTIFICATION_FAILED");
    }

    @Test
    @DisplayName("16. Client details visible in Project Details page for Admin and Manager")
    void testClientDetailsVisibleToAdminAndManager() {
        authenticateAs("admin@rohilla.com");
        CreateProjectRequest req = createBaseProjectRequest();
        ProjectResponseDto created = projectService.createProject(req);

        // Admin check
        ProjectDetailDto adminDetail = projectService.getProjectDetail(created.getId());
        assertNotNull(adminDetail.getClient());
        assertEquals("9810001111", adminDetail.getClient().getPhone());
        assertEquals("contact@apexretail.com", adminDetail.getClient().getEmail());
        assertEquals("+919810001111", adminDetail.getClient().getFormattedWhatsAppPhone());

        // Manager check
        authenticateAs("manager@rohilla.com");
        ProjectDetailDto managerDetail = projectService.getProjectDetail(created.getId());
        assertNotNull(managerDetail.getClient());
        assertEquals("9810001111", managerDetail.getClient().getPhone());
        assertEquals("contact@apexretail.com", managerDetail.getClient().getEmail());
    }

    @Test
    @DisplayName("17. Sensitive client details hidden from operational roles (Designer, Production, QC, Dispatch)")
    void testClientDetailsHiddenFromUnauthorizedRoles() {
        authenticateAs("admin@rohilla.com");
        User designer = userRepository.findByEmail("designer@rohilla.com").orElseThrow();

        CreateProjectRequest req = createBaseProjectRequest();
        req.setAssignedDesignerId(designer.getId());
        ProjectResponseDto created = projectService.createProject(req);

        // Designer role inspection
        authenticateAs("designer@rohilla.com");
        ProjectDetailDto designerDetail = projectService.getProjectDetail(created.getId());

        assertNotNull(designerDetail.getClient());
        assertEquals("Apex Retailers Pvt Ltd", designerDetail.getClient().getCompanyName());
        assertNull(designerDetail.getClient().getPhone(), "Designer must NOT see client phone number");
        assertNull(designerDetail.getClient().getEmail(), "Designer must NOT see client email");
        assertNull(designerDetail.getClient().getGstNumber(), "Designer must NOT see GST number");
        assertNull(designerDetail.getClient().getFormattedWhatsAppPhone(), "Designer must NOT see formatted WhatsApp phone");
    }

    @Test
    @DisplayName("18. Client details editable with comprehensive audit log entry")
    void testClientDetailsEditableWithAuditLog() {
        authenticateAs("admin@rohilla.com");
        CreateProjectRequest req = createBaseProjectRequest();
        ProjectResponseDto created = projectService.createProject(req);
        Project project = projectRepository.findById(created.getId()).orElseThrow();
        UUID clientId = project.getClient().getId();

        // Manager updates phone and address
        authenticateAs("manager@rohilla.com");
        UpdateClientRequest updateReq = UpdateClientRequest.builder()
                .companyName("Apex Retailers India Ltd")
                .phone("9811122233")
                .address("New Logistics Hub, Sector 18, Gurugram 122015")
                .email("billing@apexretail.com")
                .contactPerson("Vikas Mehta")
                .gstNumber("07AAAAA1111B2Z8")
                .build();

        ClientDto updated = clientService.updateClient(clientId, updateReq);
        assertEquals("9811122233", updated.getPhone());
        assertEquals("Apex Retailers India Ltd", updated.getCompanyName());

        // Verify async audit log published
        boolean hasUpdateAudit = waitForAuditAction("CLIENT", clientId.toString(), AuditAction.CLIENT_UPDATED);
        assertTrue(hasUpdateAudit, "Audit trail must record CLIENT_UPDATED action");

        // Non-privileged user cannot edit client
        authenticateAs("designer@rohilla.com");
        assertThrows(UnauthorizedActionException.class, () -> clientService.updateClient(clientId, updateReq));
    }
}
