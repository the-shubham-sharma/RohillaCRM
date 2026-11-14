package com.rohilla.crm;

import com.rohilla.crm.common.exception.FileValidationException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.common.util.KycMaskingUtils;
import com.rohilla.crm.employee.dto.CreateUserRequest;
import com.rohilla.crm.employee.dto.EmployeeDocumentDto;
import com.rohilla.crm.employee.dto.UpdateProfileRequest;
import com.rohilla.crm.employee.dto.UserProfileDto;
import com.rohilla.crm.employee.dto.UserSummaryDto;
import com.rohilla.crm.employee.dto.VerifyDocumentRequest;
import com.rohilla.crm.security.entity.Role;

import com.rohilla.crm.audit.entity.AuditLog;
import com.rohilla.crm.employee.entity.EmployeeDocument;
import com.rohilla.crm.employee.entity.EmployeeProfile;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.audit.enums.AuditAction;
import com.rohilla.crm.common.enums.DepartmentType;
import com.rohilla.crm.employee.enums.DocumentType;
import com.rohilla.crm.employee.enums.DocumentVerificationStatus;
import com.rohilla.crm.security.enums.RoleType;
import com.rohilla.crm.employee.enums.UserStatus;

import com.rohilla.crm.common.exception.FileValidationException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.audit.repository.AuditLogRepository;
import com.rohilla.crm.employee.repository.EmployeeDocumentRepository;
import com.rohilla.crm.employee.repository.EmployeeProfileRepository;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.employee.service.ProfileService;
import com.rohilla.crm.employee.service.UserService;
import com.rohilla.crm.common.util.KycMaskingUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class RohillaCrmProfileAndKycTests {

    @Autowired
    private ProfileService profileService;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeProfileRepository employeeProfileRepository;

    @Autowired
    private EmployeeDocumentRepository employeeDocumentRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private User adminUser;
    private User designerUser;
    private User productionUser;

    // Standard valid magic-byte byte arrays
    private static final byte[] VALID_PDF_BYTES = "%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF".getBytes(StandardCharsets.ISO_8859_1);
    private static final byte[] VALID_JPEG_BYTES = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, (byte) 0xFF, (byte) 0xD9};
    private static final byte[] VALID_PNG_BYTES = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, (byte) 0xC4, (byte) 0x89};
    private static final byte[] FAKE_PDF_TEXT_BYTES = "Hello world this is not a real pdf".getBytes(StandardCharsets.UTF_8);

    @BeforeEach
    void setUp() {
        adminUser = userRepository.findByEmail("admin@rohilla.com")
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName() == RoleType.ROLE_ADMIN))
                        .findFirst().orElseThrow());

        designerUser = userRepository.findByEmail("designer@rohilla.com")
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName() == RoleType.ROLE_DESIGNER))
                        .findFirst().orElseThrow());

        productionUser = userRepository.findByEmail("production@rohilla.com")
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName() == RoleType.ROLE_PRODUCTION))
                        .findFirst().orElseThrow());
    }

    private void authenticateAs(User user) {
        CustomUserDetails userDetails = new CustomUserDetails(user);
        Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Scenario 1: Employee can view own profile with complete details")
    void testEmployeeCanViewOwnProfile() {
        authenticateAs(designerUser);

        UserProfileDto profileDto = profileService.getMyProfile();

        assertNotNull(profileDto);
        assertEquals(designerUser.getId(), profileDto.getId());
        assertEquals(designerUser.getEmail(), profileDto.getEmail());
        assertEquals(designerUser.getFullName(), profileDto.getFullName());
        assertEquals(DepartmentType.DESIGN, profileDto.getDepartment());
        assertNotNull(profileDto.getEmployeeId());
        assertTrue(profileDto.getEmployeeId().startsWith("EMP-"));
    }

    @Test
    @DisplayName("Scenario 2: Employee can edit editable profile fields (Phone, Address, Emergency Contact)")
    void testEmployeeCanEditAllowedFields() {
        authenticateAs(designerUser);

        UpdateProfileRequest updateReq = UpdateProfileRequest.builder()
                .fullName("Designer Rahul Updated")
                .phone("+919876543210")
                .address("Flat 402, Sunshine Heights, Gurgaon, Haryana 122001")
                .emergencyContactName("Sunita Sharma")
                .emergencyContactPhone("+919876500000")
                .emergencyContactRelation("Spouse")
                .build();

        UserProfileDto updatedProfile = profileService.updateMyProfile(updateReq);

        assertEquals("Designer Rahul Updated", updatedProfile.getFullName());
        assertEquals("+919876543210", updatedProfile.getPhone());
        assertEquals("Flat 402, Sunshine Heights, Gurgaon, Haryana 122001", updatedProfile.getAddress());
        assertEquals("Sunita Sharma", updatedProfile.getEmergencyContactName());
        assertEquals("+919876500000", updatedProfile.getEmergencyContactPhone());
        assertEquals("Spouse", updatedProfile.getEmergencyContactRelation());
    }

    @Test
    @DisplayName("Scenario 3: Employee cannot modify immutable fields (Role, Department, Employee ID, Status, Login Email)")
    void testEmployeeCannotModifyImmutableFields() {
        authenticateAs(designerUser);

        String originalEmployeeId = designerUser.getEmployeeId();
        DepartmentType originalDepartment = designerUser.getDepartment();
        String originalEmail = designerUser.getEmail();

        UpdateProfileRequest updateReq = UpdateProfileRequest.builder()
                .fullName("Designer Rahul")
                .phone("+919876543210")
                .address("New Address")
                .build();

        UserProfileDto updatedProfile = profileService.updateMyProfile(updateReq);

        // Verification: immutable fields remain unchanged
        assertEquals(originalEmployeeId, updatedProfile.getEmployeeId());
        assertEquals(originalDepartment, updatedProfile.getDepartment());
        assertEquals(originalEmail, updatedProfile.getEmail());
        assertEquals(UserStatus.ACTIVE, updatedProfile.getStatus());
        assertTrue(updatedProfile.getRoles().contains(RoleType.ROLE_DESIGNER));
    }

    @Test
    @DisplayName("Scenario 4: Employee can upload Aadhaar card (PDF / JPEG / PNG) validated by Apache Tika")
    void testEmployeeCanUploadAadhaarCard() {
        authenticateAs(designerUser);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "aadhaar_card.pdf",
                "application/pdf",
                VALID_PDF_BYTES
        );

        EmployeeDocumentDto docDto = profileService.uploadKycDocument(DocumentType.AADHAAR, file, "123456789012");

        assertNotNull(docDto);
        assertEquals(DocumentType.AADHAAR, docDto.getDocumentType());
        assertEquals(DocumentVerificationStatus.UPLOADED, docDto.getStatus());
        assertEquals("XXXX XXXX 9012", docDto.getDocumentNumberMasked());
        assertEquals(1, docDto.getVersion());
        assertTrue(docDto.isCurrent());
    }

    @Test
    @DisplayName("Scenario 5: Employee can upload PAN card with valid masked number")
    void testEmployeeCanUploadPanCard() {
        authenticateAs(designerUser);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "pan_card.jpg",
                "image/jpeg",
                VALID_JPEG_BYTES
        );

        EmployeeDocumentDto docDto = profileService.uploadKycDocument(DocumentType.PAN, file, "ABCDE1234F");

        assertNotNull(docDto);
        assertEquals(DocumentType.PAN, docDto.getDocumentType());
        assertEquals(DocumentVerificationStatus.UPLOADED, docDto.getStatus());
        assertEquals("XXXXX1234F", docDto.getDocumentNumberMasked());
        assertEquals(1, docDto.getVersion());
        assertTrue(docDto.isCurrent());
    }

    @Test
    @DisplayName("Scenario 6: Upload invalid file type (fake PDF with text/plain content) is rejected by Apache Tika")
    void testUploadInvalidFileTypeRejectedByTika() {
        authenticateAs(designerUser);

        MockMultipartFile fakeFile = new MockMultipartFile(
                "file",
                "fake_aadhaar.pdf",
                "application/pdf",
                FAKE_PDF_TEXT_BYTES
        );

        assertThrows(FileValidationException.class, () ->
                profileService.uploadKycDocument(DocumentType.AADHAAR, fakeFile, "123456789012")
        );
    }

    @Test
    @DisplayName("Scenario 7: Upload file exceeding 10MB limit is rejected")
    void testUploadFileExceedingLimitRejected() {
        authenticateAs(designerUser);

        // Create mock file over 10MB
        byte[] largeBytes = new byte[10 * 1024 * 1024 + 1024];
        System.arraycopy(VALID_PDF_BYTES, 0, largeBytes, 0, VALID_PDF_BYTES.length);

        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "large_doc.pdf",
                "application/pdf",
                largeBytes
        );

        assertThrows(FileValidationException.class, () ->
                profileService.uploadKycDocument(DocumentType.AADHAAR, largeFile, "123456789012")
        );
    }

    @Test
    @DisplayName("Scenario 8: IDOR Test - Employee cannot access another employee's profile or download documents")
    void testIdorNonAdminCannotAccessOtherEmployeeDocuments() {
        // Step 1: Designer uploads Aadhaar
        authenticateAs(designerUser);
        MockMultipartFile file = new MockMultipartFile("file", "aadhaar.pdf", "application/pdf", VALID_PDF_BYTES);
        EmployeeDocumentDto docDto = profileService.uploadKycDocument(DocumentType.AADHAAR, file, "123456789012");

        // Step 2: Production user tries to access Designer's document or profile -> Blocked with UnauthorizedActionException
        authenticateAs(productionUser);

        assertThrows(UnauthorizedActionException.class, () ->
                profileService.getEmployeeProfileByUserId(designerUser.getId())
        );

        assertThrows(UnauthorizedActionException.class, () ->
                profileService.loadKycDocumentResource(docDto.getId())
        );
    }

    @Test
    @DisplayName("Scenario 9: Admin/Owner can view any employee's profile")
    void testAdminCanViewAnyEmployeeProfile() {
        authenticateAs(adminUser);

        UserProfileDto designerProfile = profileService.getEmployeeProfileByUserId(designerUser.getId());

        assertNotNull(designerProfile);
        assertEquals(designerUser.getId(), designerProfile.getId());
        assertEquals(designerUser.getEmail(), designerProfile.getEmail());
    }

    @Test
    @DisplayName("Scenario 10: Admin can verify Aadhaar card (status becomes VERIFIED, verifiedByName recorded)")
    void testAdminCanVerifyAadhaarCard() {
        // Designer uploads Aadhaar
        authenticateAs(designerUser);
        MockMultipartFile file = new MockMultipartFile("file", "aadhaar.pdf", "application/pdf", VALID_PDF_BYTES);
        EmployeeDocumentDto docDto = profileService.uploadKycDocument(DocumentType.AADHAAR, file, "123456789012");

        // Admin verifies
        authenticateAs(adminUser);
        VerifyDocumentRequest verifyReq = VerifyDocumentRequest.builder()
                .status(DocumentVerificationStatus.VERIFIED)
                .build();

        EmployeeDocumentDto verifiedDoc = profileService.verifyKycDocument(docDto.getId(), verifyReq);

        assertEquals(DocumentVerificationStatus.VERIFIED, verifiedDoc.getStatus());
        assertNotNull(verifiedDoc.getVerifiedAt());
        assertEquals(adminUser.getFullName(), verifiedDoc.getVerifiedByName());
    }

    @Test
    @DisplayName("Scenario 11: Admin can verify PAN card")
    void testAdminCanVerifyPanCard() {
        // Designer uploads PAN
        authenticateAs(designerUser);
        MockMultipartFile file = new MockMultipartFile("file", "pan.png", "image/png", VALID_PNG_BYTES);
        EmployeeDocumentDto docDto = profileService.uploadKycDocument(DocumentType.PAN, file, "ABCDE1234F");

        // Admin verifies
        authenticateAs(adminUser);
        VerifyDocumentRequest verifyReq = VerifyDocumentRequest.builder()
                .status(DocumentVerificationStatus.VERIFIED)
                .build();

        EmployeeDocumentDto verifiedDoc = profileService.verifyKycDocument(docDto.getId(), verifyReq);

        assertEquals(DocumentVerificationStatus.VERIFIED, verifiedDoc.getStatus());
        assertNotNull(verifiedDoc.getVerifiedAt());
    }

    @Test
    @DisplayName("Scenario 12: Admin can reject document with mandatory rejection reason")
    void testAdminCanRejectDocumentWithReason() {
        // Designer uploads Aadhaar
        authenticateAs(designerUser);
        MockMultipartFile file = new MockMultipartFile("file", "aadhaar.pdf", "application/pdf", VALID_PDF_BYTES);
        EmployeeDocumentDto docDto = profileService.uploadKycDocument(DocumentType.AADHAAR, file, "123456789012");

        // Admin rejects
        authenticateAs(adminUser);
        VerifyDocumentRequest rejectReq = VerifyDocumentRequest.builder()
                .status(DocumentVerificationStatus.REJECTED)
                .rejectionReason("Scanned copy is blurred and name is illegible")
                .build();

        EmployeeDocumentDto rejectedDoc = profileService.verifyKycDocument(docDto.getId(), rejectReq);

        assertEquals(DocumentVerificationStatus.REJECTED, rejectedDoc.getStatus());
        assertEquals("Scanned copy is blurred and name is illegible", rejectedDoc.getRejectionReason());
    }

    @Test
    @DisplayName("Scenario 13: Admin reject document fails if rejection reason is empty or null")
    void testAdminRejectDocumentFailsWithoutReason() {
        // Designer uploads Aadhaar
        authenticateAs(designerUser);
        MockMultipartFile file = new MockMultipartFile("file", "aadhaar.pdf", "application/pdf", VALID_PDF_BYTES);
        EmployeeDocumentDto docDto = profileService.uploadKycDocument(DocumentType.AADHAAR, file, "123456789012");

        // Admin attempts reject with empty reason
        authenticateAs(adminUser);
        VerifyDocumentRequest rejectReq = VerifyDocumentRequest.builder()
                .status(DocumentVerificationStatus.REJECTED)
                .rejectionReason("   ")
                .build();

        assertThrows(IllegalArgumentException.class, () ->
                profileService.verifyKycDocument(docDto.getId(), rejectReq)
        );
    }

    @Test
    @DisplayName("Scenario 14: Employee can re-upload rejected document (v2 created, previous archived with isCurrent=false)")
    void testEmployeeCanReUploadRejectedDocument() {
        // Step 1: Upload v1
        authenticateAs(designerUser);
        MockMultipartFile file1 = new MockMultipartFile("file", "aadhaar_v1.pdf", "application/pdf", VALID_PDF_BYTES);
        EmployeeDocumentDto doc1 = profileService.uploadKycDocument(DocumentType.AADHAAR, file1, "123456789012");

        // Step 2: Admin rejects v1
        authenticateAs(adminUser);
        VerifyDocumentRequest rejectReq = VerifyDocumentRequest.builder()
                .status(DocumentVerificationStatus.REJECTED)
                .rejectionReason("Blurry image")
                .build();
        profileService.verifyKycDocument(doc1.getId(), rejectReq);

        // Step 3: Employee uploads v2 replacement
        authenticateAs(designerUser);
        MockMultipartFile file2 = new MockMultipartFile("file", "aadhaar_v2_clear.pdf", "application/pdf", VALID_PDF_BYTES);
        EmployeeDocumentDto doc2 = profileService.uploadKycDocument(DocumentType.AADHAAR, file2, "123456789012");

        assertEquals(2, doc2.getVersion());
        assertTrue(doc2.isCurrent());
        assertEquals(DocumentVerificationStatus.UPLOADED, doc2.getStatus());

        // Step 4: Verify v1 in repository is no longer current
        EmployeeDocument v1Entity = employeeDocumentRepository.findById(doc1.getId()).orElseThrow();
        assertFalse(v1Entity.isCurrent());
        assertEquals(1, v1Entity.getVersion());
    }

    @Test
    @DisplayName("Scenario 15: Document version history is preserved and accessible")
    void testDocumentVersionHistoryPreserved() {
        authenticateAs(designerUser);

        // Upload v1
        MockMultipartFile file1 = new MockMultipartFile("file", "aadhaar_v1.pdf", "application/pdf", VALID_PDF_BYTES);
        profileService.uploadKycDocument(DocumentType.AADHAAR, file1, "123456789012");

        // Upload v2
        MockMultipartFile file2 = new MockMultipartFile("file", "aadhaar_v2.pdf", "application/pdf", VALID_PDF_BYTES);
        profileService.uploadKycDocument(DocumentType.AADHAAR, file2, "123456789012");

        List<EmployeeDocumentDto> history = profileService.getDocumentHistory(designerUser.getId(), DocumentType.AADHAAR);

        assertNotNull(history);
        assertEquals(2, history.size());
        assertEquals(2, history.get(0).getVersion()); // v2 is newest
        assertEquals(1, history.get(1).getVersion()); // v1
    }

    @Test
    @DisplayName("Scenario 16: Sensitive document numbers are masked in API responses")
    void testSensitiveDocumentNumbersMasked() {
        assertEquals("XXXX XXXX 9012", KycMaskingUtils.maskAadhaar("1234 5678 9012"));
        assertEquals("XXXX XXXX 9012", KycMaskingUtils.maskAadhaar("123456789012"));
        assertEquals("XXXXX1234F", KycMaskingUtils.maskPan("ABCDE1234F"));

        authenticateAs(designerUser);
        MockMultipartFile file = new MockMultipartFile("file", "aadhaar.pdf", "application/pdf", VALID_PDF_BYTES);
        EmployeeDocumentDto docDto = profileService.uploadKycDocument(DocumentType.AADHAAR, file, "987654321098");

        assertEquals("XXXX XXXX 1098", docDto.getDocumentNumberMasked());
    }

    @Test
    @DisplayName("Scenario 17: Sensitive document contents are never logged or stored in plaintext database columns")
    void testZeroPlaintextContentsInDatabase() {
        authenticateAs(designerUser);
        MockMultipartFile file = new MockMultipartFile("file", "aadhaar.pdf", "application/pdf", VALID_PDF_BYTES);
        EmployeeDocumentDto docDto = profileService.uploadKycDocument(DocumentType.AADHAAR, file, "111122223333");

        EmployeeDocument docEntity = employeeDocumentRepository.findById(docDto.getId()).orElseThrow();

        // Database entity should only store masked number and storage key UUID
        assertEquals("XXXX XXXX 3333", docEntity.getDocumentNumberMasked());
        assertNotNull(docEntity.getStorageKey());
        assertFalse(docEntity.getStorageKey().contains("111122223333"));
    }

    @Test
    @DisplayName("Scenario 18: Profile photo upload updates profile and stores image securely")
    void testProfilePhotoUpload() {
        authenticateAs(designerUser);

        MockMultipartFile photoFile = new MockMultipartFile(
                "file",
                "avatar.jpg",
                "image/jpeg",
                VALID_JPEG_BYTES
        );

        UserProfileDto updatedProfile = profileService.uploadProfilePhoto(photoFile);

        assertTrue(updatedProfile.isHasProfilePhoto());
        assertNotNull(updatedProfile.getProfilePhotoUrl());
        assertTrue(updatedProfile.getProfilePhotoUrl().contains("/photo"));
    }

    @Test
    @DisplayName("Scenario 19: Employee ID is auto-generated sequentially on creation (EMP-0001...)")
    void testEmployeeIdAutoGeneratedSequentially() {
        authenticateAs(adminUser);

        CreateUserRequest req1 = CreateUserRequest.builder()
                .fullName("Test Employee Alpha")
                .email("alpha_test@rohilla.com")
                .phone("+919999900001")
                .department(DepartmentType.DESIGN)
                .roles(Set.of(RoleType.ROLE_DESIGNER))
                .status(UserStatus.ACTIVE)
                .build();

        UserSummaryDto user1 = userService.createUser(req1);
        assertNotNull(user1.getEmployeeId());
        assertTrue(user1.getEmployeeId().matches("EMP-\\d{4}"));

        CreateUserRequest req2 = CreateUserRequest.builder()
                .fullName("Test Employee Beta")
                .email("beta_test@rohilla.com")
                .phone("+919999900002")
                .department(DepartmentType.PRODUCTION)
                .roles(Set.of(RoleType.ROLE_PRODUCTION))
                .status(UserStatus.ACTIVE)
                .build();

        UserSummaryDto user2 = userService.createUser(req2);
        assertNotNull(user2.getEmployeeId());
        assertTrue(user2.getEmployeeId().matches("EMP-\\d{4}"));

        // Compare sequence numbers
        int seq1 = Integer.parseInt(user1.getEmployeeId().substring(4));
        int seq2 = Integer.parseInt(user2.getEmployeeId().substring(4));
        assertEquals(seq1 + 1, seq2);
    }

    @Test
    @DisplayName("Scenario 20: Profile and KYC actions create comprehensive audit log entries")
    void testAuditTrailCreatedForProfileAndKycActions() {
        authenticateAs(designerUser);

        // Action 1: Update profile
        profileService.updateMyProfile(UpdateProfileRequest.builder().fullName("Designer Rahul Audit").build());

        // Action 2: Upload document
        MockMultipartFile file = new MockMultipartFile("file", "aadhaar.pdf", "application/pdf", VALID_PDF_BYTES);
        EmployeeDocumentDto docDto = profileService.uploadKycDocument(DocumentType.AADHAAR, file, "123456789012");

        // Action 3: Admin verifies document
        authenticateAs(adminUser);
        profileService.verifyKycDocument(docDto.getId(),
                VerifyDocumentRequest.builder().status(DocumentVerificationStatus.VERIFIED).build());

        List<AuditLog> auditLogs = auditLogRepository.findAll();

        boolean foundProfileUpdate = auditLogs.stream().anyMatch(l -> l.getAction() == AuditAction.PROFILE_UPDATED);
        boolean foundDocUpload = auditLogs.stream().anyMatch(l -> l.getAction() == AuditAction.DOCUMENT_UPLOADED);
        boolean foundDocVerify = auditLogs.stream().anyMatch(l -> l.getAction() == AuditAction.DOCUMENT_VERIFIED);

        assertTrue(foundProfileUpdate, "PROFILE_UPDATED audit log should exist");
        assertTrue(foundDocUpload, "DOCUMENT_UPLOADED audit log should exist");
        assertTrue(foundDocVerify, "DOCUMENT_VERIFIED audit log should exist");
    }
}
