package com.rohilla.crm.bootstrap;

import com.rohilla.crm.client.entity.Client;
import com.rohilla.crm.client.repository.ClientRepository;
import com.rohilla.crm.common.enums.DepartmentType;
import com.rohilla.crm.common.enums.Priority;
import com.rohilla.crm.design.entity.DesignFile;
import com.rohilla.crm.design.repository.DesignFileRepository;
import com.rohilla.crm.dispatch.entity.DispatchRecord;
import com.rohilla.crm.dispatch.repository.DispatchRecordRepository;
import com.rohilla.crm.employee.entity.EmployeeProfile;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.employee.enums.UserStatus;
import com.rohilla.crm.employee.repository.EmployeeProfileRepository;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.lead.entity.Lead;
import com.rohilla.crm.lead.enums.LeadStatus;
import com.rohilla.crm.lead.repository.LeadRepository;
import com.rohilla.crm.production.entity.ProductionTask;
import com.rohilla.crm.production.repository.ProductionTaskRepository;
import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.project.enums.ProjectStatus;
import com.rohilla.crm.project.repository.ProjectRepository;
import com.rohilla.crm.qc.entity.QCEvaluation;
import com.rohilla.crm.qc.repository.QCEvaluationRepository;
import com.rohilla.crm.security.entity.Permission;
import com.rohilla.crm.security.entity.Role;
import com.rohilla.crm.security.enums.RoleType;
import com.rohilla.crm.security.repository.PermissionRepository;
import com.rohilla.crm.security.repository.RoleRepository;




