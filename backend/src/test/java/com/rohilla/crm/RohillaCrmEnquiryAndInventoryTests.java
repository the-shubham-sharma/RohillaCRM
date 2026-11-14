package com.rohilla.crm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rohilla.crm.auth.dto.LoginRequest;
import com.rohilla.crm.enquiry.dto.EnquiryCreateRequest;
import com.rohilla.crm.enquiry.dto.EnquiryLineItemRequest;
import com.rohilla.crm.enquiry.enums.*;
import com.rohilla.crm.enquiry.util.DimensionCalculator;
import com.rohilla.crm.inventory.dto.CreateInventoryItemRequest;
import com.rohilla.crm.inventory.dto.StockIssueRequest;
import com.rohilla.crm.inventory.dto.StockReserveRequest;
import com.rohilla.crm.project.dto.CreateProjectRequest;
import com.rohilla.crm.common.enums.Priority;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RohillaCrmEnquiryAndInventoryTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String managerToken;
    private String productionToken;
    private String designerToken;

    @BeforeEach
    void setupTokens() throws Exception {
        adminToken = obtainAccessToken("admin@rohilla.com", "password123");
        managerToken = obtainAccessToken("manager@rohilla.com", "password123");
        productionToken = obtainAccessToken("production@rohilla.com", "password123");
        designerToken = obtainAccessToken("designer@rohilla.com", "password123");
    }

    private String obtainAccessToken(String email, String password) throws Exception {
        LoginRequest req = new LoginRequest(email, password);
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        Map<?, ?> response = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
        Map<?, ?> data = (Map<?, ?>) response.get("data");
        return (String) data.get("accessToken");
    }

    @Test
    @DisplayName("DimensionCalculator: Accurately converts units and calculates single and double-sided areas")
    void testDimensionCalculator() {
        // 10ft x 20ft single sided -> 200 sq ft
        var res1 = DimensionCalculator.calculateArea(
                new BigDecimal("10"), new BigDecimal("20"), DimensionUnit.FEET, PrintSides.SINGLE_SIDED
        );
        assertEquals(new BigDecimal("200.00"), res1.getAreaPerSideSqFt());
        assertEquals(new BigDecimal("200.00"), res1.getTotalAreaSqFt());

        // 10ft x 20ft double sided -> 200 sq ft per side, 400 sq ft total
        var res2 = DimensionCalculator.calculateArea(
                new BigDecimal("10"), new BigDecimal("20"), DimensionUnit.FEET, PrintSides.DOUBLE_SIDED
        );
        assertEquals(new BigDecimal("200.00"), res2.getAreaPerSideSqFt());
        assertEquals(new BigDecimal("400.00"), res2.getTotalAreaSqFt());

        // 120 inches x 240 inches -> 10ft x 20ft -> 200 sq ft
        var res3 = DimensionCalculator.calculateArea(
                new BigDecimal("120"), new BigDecimal("240"), DimensionUnit.INCHES, PrintSides.SINGLE_SIDED
        );
        assertEquals(new BigDecimal("200.00"), res3.getAreaPerSideSqFt());
    }

    @Test
    @DisplayName("Front Office: Create and submit multi-service enquiry with automated calculations")
    void testCreateMultiServiceEnquiry() throws Exception {
        EnquiryLineItemRequest item1 = EnquiryLineItemRequest.builder()
                .serviceName("Flex Printing")
                .width(new BigDecimal("15"))
                .height(new BigDecimal("10"))
                .dimensionUnit(DimensionUnit.FEET)
                .quantity(2)
                .quantityUnit(QuantityUnit.PIECE)
                .printSides(PrintSides.DOUBLE_SIDED)
                .printingType(PrintingType.FULL_COLOUR)
                .installationRequired(true)
                .installationLocation("Sector 29 Market")
                .selectedMaterials(List.of("Frontlit Flex", "Eyelets/Grommets", "Rope"))
                .finishingRequirements(List.of("Eyelets", "Edge Folding", "On-Site Installation"))
                .remarks("High resolution print")
                .build();

        EnquiryLineItemRequest item2 = EnquiryLineItemRequest.builder()
                .serviceName("Standee")
                .width(new BigDecimal("3"))
                .height(new BigDecimal("6"))
                .dimensionUnit(DimensionUnit.FEET)
                .quantity(5)
                .quantityUnit(QuantityUnit.PIECE)
                .printSides(PrintSides.SINGLE_SIDED)
                .printingType(PrintingType.FULL_COLOUR)
                .selectedMaterials(List.of("Roll-up Standee Mechanism", "Printable Vinyl"))
                .finishingRequirements(List.of("Lamination", "Mounting"))
                .build();

        EnquiryCreateRequest req = EnquiryCreateRequest.builder()
                .clientName("Rahul Verma")
                .companyName("Verma Enterprises")
                .phone("9811009988")
                .alternatePhone("9811009977")
                .email("rahul@vermaent.com")
                .address("Shop 14, Commercial Complex, Gurugram")
                .gstNumber("06AAAAA1111A1Z1")
                .leadSource(LeadSource.WALK_IN)
                .isDraft(false)
                .priority(EnquiryPriority.URGENT)
                .expectedCompletionDate(LocalDate.now().plusDays(5))
                .quotationStatus(QuotationStatus.PENDING)
                .estimatedAmount(new BigDecimal("32000.00"))
                .designStatus(DesignRequirementStatus.CLIENT_PROVIDED)
                .customerRemarks("Needs delivery before Thursday evening")
                .lineItems(List.of(item1, item2))
                .build();

        MvcResult result = mockMvc.perform(post("/api/v1/enquiries")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.enquiryNumber", startsWith("ENQ-")))
                .andExpect(jsonPath("$.data.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.data.clientName").value("Rahul Verma"))
                .andExpect(jsonPath("$.data.lineItems", hasSize(2)))
                .andExpect(jsonPath("$.data.lineItems[0].totalAreaSqFt").value(300.0)) // 15x10 * 2 = 300
                .andReturn();

        Map<?, ?> resp = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
        Map<?, ?> data = (Map<?, ?>) resp.get("data");
        String enquiryId = (String) data.get("id");

        // Fetch detail
        mockMvc.perform(get("/api/v1/enquiries/" + enquiryId)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(enquiryId));
    }

    @Test
    @DisplayName("Front Office: Convert enquiry to project preserves links and blocks duplicate conversion")
    void testConvertEnquiryToProject() throws Exception {
        // Create an enquiry first
        EnquiryLineItemRequest item = EnquiryLineItemRequest.builder()
                .serviceName("ACP Signage")
                .width(new BigDecimal("12"))
                .height(new BigDecimal("4"))
                .dimensionUnit(DimensionUnit.FEET)
                .quantity(1)
                .selectedMaterials(List.of("ACP Sheet 3mm White", "Acrylic Sheet 3mm Cast Clear", "LED Module Samsung 1.2W IP68"))
                .finishingRequirements(List.of("Frame Fabrication", "LED Lighting", "On-Site Installation"))
                .build();

        EnquiryCreateRequest req = EnquiryCreateRequest.builder()
                .clientName("Anil Kapoor")
                .companyName("Kapoor Jewels")
                .phone("9822334455")
                .address("Jewellery Market, Chandni Chowk, Delhi")
                .leadSource(LeadSource.REFERRAL)
                .isDraft(false)
                .designStatus(DesignRequirementStatus.DESIGN_REQUIRED) // Path B
                .lineItems(List.of(item))
                .build();

        MvcResult createRes = mockMvc.perform(post("/api/v1/enquiries")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        Map<?, ?> createData = (Map<?, ?>) objectMapper.readValue(createRes.getResponse().getContentAsString(), Map.class).get("data");
        String enquiryId = (String) createData.get("id");
        String enquiryNum = (String) createData.get("enquiryNumber");

        // Convert to Project
        MvcResult convRes = mockMvc.perform(post("/api/v1/enquiries/" + enquiryId + "/convert")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.projectCode", startsWith("PRJ-")))
                .andExpect(jsonPath("$.data.customerProvidedDesign").value(false)) // Path B
                .andReturn();

        Map<?, ?> convData = (Map<?, ?>) objectMapper.readValue(convRes.getResponse().getContentAsString(), Map.class).get("data");
        String projectId = (String) convData.get("id");
        String projectCode = (String) convData.get("projectCode");

        // Verify Enquiry is now CONVERTED_TO_PROJECT
        mockMvc.perform(get("/api/v1/enquiries/" + enquiryId)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONVERTED_TO_PROJECT"))
                .andExpect(jsonPath("$.data.convertedProjectId").value(projectId))
                .andExpect(jsonPath("$.data.convertedProjectCode").value(projectCode));

        // Duplicate conversion must be REJECTED
        mockMvc.perform(post("/api/v1/enquiries/" + enquiryId + "/convert")
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("already been converted")));

        // Verify Project Detail contains enquiry reference and line items
        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.enquiryId").value(enquiryId))
                .andExpect(jsonPath("$.data.enquiryNumber").value(enquiryNum))
                .andExpect(jsonPath("$.data.lineItems", hasSize(1)))
                .andExpect(jsonPath("$.data.materialRequirements", not(empty())));
    }

    @Test
    @DisplayName("Inventory: Reserve stock and issue stock deducting physical inventory")
    void testInventoryReserveAndIssueFlow() throws Exception {
        // 1. Create a dedicated test inventory item
        CreateInventoryItemRequest itemReq = CreateInventoryItemRequest.builder()
                .itemCode("TEST-MAT-" + System.currentTimeMillis() % 100000)
                .name("High Impact Acrylic 5mm")
                .category("Sheets & Boards")
                .unit("Sheet")
                .initialStock(new BigDecimal("100.00"))
                .reorderLevel(new BigDecimal("20.00"))
                .build();

        MvcResult itemRes = mockMvc.perform(post("/api/v1/inventory/items")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(itemReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Map<?, ?> itemData = (Map<?, ?>) objectMapper.readValue(itemRes.getResponse().getContentAsString(), Map.class).get("data");
        String itemId = (String) itemData.get("id");

        // 2. Create Project directly with line items using this material
        EnquiryLineItemRequest lineItem = EnquiryLineItemRequest.builder()
                .serviceName("Sign Board")
                .width(new BigDecimal("10"))
                .height(new BigDecimal("5"))
                .dimensionUnit(DimensionUnit.FEET)
                .quantity(1)
                .selectedMaterials(List.of("High Impact Acrylic 5mm"))
                .build();

        CreateProjectRequest projReq = CreateProjectRequest.builder()
                .projectCode("PRJ-TEST-" + System.currentTimeMillis() % 100000)
                .title("Acrylic Signage Test Project")
                .clientName("Apex Retail Brands Ltd.")
                .clientPhone("9811007700")
                .clientAddress("Gurugram")
                .priority(Priority.MEDIUM)
                .lineItems(List.of(lineItem))
                .build();

        MvcResult projRes = mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(projReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Map<?, ?> projData = (Map<?, ?>) objectMapper.readValue(projRes.getResponse().getContentAsString(), Map.class).get("data");
        String projectId = (String) projData.get("id");

        // 3. Get Project Material Requirements
        MvcResult reqsRes = mockMvc.perform(get("/api/v1/inventory/projects/" + projectId)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andReturn();

        List<?> reqs = (List<?>) objectMapper.readValue(reqsRes.getResponse().getContentAsString(), Map.class).get("data");
        Map<?, ?> firstReq = (Map<?, ?>) reqs.get(0);
        String requirementId = (String) firstReq.get("id");

        // 4. Reserve 25 units
        StockReserveRequest reserveReq = StockReserveRequest.builder()
                .requirementId(java.util.UUID.fromString(requirementId))
                .quantity(new BigDecimal("25.00"))
                .notes("Reserved for CNC cutting")
                .build();

        mockMvc.perform(post("/api/v1/inventory/projects/" + projectId + "/reserve")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reserveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.reservedQuantity").value(25.0));

        // Verify item stock: currentStock = 100, reservedStock = 25, available = 75
        mockMvc.perform(get("/api/v1/inventory/items/" + itemId)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentStock").value(100.0))
                .andExpect(jsonPath("$.data.reservedStock").value(25.0))
                .andExpect(jsonPath("$.data.availableStock").value(75.0));

        // 5. Issue 25 units (Authorized issue deducts currentStock)
        StockIssueRequest issueReq = StockIssueRequest.builder()
                .requirementId(java.util.UUID.fromString(requirementId))
                .quantity(new BigDecimal("25.00"))
                .notes("Issued to print master")
                .build();

        mockMvc.perform(post("/api/v1/inventory/projects/" + projectId + "/issue")
                        .header("Authorization", "Bearer " + productionToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(issueReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.issuedQuantity").value(25.0));

        // Verify stock deducted: currentStock should now be 75 (100 - 25)!
        mockMvc.perform(get("/api/v1/inventory/items/" + itemId)
                        .header("Authorization", "Bearer " + managerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentStock").value(75.0));
    }
}