import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Component
@Profile({"dev", "test", "default"})
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final ProjectRepository projectRepository;
    private final DesignFileRepository designFileRepository;
    private final ProductionTaskRepository productionTaskRepository;
    private final QCEvaluationRepository qcEvaluationRepository;
    private final DispatchRecordRepository dispatchRecordRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final LeadRepository leadRepository;
    private final com.rohilla.crm.inventory.repository.InventoryItemRepository inventoryItemRepository;
    private final com.rohilla.crm.enquiry.repository.EnquiryRepository enquiryRepository;
    private final com.rohilla.crm.enquiry.repository.EnquiryLineItemRepository enquiryLineItemRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded. Ensuring primary owner is ACTIVE.");
            userRepository.findByEmail("admin@rohilla.com").ifPresent(admin -> {
                if (admin.getStatus() != UserStatus.ACTIVE) {
                    admin.setStatus(UserStatus.ACTIVE);
                    userRepository.save(admin);
                    log.info("Restored primary owner admin@rohilla.com status to ACTIVE");
                }
            });
            return;
        }

        log.info("Seeding Rohilla Advertising CRM 6 internal roles, permissions, users, and dual-path projects...");

        // 1. Seed Permissions
        Map<String, Permission> permMap = new HashMap<>();
        String[] permissions = {
                "user:read", "user:create", "user:update", "user:delete",
                "project:read:all", "project:read:assigned", "project:create", "project:update", "project:delete",
                "design:upload", "design:technical_check", "design:review", "design:approve",
                "production:manage", "production:execute",
                "qc:evaluate",
                "dispatch:manage", "installation:manage",
                "audit:read",
                "report:view",
                "enquiry:create", "enquiry:read", "enquiry:update", "enquiry:convert",
                "inventory:read", "inventory:manage", "inventory:issue"
        };

        for (String pName : permissions) {
            Permission p = Permission.builder()
                    .name(pName)
                    .description("Permission for " + pName)
                    .build();
            permMap.put(pName, permissionRepository.save(p));
        }

        // 2. Seed Exactly the SIX Internal CRM Roles (No SUPER_ADMIN, No CLIENT role)
        Role adminRole = createRole(RoleType.ROLE_ADMIN, "Company Owner & System Administrator", new HashSet<>(permMap.values()));
        Role managerRole = createRole(RoleType.ROLE_MANAGER, "Operations & Project Workflow Controller", Set.of(
                permMap.get("project:read:all"), permMap.get("project:create"), permMap.get("project:update"),
                permMap.get("design:upload"), permMap.get("design:review"), permMap.get("design:approve"),
                permMap.get("production:manage"), permMap.get("qc:evaluate"), permMap.get("dispatch:manage"),
                permMap.get("installation:manage"), permMap.get("audit:read"), permMap.get("report:view"),
                permMap.get("enquiry:create"), permMap.get("enquiry:read"), permMap.get("enquiry:update"), permMap.get("enquiry:convert"),
                permMap.get("inventory:read"), permMap.get("inventory:manage"), permMap.get("inventory:issue")
        ));
        Role designerRole = createRole(RoleType.ROLE_DESIGNER, "Creative Graphic Designer & Technical Checker", Set.of(
                permMap.get("project:read:assigned"), permMap.get("design:upload"), permMap.get("design:technical_check")
        ));
        Role productionRole = createRole(RoleType.ROLE_PRODUCTION, "Print & Fabrication Specialist", Set.of(
                permMap.get("project:read:assigned"), permMap.get("production:execute"),
                permMap.get("inventory:read"), permMap.get("inventory:issue")
        ));
        Role qcRole = createRole(RoleType.ROLE_QC, "Quality Assurance & Inspection Officer", Set.of(
                permMap.get("project:read:assigned"), permMap.get("qc:evaluate")
        ));
        Role dispatchRole = createRole(RoleType.ROLE_DISPATCH, "Logistics, Courier & Installation Specialist", Set.of(
                permMap.get("project:read:assigned"), permMap.get("dispatch:manage"), permMap.get("installation:manage")
        ));

        // 3. Seed Exactly 6 Internal Users (Password: password123)
        String defaultHashedPassword = passwordEncoder.encode("password123");

        User admin = createUser("admin@rohilla.com", defaultHashedPassword, "Aditye Rohilla", "+91-9811001100", "EMP-0001", DepartmentType.MANAGEMENT, Set.of(adminRole), "A-12, Sector 14, Gurugram, Haryana", "Meena Rohilla", "+91-9811001199", "Spouse");
        User manager = createUser("manager@rohilla.com", defaultHashedPassword, "Amit Sharma (Operations Manager)", "+91-9811002200", "EMP-0002", DepartmentType.MANAGEMENT, Set.of(managerRole), "B-404, Cyber Heights, Sector 43, Gurugram", "Neha Sharma", "+91-9811002299", "Spouse");
        User designer = createUser("designer@rohilla.com", defaultHashedPassword, "Pooja Verma (Lead Designer)", "+91-9811003300", "EMP-0003", DepartmentType.DESIGN, Set.of(designerRole), "Flat 302, Green Glen Layout, New Delhi", "Ramesh Verma", "+91-9811003399", "Father");
        User production = createUser("production@rohilla.com", defaultHashedPassword, "Vikram Singh (Print Master)", "+91-9811004400", "EMP-0004", DepartmentType.PRODUCTION, Set.of(productionRole), "H.No 88, Udyog Vihar Phase 4, Gurugram", "Sunita Singh", "+91-9811004499", "Spouse");
        User qc = createUser("qc@rohilla.com", defaultHashedPassword, "Sanjay Mehta (QC Inspector)", "+91-9811005500", "EMP-0005", DepartmentType.QUALITY_CONTROL, Set.of(qcRole), "C-12, DLF Phase 2, Gurugram", "Anita Mehta", "+91-9811005599", "Spouse");
        User dispatch = createUser("dispatch@rohilla.com", defaultHashedPassword, "Ramesh Kumar (Logistics & Install)", "+91-9811006600", "EMP-0006", DepartmentType.DISPATCH, Set.of(dispatchRole), "Village Silokhera, South City 1, Gurugram", "Kiran Kumar", "+91-9811006699", "Spouse");

        // 4. Seed Clients
        Map<String, String> client1Custom = new LinkedHashMap<>();
        client1Custom.put("Contact Person", "Kavita Rao");
        client1Custom.put("GST Number", "06AAACA1234F1Z5");
        client1Custom.put("Billing Address", "Plot 42, Cyber City, Gurugram, Haryana - 122002");

        Client client1 = clientRepository.save(Client.builder()
                .companyName("Apex Retail Brands Ltd.")
                .contactPerson("Kavita Rao")
                .email("kavita@apexbrands.com")
                .phone("9811007700")
                .address("Plot 42, Cyber City, Gurugram, Haryana")
                .gstNumber("06AAACA1234F1Z5")
                .customFields(client1Custom)
                .build());

        Map<String, String> client2Custom = new LinkedHashMap<>();
        client2Custom.put("Contact Person", "Sunil Agarwal");
        client2Custom.put("GST Number", "07BBBCB5678G2Z1");

        Client client2 = clientRepository.save(Client.builder()
                .companyName("Metro Real Estate Group")
                .contactPerson("Sunil Agarwal")
                .email("marketing@metrogroup.in")
                .phone("9876543210")
                .address("Tower B, Connaught Place, New Delhi")
                .gstNumber("07BBBCB5678G2Z1")
                .customFields(client2Custom)
                .build());

        Map<String, String> client3Custom = new LinkedHashMap<>();
        client3Custom.put("Contact Person", "Rohan Kapoor");
        client3Custom.put("Site Contact", "+91-9988776655");

        Client client3 = clientRepository.save(Client.builder()
                .companyName("Sunrise Motors India")
                .contactPerson("Rohan Kapoor")
                .email("rohan@sunrisemotors.com")
                .phone("9988776655")
                .address("Industrial Area Phase 2, Noida, UP")
                .gstNumber("09CCCC9012H3Z8")
                .customFields(client3Custom)
                .build());


        // 5. Seed Projects Demonstrating Both Paths & Department History

        // PATH A: Customer Provided Design -> Currently in Designer Technical Compatibility Check
        Project proj1 = projectRepository.save(Project.builder()
                .projectCode("PRJ-2026-001")
                .title("Metro Highway Billboard 40x20ft (Customer Design)")
                .description("Client supplied print-ready TIFF file. Designer must verify DPI, color gamut (CMYK), and border bleeding.")
                .client(client2)
                .priority(Priority.HIGH)
                .customerProvidedDesign(true) // Path A
                .installationRequired(true)
                .status(ProjectStatus.DESIGN_TECHNICAL_CHECK)
                .assignedDesigner(designer)
                .assignedProduction(production)
                .assignedQc(qc)
                .assignedDispatch(dispatch)
                .createdBy(manager)
                .dueDate(LocalDate.now().plusDays(5))
                .budget(new BigDecimal("125000.00"))
                .build());

        designFileRepository.save(DesignFile.builder()
                .project(proj1)
                .originalFileName("Metro_Billboard_PrintProof_v1.tiff")
                .storageKey("designs/proj1_proof_v1.tiff")
                .fileSizeBytes(48500000L)
                .mimeType("image/tiff")
                .versionNumber(1)
                .uploadedBy(designer)
                .build());

        // PATH B: Design Required -> Currently in Designer Artwork Creation
        Project proj2 = projectRepository.save(Project.builder()
                .projectCode("PRJ-2026-002")
                .title("Apex Retail Storefront LED Acrylic Letters - 5 Outlets")
                .description("Customer requires fresh 3D edge-lit acrylic design. Requires Customer Approval followed by Manager Approval before Production.")
                .client(client1)
                .priority(Priority.URGENT)
                .customerProvidedDesign(false) // Path B
                .installationRequired(true)
                .status(ProjectStatus.DESIGN_IN_PROGRESS)
                .assignedDesigner(designer)
                .assignedProduction(production)
                .assignedQc(qc)
                .assignedDispatch(dispatch)
                .createdBy(admin)
                .dueDate(LocalDate.now().plusDays(3))
                .budget(new BigDecimal("280000.00"))
                .build());

        designFileRepository.save(DesignFile.builder()
                .project(proj2)
                .originalFileName("Apex_Storefront_3D_v1.pdf")
                .storageKey("designs/proj2_proof_v1.pdf")
                .fileSizeBytes(12400000L)
                .mimeType("application/pdf")
                .versionNumber(1)
                .uploadedBy(designer)
                .build());

        // PATH B: Ready for Production (Approved & Locked)
        Project proj3 = projectRepository.save(Project.builder()
                .projectCode("PRJ-2026-003")
                .title("Sunrise Motors Annual Auto Expo Fabric Banners")
                .description("Backlit tension fabric system displays. Customer and Manager approvals completed, design version locked.")
                .client(client3)
                .priority(Priority.MEDIUM)
                .customerProvidedDesign(false) // Path B
                .installationRequired(false)
                .status(ProjectStatus.READY_FOR_PRODUCTION)
                .assignedDesigner(designer)
                .assignedProduction(production)
                .assignedQc(qc)
                .assignedDispatch(dispatch)
                .createdBy(manager)
                .dueDate(LocalDate.now().plusDays(2))
                .budget(new BigDecimal("95000.00"))
                .build());

        DesignFile proj3File = designFileRepository.save(DesignFile.builder()
                .project(proj3)
                .originalFileName("Sunrise_Expo_Fabric_Banner_v2_FINAL.pdf")
                .storageKey("designs/proj3_proof_v2.pdf")
                .fileSizeBytes(18900000L)
                .mimeType("application/pdf")
                .versionNumber(2)
                .uploadedBy(designer)
                .approvedByCustomer(true)
                .customerFeedback("Confirmed final color calibration")
                .approvedByManager(manager)
                .managerApprovedAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .isProductionApproved(true)
                .isLocked(true)
                .build());

        proj3.setApprovedDesignFileId(proj3File.getId());
        projectRepository.save(proj3);

        productionTaskRepository.save(ProductionTask.builder()
                .project(proj3)
                .taskName("Tension Fabric Dye-Sublimation Print")
                .materialSpecification("220 GSM Backlit Tension Fabric")
                .machineType("Tension Fabric LED System")
                .quantity(12)
                .status("PENDING")
                .assignedTo(production)
                .build());

        // PATH A: Fully Completed & Installed
        Project proj4 = projectRepository.save(Project.builder()
                .projectCode("PRJ-2026-004")
                .title("Rohilla Premium Flex Glow Signs")
                .description("Customer supplied flex design. Machine checked, fabricated, QC passed, dispatched, and installed.")
                .client(client1)
                .priority(Priority.LOW)
                .customerProvidedDesign(true) // Path A
                .installationRequired(true)
                .status(ProjectStatus.COMPLETED)
                .assignedDesigner(designer)
                .assignedProduction(production)
                .assignedQc(qc)
                .assignedDispatch(dispatch)
                .createdBy(manager)
                .dueDate(LocalDate.now().minusDays(1))
                .installationDate(LocalDate.now().minusDays(1))
                .installationNotes("Glow signs mounted securely with 3-phase wiring test passed.")
                .installationCompletedBy(dispatch)
                .budget(new BigDecimal("45000.00"))
                .build());

        designFileRepository.save(DesignFile.builder()
                .project(proj4)
                .originalFileName("Rohilla_GlowSign_v1.pdf")
                .storageKey("designs/proj4_proof_v1.pdf")
                .fileSizeBytes(8200000L)
                .mimeType("application/pdf")
                .versionNumber(1)
                .uploadedBy(designer)
                .technicalCheckPassed(true)
                .compatibilityNotes("Verified for Solvent printing")
                .technicalCheckedBy(designer)
                .isProductionApproved(true)
                .isLocked(true)
                .build());

        productionTaskRepository.save(ProductionTask.builder()
                .project(proj4)
                .taskName("Star Flex Backlit Printing & Iron Framing")
                .materialSpecification("Star Flex 440 GSM + Heavy Gauge MS Frame")
                .machineType("Eco-Solvent Large Format")
                .quantity(2)
                .status("COMPLETED")
                .startedAt(Instant.now().minus(3, ChronoUnit.DAYS))
                .completedAt(Instant.now().minus(2, ChronoUnit.DAYS))
                .assignedTo(production)
                .notes("Welding inspected and LED tubes installed")
                .build());

        qcEvaluationRepository.save(QCEvaluation.builder()
                .project(proj4)
                .inspector(qc)
                .passed(true)
                .colorAccuracyScore(10)
                .dimensionAccuracyScore(9)
                .finishingScore(9)
                .remarks("High contrast flex printing, uniform LED backlighting with zero hot-spots.")
                .build());

        dispatchRecordRepository.save(DispatchRecord.builder()
                .project(proj4)
                .dispatchDate(LocalDate.now().minusDays(1))
                .courierPartner("Rohilla In-House Delivery Fleet")
                .trackingNumber("ROH-582910")
                .recipientName("Kavita Rao")
                .destinationAddress("Plot 42, Cyber City, Gurugram, Haryana")
                .dispatchedBy(dispatch)
                .dispatchNotes("Delivered with mounting brackets and hardware")
                .build());

        // Additional Historical Project 5: Active In-Production
        Project proj5 = projectRepository.save(Project.builder()
                .projectCode("PRJ-2026-005")
                .title("Metro Corporate Reception Backlit Acrylic Signage")
                .description("Edge-lit acrylic logo with brushed gold metal accents.")
                .client(client2)
                .priority(Priority.HIGH)
                .customerProvidedDesign(false)
                .installationRequired(true)
                .status(ProjectStatus.IN_PRODUCTION)
                .assignedDesigner(designer)
                .assignedProduction(production)
                .assignedQc(qc)
                .assignedDispatch(dispatch)
                .createdBy(manager)
                .dueDate(LocalDate.now().plusDays(4))
                .budget(new BigDecimal("185000.00"))
                .build());

        DesignFile proj5File = designFileRepository.save(DesignFile.builder()
                .project(proj5)
                .originalFileName("Metro_Reception_v2_Final.ai")
                .storageKey("designs/proj5_proof_v2.ai")
                .fileSizeBytes(24000000L)
                .mimeType("application/postscript")
                .versionNumber(2)
                .uploadedBy(designer)
                .approvedByCustomer(true)
                .customerFeedback("Approved gold gradient finish")
                .approvedByManager(manager)
                .managerApprovedAt(Instant.now().minus(2, ChronoUnit.DAYS))
                .isProductionApproved(true)
                .isLocked(true)
                .build());

        proj5.setApprovedDesignFileId(proj5File.getId());
        projectRepository.save(proj5);

        productionTaskRepository.save(ProductionTask.builder()
                .project(proj5)
                .taskName("CNC Acrylic Cutting & Laser Engraving")
                .materialSpecification("10mm Cast Clear Acrylic + Gold ACP")
                .machineType("CNC Router / Laser Cutter")
                .quantity(1)
                .status("IN_PROGRESS")
                .startedAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .assignedTo(production)
                .notes("Laser cutting completed; edge polishing underway")
                .build());

        // 6. Seed Sample Leads for Manager CRM
        leadRepository.save(Lead.builder()
                .leadCode("LEAD-2026-0001")
                .customerName("Rajesh Khandelwal")
                .phone("9810001111")
                .email("rajesh@aromafoods.in")
                .companyName("Aroma Spices & Foods Pvt Ltd")
                .requirement("Requirement for outdoor flex hoardings and storefront back-lit signage for new retail outlets.")
                .productService("Outdoor Advertising")
                .quantity(5)
                .size("20x10 ft")
                .location("Sector 29, Gurugram")
                .designRequired(false)
                .designFileName("Aroma_Brand_Artwork.pdf")
                .designFileStorageKey("uploads/temp/aroma_artwork.pdf")
                .status(LeadStatus.NEW_LEAD)
                .notes("Customer requested quote within 24 hours.")
                .build());

        leadRepository.save(Lead.builder()
                .leadCode("LEAD-2026-0002")
                .customerName("Ananya Deshmukh")
                .phone("9820002222")
                .email("ananya@techpark.co.in")
                .companyName("TechPark Real Estate")
                .requirement("Custom LED acrylic 3D lettering for tech campus main reception.")
                .productService("Signage")
                .quantity(2)
                .size("12x4 ft")
                .location("Cyber City, Gurugram")
                .designRequired(true)
                .status(LeadStatus.CONTACTED)
                .notes("Contacted client, requested site survey photos.")
                .build());

        leadRepository.save(Lead.builder()
                .leadCode("LEAD-2026-0003")
                .customerName("Vikramaditya Rao")
                .phone("9830003333")
                .email("events@apexsummit.org")
                .companyName("National Retail Summit 2026")
                .requirement("Rollup standees, entry gate arch banners, and directional signage for 3-day expo.")
                .productService("Standee")
                .quantity(25)
                .size("3x6 ft")
                .location("Pragati Maidan, New Delhi")
                .designRequired(false)
                .status(LeadStatus.NEW_LEAD)
                .notes("Urgent requirement for upcoming exhibition.")
                .build());

        // 7. Seed Real Industrial Inventory Stock Items
        log.info("Seeding inventory catalog and physical stock items...");
        List<com.rohilla.crm.inventory.entity.InventoryItem> inventoryItems = List.of(
                com.rohilla.crm.inventory.entity.InventoryItem.builder()
                        .itemCode("MAT-FLX-01")
                        .name("Frontlit Flex 340gsm")
                        .category("Flex & Vinyl")
                        .unit("Sq. Ft.")
                        .currentStock(new BigDecimal("2500.00"))
                        .reservedStock(BigDecimal.ZERO)
                        .reorderLevel(new BigDecimal("500.00"))
                        .unitCost(new BigDecimal("9.50"))
                        .location("Rack A-1 (Flex Rolls)")
                        .build(),
                com.rohilla.crm.inventory.entity.InventoryItem.builder()
                        .itemCode("MAT-FLX-02")
                        .name("Backlit Flex 510gsm")
                        .category("Flex & Vinyl")
                        .unit("Sq. Ft.")
                        .currentStock(new BigDecimal("1200.00"))
                        .reservedStock(BigDecimal.ZERO)
                        .reorderLevel(new BigDecimal("300.00"))
                        .unitCost(new BigDecimal("16.00"))
                        .location("Rack A-2 (Flex Rolls)")
                        .build(),
                com.rohilla.crm.inventory.entity.InventoryItem.builder()
                        .itemCode("MAT-FLX-03")
                        .name("Star Flex")
                        .category("Flex & Vinyl")
                        .unit("Sq. Ft.")
                        .currentStock(new BigDecimal("800.00"))
                        .reservedStock(BigDecimal.ZERO)
                        .reorderLevel(new BigDecimal("200.00"))
                        .unitCost(new BigDecimal("18.50"))
                        .location("Rack A-3")
                        .build(),
                com.rohilla.crm.inventory.entity.InventoryItem.builder()
                        .itemCode("MAT-VIN-01")
                        .name("Printable Vinyl (Gloss)")
                        .category("Flex & Vinyl")
                        .unit("Sq. Ft.")
                        .currentStock(new BigDecimal("1500.00"))
                        .reservedStock(BigDecimal.ZERO)
                        .reorderLevel(new BigDecimal("400.00"))
                        .unitCost(new BigDecimal("14.00"))
                        .location("Rack B-1")
                        .build(),
                com.rohilla.crm.inventory.entity.InventoryItem.builder()
                        .itemCode("MAT-LAM-01")
                        .name("Cold Lamination Film")
                        .category("Flex & Vinyl")
                        .unit("Sq. Ft.")
                        .currentStock(new BigDecimal("2000.00"))
                        .reservedStock(BigDecimal.ZERO)
                        .reorderLevel(new BigDecimal("500.00"))
                        .unitCost(new BigDecimal("6.00"))
                        .location("Rack B-3")
                        .build(),
                com.rohilla.crm.inventory.entity.InventoryItem.builder()
                        .itemCode("MAT-MS-01")
                        .name("MS Square Pipe 1x1 inch 16G")
                        .category("Metal & Structural")
                        .unit("Running Ft.")
                        .currentStock(new BigDecimal("650.00"))
                        .reservedStock(BigDecimal.ZERO)
                        .reorderLevel(new BigDecimal("150.00"))
                        .unitCost(new BigDecimal("28.00"))
                        .location("Fabrication Bay C")
                        .build(),
                com.rohilla.crm.inventory.entity.InventoryItem.builder()
                        .itemCode("MAT-MS-02")
                        .name("MS Rectangular Pipe 2x1 inch")
                        .category("Metal & Structural")
                        .unit("Running Ft.")
                        .currentStock(new BigDecimal("400.00"))
                        .reservedStock(BigDecimal.ZERO)
                        .reorderLevel(new BigDecimal("100.00"))
                        .unitCost(new BigDecimal("42.00"))
                        .location("Fabrication Bay C")
                        .build(),
                com.rohilla.crm.inventory.entity.InventoryItem.builder()
                        .itemCode("MAT-MS-03")
                        .name("MS Channel 75x40mm")
                        .category("Metal & Structural")
                        .unit("Running Ft.")
                        .currentStock(new BigDecimal("300.00"))
                        .reservedStock(BigDecimal.ZERO)
                        .reorderLevel(new BigDecimal("80.00"))
                        .unitCost(new BigDecimal("65.00"))
                        .location("Heavy Yard D")
                        .build(),
                com.rohilla.crm.inventory.entity.InventoryItem.builder()
                        .itemCode("MAT-SHT-01")
                        .name("ACP Sheet 3mm White")
                        .category("Sheets & Boards")
                        .unit("Sheet")
                        .currentStock(new BigDecimal("120.00"))
                        .reservedStock(BigDecimal.ZERO)
                        .reorderLevel(new BigDecimal("25.00"))
                        .unitCost(new BigDecimal("1450.00"))
                        .location("Sheet Rack E-1")
                        .build(),
                com.rohilla.crm.inventory.entity.InventoryItem.builder()
                        .itemCode("MAT-SHT-02")
                        .name("Acrylic Sheet 3mm Cast Clear")
                        .category("Sheets & Boards")
                        .unit("Sheet")
                        .currentStock(new BigDecimal("60.00"))
                        .reservedStock(BigDecimal.ZERO)
                        .reorderLevel(new BigDecimal("15.00"))
                        .unitCost(new BigDecimal("2200.00"))
                        .location("Laser Cutting Floor")
                        .build(),
                com.rohilla.crm.inventory.entity.InventoryItem.builder()
                        .itemCode("MAT-SHT-03")
                        .name("PVC Foam Board 5mm")
                        .category("Sheets & Boards")
                        .unit("Sheet")
                        .currentStock(new BigDecimal("140.00"))
                        .reservedStock(BigDecimal.ZERO)
                        .reorderLevel(new BigDecimal("30.00"))
                        .unitCost(new BigDecimal("850.00"))
                        .location("CNC Router Room")
                        .build(),
                com.rohilla.crm.inventory.entity.InventoryItem.builder()
                        .itemCode("MAT-STD-01")
                        .name("Roll-up Standee Mechanism 6x3ft")
                        .category("Hardware & Fasteners")
                        .unit("Piece")
                        .currentStock(new BigDecimal("85.00"))
                        .reservedStock(BigDecimal.ZERO)
                        .reorderLevel(new BigDecimal("20.00"))
                        .unitCost(new BigDecimal("420.00"))
                        .location("Assembly Floor")
                        .build(),
                com.rohilla.crm.inventory.entity.InventoryItem.builder()
                        .itemCode("MAT-LED-01")
                        .name("LED Module Samsung 1.2W IP68")
                        .category("LED & Electrical")
                        .unit("Piece")
                        .currentStock(new BigDecimal("3500.00"))
                        .reservedStock(BigDecimal.ZERO)
                        .reorderLevel(new BigDecimal("600.00"))
                        .unitCost(new BigDecimal("18.00"))
                        .location("Electrical Workstation F")
                        .build(),
                com.rohilla.crm.inventory.entity.InventoryItem.builder()
                        .itemCode("MAT-LED-02")
                        .name("LED Power Supply 12V 400W Rainproof")
                        .category("LED & Electrical")
                        .unit("Piece")
                        .currentStock(new BigDecimal("45.00"))
                        .reservedStock(BigDecimal.ZERO)
                        .reorderLevel(new BigDecimal("10.00"))
                        .unitCost(new BigDecimal("1250.00"))
                        .location("Electrical Workstation F")
                        .build(),
                com.rohilla.crm.inventory.entity.InventoryItem.builder()
                        .itemCode("MAT-HDW-01")
                        .name("Brass Eyelets #3")
                        .category("Hardware & Fasteners")
                        .unit("Piece")
                        .currentStock(new BigDecimal("15000.00"))
                        .reservedStock(BigDecimal.ZERO)
                        .reorderLevel(new BigDecimal("3000.00"))
                        .unitCost(new BigDecimal("0.35"))
                        .location("Finishing Station G")
                        .build(),
                com.rohilla.crm.inventory.entity.InventoryItem.builder()
                        .itemCode("MAT-HDW-02")
                        .name("Nylon Braided Rope 6mm")
                        .category("Hardware & Fasteners")
                        .unit("Running Ft.")
                        .currentStock(new BigDecimal("1200.00"))
                        .reservedStock(BigDecimal.ZERO)
                        .reorderLevel(new BigDecimal("300.00"))
                        .unitCost(new BigDecimal("2.50"))
                        .location("Finishing Station G")
                        .build()
        );
        inventoryItemRepository.saveAll(inventoryItems);

        // 8. Seed Front Office Enquiries
        log.info("Seeding demo Front Office enquiries...");
        com.rohilla.crm.enquiry.entity.Enquiry enq1 = com.rohilla.crm.enquiry.entity.Enquiry.builder()
                .enquiryNumber("ENQ-2026-0001")
                .enquiryDate(LocalDate.now())
                .client(client1)
                .clientName("Kavita Rao")
                .companyName("Apex Retail Brands Ltd.")
                .phone("9811007700")
                .address("Plot 42, Cyber City, Gurugram, Haryana")
                .gstNumber("06AAACA1234F1Z5")
                .leadSource(com.rohilla.crm.enquiry.enums.LeadSource.WALK_IN)
                .recordedBy(manager)
                .status(com.rohilla.crm.enquiry.enums.EnquiryStatus.SUBMITTED)
                .priority(com.rohilla.crm.enquiry.enums.EnquiryPriority.NORMAL)
                .expectedCompletionDate(LocalDate.now().plusDays(4))
                .quotationStatus(com.rohilla.crm.enquiry.enums.QuotationStatus.PENDING)
                .estimatedAmount(new BigDecimal("45000.00"))
                .designStatus(com.rohilla.crm.enquiry.enums.DesignRequirementStatus.CLIENT_PROVIDED)
                .customerRemarks("Required for weekend festival showroom launch.")
                .internalRemarks("Client already has vector CDR file ready.")
                .build();

        com.rohilla.crm.enquiry.entity.EnquiryLineItem enq1Item1 = com.rohilla.crm.enquiry.entity.EnquiryLineItem.builder()
                .enquiry(enq1)
                .serviceName("Flex Printing")
                .width(new BigDecimal("20.00"))
                .height(new BigDecimal("10.00"))
                .dimensionUnit(com.rohilla.crm.enquiry.enums.DimensionUnit.FEET)
                .quantity(2)
                .quantityUnit(com.rohilla.crm.enquiry.enums.QuantityUnit.PIECE)
                .printSides(com.rohilla.crm.enquiry.enums.PrintSides.SINGLE_SIDED)
                .printingType(com.rohilla.crm.enquiry.enums.PrintingType.FULL_COLOUR)
                .areaPerSideSqFt(new BigDecimal("200.00"))
                .totalAreaSqFt(new BigDecimal("400.00"))
                .areaPerSideSqM(new BigDecimal("18.58"))
                .totalAreaSqM(new BigDecimal("37.16"))
                .installationRequired(true)
                .installationLocation("Cyber Hub Entrance")
                .selectedMaterials(List.of("Frontlit Flex", "Eyelets/Grommets", "Rope"))
                .finishingRequirements(List.of("Eyelets", "Edge Folding", "On-Site Installation"))
                .remarks("Print high saturation vivid colors.")
                .build();

        com.rohilla.crm.enquiry.entity.EnquiryLineItem enq1Item2 = com.rohilla.crm.enquiry.entity.EnquiryLineItem.builder()
                .enquiry(enq1)
                .serviceName("Standee")
                .width(new BigDecimal("3.00"))
                .height(new BigDecimal("6.00"))
                .dimensionUnit(com.rohilla.crm.enquiry.enums.DimensionUnit.FEET)
                .quantity(4)
                .quantityUnit(com.rohilla.crm.enquiry.enums.QuantityUnit.PIECE)
                .printSides(com.rohilla.crm.enquiry.enums.PrintSides.SINGLE_SIDED)
                .printingType(com.rohilla.crm.enquiry.enums.PrintingType.FULL_COLOUR)
                .areaPerSideSqFt(new BigDecimal("18.00"))
                .totalAreaSqFt(new BigDecimal("72.00"))
                .areaPerSideSqM(new BigDecimal("1.67"))
                .totalAreaSqM(new BigDecimal("6.69"))
                .installationRequired(false)
                .selectedMaterials(List.of("Roll-up Standee Mechanism", "Printable Vinyl", "Lamination Film"))
                .finishingRequirements(List.of("Lamination", "Mounting"))
                .remarks("Rollup aluminium base standee.")
                .build();

        enq1.addLineItem(enq1Item1);
        enq1.addLineItem(enq1Item2);
        enquiryRepository.save(enq1);

        com.rohilla.crm.enquiry.entity.Enquiry enq2 = com.rohilla.crm.enquiry.entity.Enquiry.builder()
                .enquiryNumber("ENQ-2026-0002")
                .enquiryDate(LocalDate.now())
                .client(client2)
                .clientName("Sunil Agarwal")
                .companyName("Metro Real Estate Group")
                .phone("9876543210")
                .address("Tower B, Connaught Place, New Delhi")
                .gstNumber("07BBBCB5678G2Z1")
                .leadSource(com.rohilla.crm.enquiry.enums.LeadSource.PHONE_CALL)
                .recordedBy(manager)
                .status(com.rohilla.crm.enquiry.enums.EnquiryStatus.SUBMITTED)
                .priority(com.rohilla.crm.enquiry.enums.EnquiryPriority.URGENT)
                .expectedCompletionDate(LocalDate.now().plusDays(7))
                .quotationStatus(com.rohilla.crm.enquiry.enums.QuotationStatus.PENDING)
                .estimatedAmount(new BigDecimal("180000.00"))
                .designStatus(com.rohilla.crm.enquiry.enums.DesignRequirementStatus.DESIGN_REQUIRED)
                .customerRemarks("Site measurement needed on Mehrauli-Gurgaon Road.")
                .internalRemarks("Structural inspection required.")
                .build();

        com.rohilla.crm.enquiry.entity.EnquiryLineItem enq2Item1 = com.rohilla.crm.enquiry.entity.EnquiryLineItem.builder()
                .enquiry(enq2)
                .serviceName("Hoarding")
                .siteMeasurementRequired(true)
                .quantity(1)
                .quantityUnit(com.rohilla.crm.enquiry.enums.QuantityUnit.SET)
                .printSides(com.rohilla.crm.enquiry.enums.PrintSides.SINGLE_SIDED)
                .printingType(com.rohilla.crm.enquiry.enums.PrintingType.FULL_COLOUR)
                .installationRequired(true)
                .installationLocation("MG Road Metro Pillar 124")
                .siteInspectionRequired(true)
                .selectedMaterials(List.of("Frontlit/Backlit Flex", "MS Square Pipe", "MS Channel", "Lighting Materials"))
                .finishingRequirements(List.of("Frame Fabrication", "Welding", "Painting", "LED Lighting", "On-Site Installation", "Crane/Hydraulic Lift Required", "Site Inspection Required"))
                .remarks("Engineer must survey structural load and soil foundation.")
                .build();

        enq2.addLineItem(enq2Item1);
        enquiryRepository.save(enq2);

        log.info("Database seeding completed. 6 internal roles, dual-path projects, demo leads, inventory, and front office enquiries initialized.");
    }

    private Role createRole(RoleType name, String description, Set<Permission> perms) {
        Role role = Role.builder()
                .name(name)
                .description(description)
                .permissions(perms)
                .build();
        return roleRepository.save(role);
    }

    private User createUser(String email, String password, String name, String phone, String empId, DepartmentType dept, Set<Role> roles, String address, String emergencyName, String emergencyPhone, String emergencyRel) {
        User user = User.builder()
                .employeeId(empId)
                .joiningDate(LocalDate.now().minusMonths(6))
                .email(email)
                .password(password)
                .fullName(name)
                .phone(phone)
                .department(dept)
                .status(UserStatus.ACTIVE)
                .roles(roles)
                .build();
        User saved = userRepository.save(user);

        EmployeeProfile profile = EmployeeProfile.builder()
                .user(saved)
                .address(address)
                .emergencyContactName(emergencyName)
                .emergencyContactPhone(emergencyPhone)
                .emergencyContactRelation(emergencyRel)
                .build();
        employeeProfileRepository.save(profile);

        return saved;
    }
}
