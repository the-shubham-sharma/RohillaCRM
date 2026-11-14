package com.rohilla.crm.employee.service;

import com.rohilla.crm.audit.service.AuditService;
import com.rohilla.crm.common.exception.FileValidationException;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.common.util.KycMaskingUtils;
import com.rohilla.crm.employee.dto.EmployeeDocumentDto;
import com.rohilla.crm.employee.dto.UpdateProfileRequest;
import com.rohilla.crm.employee.dto.UserProfileDto;
import com.rohilla.crm.employee.dto.VerifyDocumentRequest;

import com.rohilla.crm.employee.entity.EmployeeDocument;
import com.rohilla.crm.employee.entity.EmployeeProfile;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.audit.enums.AuditAction;
import com.rohilla.crm.employee.enums.DocumentType;
import com.rohilla.crm.employee.enums.DocumentVerificationStatus;
import com.rohilla.crm.security.enums.RoleType;

import com.rohilla.crm.common.exception.FileValidationException;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.employee.repository.EmployeeDocumentRepository;
import com.rohilla.crm.employee.repository.EmployeeProfileRepository;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.security.authorization.SecurityUtils;
import com.rohilla.crm.common.util.KycMaskingUtils;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final EmployeeDocumentRepository employeeDocumentRepository;
    private final AuditService auditService;
    private final Tika tika = new Tika();

    @Value("${app.storage.upload-dir:./uploads}")
    private String uploadDirPath;

    private Path rootStoragePath;

    private static final Set<String> ALLOWED_KYC_EXTENSIONS = Set.of("pdf", "jpg", "jpeg", "png");
    private static final Set<String> ALLOWED_PHOTO_EXTENSIONS = Set.of("jpg", "jpeg", "png");
    private static final long MAX_KYC_FILE_SIZE = 10 * 1024 * 1024L; // 10MB
    private static final long MAX_PHOTO_FILE_SIZE = 5 * 1024 * 1024L; // 5MB
    private static final List<String> DANGEROUS_MIME_TYPES = Arrays.asList(
            "application/x-dosexec", "application/x-executable", "application/x-sh",
            "application/javascript", "text/javascript", "text/html", "image/svg+xml",
            "application/x-msdownload", "application/octet-stream; type=exe", "application/zip"
    );

    @PostConstruct
    public void init() {
        try {
            this.rootStoragePath = Paths.get(uploadDirPath).toAbsolutePath().normalize();
            Files.createDirectories(this.rootStoragePath);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory", e);
        }
    }

    private User getAuthenticatedUser() {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));
        return userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private boolean isCurrentCallerAdmin() {
        return SecurityUtils.getCurrentUserDetails()
                .map(u -> u.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(RoleType.ROLE_ADMIN.name())))
                .orElse(false);
    }

    @Transactional
    public EmployeeProfile getOrCreateProfile(User user) {
        return employeeProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    EmployeeProfile p = EmployeeProfile.builder()
                            .user(user)
                            .address(null)
                            .build();
                    return employeeProfileRepository.save(p);
                });
    }

    @Transactional
    public UserProfileDto getMyProfile() {
        User user = getAuthenticatedUser();
        EmployeeProfile profile = getOrCreateProfile(user);
        List<EmployeeDocument> currentDocs = employeeDocumentRepository.findAllByUserIdAndCurrentTrue(user.getId());
        return mapToProfileDto(user, profile, currentDocs, true);
    }

    @Transactional
    public UserProfileDto updateMyProfile(UpdateProfileRequest request) {
        User user = getAuthenticatedUser();
        EmployeeProfile profile = getOrCreateProfile(user);

        String oldSummary = String.format("Name: %s, Phone: %s, Address: %s",
                user.getFullName(), user.getPhone(), profile.getAddress());

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }

        if (request.getAddress() != null) {
            profile.setAddress(request.getAddress().trim());
        }
        if (request.getEmergencyContactName() != null) {
            profile.setEmergencyContactName(request.getEmergencyContactName().trim());
        }
        if (request.getEmergencyContactPhone() != null) {
            profile.setEmergencyContactPhone(request.getEmergencyContactPhone().trim());
        }
        if (request.getEmergencyContactRelation() != null) {
            profile.setEmergencyContactRelation(request.getEmergencyContactRelation().trim());
        }

        userRepository.save(user);
        employeeProfileRepository.save(profile);

        String newSummary = String.format("Name: %s, Phone: %s, Address: %s",
                user.getFullName(), user.getPhone(), profile.getAddress());

        auditService.publishAudit(
                user.getId(),
                user.getEmail(),
                user.getRoles().iterator().next().getName().name(),
                AuditAction.PROFILE_UPDATED,
                "USER_PROFILE",
                user.getId().toString(),
                oldSummary,
                newSummary,
                null,
                null
        );

        List<EmployeeDocument> currentDocs = employeeDocumentRepository.findAllByUserIdAndCurrentTrue(user.getId());
        return mapToProfileDto(user, profile, currentDocs, true);
    }

    @Transactional
    public UserProfileDto uploadProfilePhoto(MultipartFile file) {
        User user = getAuthenticatedUser();
        EmployeeProfile profile = getOrCreateProfile(user);

        if (file.isEmpty()) {
            throw new FileValidationException("Uploaded photo is empty");
        }
        if (file.getSize() > MAX_PHOTO_FILE_SIZE) {
            throw new FileValidationException("Profile photo file size exceeds the 5MB limit. Received: " + file.getSize() + " bytes");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new FileValidationException("Invalid file name");
        }

        String ext = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_PHOTO_EXTENSIONS.contains(ext)) {
            throw new FileValidationException("Profile photo must be JPG or PNG. Received: ." + ext);
        }

        // Magic bytes validation
        String detectedMime;
        try (InputStream is = file.getInputStream()) {
            detectedMime = tika.detect(is, originalFilename);
        } catch (IOException e) {
            throw new FileValidationException("Failed to inspect file magic bytes: " + e.getMessage());
        }

        if (detectedMime == null || (!detectedMime.startsWith("image/jpeg") && !detectedMime.startsWith("image/png"))) {
            throw new FileValidationException("Invalid photo image format detected: " + detectedMime);
        }

        String empId = user.getEmployeeId() != null ? user.getEmployeeId() : user.getId().toString();
        String safeName = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        String storageKey = "profile-photos/employee/" + empId + "/" + UUID.randomUUID() + "_" + safeName;

        try {
            Path targetPath = this.rootStoragePath.resolve(storageKey).normalize();
            if (!targetPath.startsWith(this.rootStoragePath)) {
                throw new FileValidationException("Invalid storage destination");
            }
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            profile.setProfilePhotoKey(storageKey);
            employeeProfileRepository.save(profile);

            auditService.publishAudit(
                    user.getId(),
                    user.getEmail(),
                    user.getRoles().iterator().next().getName().name(),
                    AuditAction.PROFILE_PHOTO_UPDATED,
                    "USER_PROFILE",
                    user.getId().toString(),
                    null,
                    "Updated profile photo: " + originalFilename + " (" + file.getSize() + " bytes)",
                    null,
                    null
            );

            List<EmployeeDocument> currentDocs = employeeDocumentRepository.findAllByUserIdAndCurrentTrue(user.getId());
            return mapToProfileDto(user, profile, currentDocs, true);
        } catch (IOException e) {
            throw new RuntimeException("Could not store profile photo", e);
        }
    }

    @Transactional(readOnly = true)
    public Resource loadProfilePhotoResource(UUID userId) {
        EmployeeProfile profile = employeeProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for user: " + userId));

        if (profile.getProfilePhotoKey() == null) {
            throw new ResourceNotFoundException("No profile photo uploaded");
        }

        try {
            Path filePath = this.rootStoragePath.resolve(profile.getProfilePhotoKey()).normalize();
            Resource resource = new FileSystemResource(filePath.toFile());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Profile photo file not found on disk");
            }
        } catch (Exception e) {
            throw new ResourceNotFoundException("Profile photo file not found");
        }
    }

    @Transactional
    public EmployeeDocumentDto uploadKycDocument(DocumentType documentType, MultipartFile file, String rawDocumentNumber) {
        User user = getAuthenticatedUser();
        if (file.isEmpty()) {
            throw new FileValidationException("Uploaded document is empty");
        }
        if (file.getSize() > MAX_KYC_FILE_SIZE) {
            throw new FileValidationException("KYC document file size exceeds the 10MB limit. Received: " + file.getSize() + " bytes");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new FileValidationException("Invalid file name");
        }

        String ext = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_KYC_EXTENSIONS.contains(ext)) {
            throw new FileValidationException("File type '." + ext + "' is not permitted for KYC documents. Allowed: " + ALLOWED_KYC_EXTENSIONS);
        }

        String detectedMime;
        try (InputStream is = file.getInputStream()) {
            detectedMime = tika.detect(is, originalFilename);
        } catch (IOException e) {
            throw new FileValidationException("Failed to inspect file magic bytes: " + e.getMessage());
        }

        if (detectedMime != null) {
            for (String dangerous : DANGEROUS_MIME_TYPES) {
                if (detectedMime.equalsIgnoreCase(dangerous)) {
                    log.warn("Blocked dangerous KYC file upload: file={}, detectedMime={}", originalFilename, detectedMime);
                    throw new FileValidationException("File rejected due to security policy: " + detectedMime);
                }
            }
        }

        // Strict KYC format check: PDF, JPEG, or PNG only
        if (detectedMime == null || (!detectedMime.equals("application/pdf") && !detectedMime.startsWith("image/jpeg") && !detectedMime.startsWith("image/png"))) {
            throw new FileValidationException("Invalid KYC document format. Must be PDF, JPEG, or PNG. Detected: " + detectedMime);
        }

        // Determine version & archive previous current documents
        List<EmployeeDocument> existingDocs = employeeDocumentRepository.findAllByUserIdAndDocumentTypeOrderByVersionDesc(user.getId(), documentType);
        int nextVersion = existingDocs.isEmpty() ? 1 : existingDocs.get(0).getVersion() + 1;

        for (EmployeeDocument doc : existingDocs) {
            if (doc.isCurrent()) {
                doc.setCurrent(false);
                employeeDocumentRepository.save(doc);
            }
        }

        String empId = user.getEmployeeId() != null ? user.getEmployeeId() : user.getId().toString();
        String safeName = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        String storageKey = "employee-documents/employee/" + empId + "/" + documentType.name().toLowerCase() + "/" + UUID.randomUUID() + "_" + safeName;

        try {
            Path targetPath = this.rootStoragePath.resolve(storageKey).normalize();
            if (!targetPath.startsWith(this.rootStoragePath)) {
                throw new FileValidationException("Invalid storage destination");
            }
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String maskedNumber = null;
            if (rawDocumentNumber != null && !rawDocumentNumber.isBlank()) {
                maskedNumber = (documentType == DocumentType.AADHAAR)
                        ? KycMaskingUtils.maskAadhaar(rawDocumentNumber)
                        : KycMaskingUtils.maskPan(rawDocumentNumber);
            }

            EmployeeDocument newDoc = EmployeeDocument.builder()
                    .user(user)
                    .documentType(documentType)
                    .documentNumberMasked(maskedNumber)
                    .storageKey(storageKey)
                    .originalFileName(originalFilename)
                    .mimeType(detectedMime != null ? detectedMime : "application/octet-stream")
                    .fileSize(file.getSize())
                    .status(DocumentVerificationStatus.UPLOADED)
                    .uploadedAt(Instant.now())
                    .version(nextVersion)
                    .current(true)
                    .build();

            EmployeeDocument saved = employeeDocumentRepository.save(newDoc);

            AuditAction action = (nextVersion == 1) ? AuditAction.DOCUMENT_UPLOADED : AuditAction.DOCUMENT_REPLACED;
            auditService.publishAudit(
                    user.getId(),
                    user.getEmail(),
                    user.getRoles().iterator().next().getName().name(),
                    action,
                    "EMPLOYEE_DOCUMENT",
                    saved.getId().toString(),
                    null,
                    "Uploaded " + documentType.name() + " document (v" + nextVersion + ", " + originalFilename + ")",
                    null,
                    null
            );

            return mapToDocumentDto(saved);
        } catch (IOException e) {
            throw new RuntimeException("Could not store KYC document", e);
        }
    }

    @Transactional(readOnly = true)
    public Resource loadKycDocumentResource(UUID documentId) {
        EmployeeDocument doc = employeeDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        boolean isOwner = doc.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(RoleType.ROLE_ADMIN.name()));

        if (!isOwner && !isAdmin) {
            auditService.publishAudit(
                    currentUser.getId(),
                    currentUser.getUsername(),
                    "USER",
                    AuditAction.ACCESS_DENIED_ATTEMPT,
                    "EMPLOYEE_DOCUMENT",
                    documentId.toString(),
                    null,
                    "Unauthorized IDOR attempt to download KYC document of user " + doc.getUser().getEmail(),
                    null,
                    null
            );
            throw new UnauthorizedActionException("Access denied: You are not authorized to access this employee's KYC documents.");
        }

        try {
            Path filePath = this.rootStoragePath.resolve(doc.getStorageKey()).normalize();
            Resource resource = new FileSystemResource(filePath.toFile());
            if (resource.exists() && resource.isReadable()) {
                auditService.publishAudit(
                        currentUser.getId(),
                        currentUser.getUsername(),
                        isAdmin ? "ROLE_ADMIN" : "USER",
                        AuditAction.DOCUMENT_DOWNLOADED,
                        "EMPLOYEE_DOCUMENT",
                        documentId.toString(),
                        null,
                        "Downloaded " + doc.getDocumentType() + " document (v" + doc.getVersion() + ") for employee " + doc.getUser().getEmployeeId(),
                        null,
                        null
                );
                return resource;
            } else {
                throw new ResourceNotFoundException("Document file not found on disk: " + doc.getOriginalFileName());
            }
        } catch (Exception e) {
            throw new ResourceNotFoundException("Document file not found: " + doc.getOriginalFileName());
        }
    }

    @Transactional
    public EmployeeDocumentDto verifyKycDocument(UUID documentId, VerifyDocumentRequest request) {
        if (!isCurrentCallerAdmin()) {
            throw new UnauthorizedActionException("Only System Administrators can verify or reject employee KYC documents.");
        }

        EmployeeDocument doc = employeeDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));

        if (request.getStatus() == DocumentVerificationStatus.REJECTED) {
            if (request.getRejectionReason() == null || request.getRejectionReason().trim().isBlank()) {
                throw new IllegalArgumentException("Rejection reason is required when rejecting an identity document.");
            }
            doc.setStatus(DocumentVerificationStatus.REJECTED);
            doc.setRejectionReason(request.getRejectionReason().trim());
        } else if (request.getStatus() == DocumentVerificationStatus.VERIFIED) {
            doc.setStatus(DocumentVerificationStatus.VERIFIED);
            doc.setRejectionReason(null);
        } else if (request.getStatus() == DocumentVerificationStatus.UNDER_REVIEW) {
            doc.setStatus(DocumentVerificationStatus.UNDER_REVIEW);
        }

        User adminUser = getAuthenticatedUser();
        doc.setVerifiedAt(Instant.now());
        doc.setVerifiedBy(adminUser);

        if (request.getDocumentNumber() != null && !request.getDocumentNumber().isBlank()) {
            String masked = (doc.getDocumentType() == DocumentType.AADHAAR)
                    ? KycMaskingUtils.maskAadhaar(request.getDocumentNumber())
                    : KycMaskingUtils.maskPan(request.getDocumentNumber());
            doc.setDocumentNumberMasked(masked);
        }

        EmployeeDocument saved = employeeDocumentRepository.save(doc);

        AuditAction action = (request.getStatus() == DocumentVerificationStatus.VERIFIED)
                ? AuditAction.DOCUMENT_VERIFIED : AuditAction.DOCUMENT_REJECTED;

        auditService.publishAudit(
                adminUser.getId(),
                adminUser.getEmail(),
                "ROLE_ADMIN",
                action,
                "EMPLOYEE_DOCUMENT",
                saved.getId().toString(),
                null,
                String.format("%s %s document (v%d) for employee %s (%s). %s",
                        saved.getStatus(), saved.getDocumentType(), saved.getVersion(),
                        saved.getUser().getFullName(), saved.getUser().getEmployeeId(),
                        saved.getRejectionReason() != null ? "Reason: " + saved.getRejectionReason() : ""),
                null,
                null
        );

        return mapToDocumentDto(saved);
    }

    @Transactional(readOnly = true)
    public UserProfileDto getEmployeeProfileByUserId(UUID userId) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        boolean isSelf = currentUser.getId().equals(userId);
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(RoleType.ROLE_ADMIN.name()));
        boolean isManager = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(RoleType.ROLE_MANAGER.name()));

        if (!isSelf && !isAdmin && !isManager) {
            throw new UnauthorizedActionException("Access denied to employee profile.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        EmployeeProfile profile = employeeProfileRepository.findByUserId(userId).orElse(null);

        // Sensitive KYC documents: only exposed to Self or Admin (Managers see basic overview only)
        List<EmployeeDocument> currentDocs = (isSelf || isAdmin)
                ? employeeDocumentRepository.findAllByUserIdAndCurrentTrue(userId)
                : Collections.emptyList();

        return mapToProfileDto(user, profile, currentDocs, isSelf || isAdmin);
    }

    @Transactional(readOnly = true)
    public List<EmployeeDocumentDto> getDocumentHistory(UUID userId, DocumentType documentType) {
        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        boolean isSelf = currentUser.getId().equals(userId);
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(RoleType.ROLE_ADMIN.name()));

        if (!isSelf && !isAdmin) {
            throw new UnauthorizedActionException("Access denied to employee document history.");
        }

        return employeeDocumentRepository.findAllByUserIdAndDocumentTypeOrderByVersionDesc(userId, documentType)
                .stream()
                .map(this::mapToDocumentDto)
                .collect(Collectors.toList());
    }

    public UserProfileDto mapToProfileDto(User user, EmployeeProfile profile, List<EmployeeDocument> currentDocs, boolean includeDocuments) {
        List<RoleType> roles = user.getRoles().stream()
                .map(r -> r.getName())
                .collect(Collectors.toList());

        boolean hasPhoto = profile != null && profile.getProfilePhotoKey() != null;
        String photoUrl = hasPhoto ? "/api/v1/profile/photo" : null;

        List<EmployeeDocumentDto> docDtos = Collections.emptyList();
        if (includeDocuments && currentDocs != null) {
            docDtos = currentDocs.stream()
                    .map(this::mapToDocumentDto)
                    .collect(Collectors.toList());
        }

        return UserProfileDto.builder()
                .id(user.getId())
                .employeeId(user.getEmployeeId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .department(user.getDepartment())
                .status(user.getStatus())
                .roles(roles)
                .joiningDate(user.getJoiningDate() != null ? user.getJoiningDate() : (user.getCreatedAt() != null ? user.getCreatedAt().atZone(java.time.ZoneId.systemDefault()).toLocalDate() : java.time.LocalDate.now()))
                .address(profile != null ? profile.getAddress() : null)
                .emergencyContactName(profile != null ? profile.getEmergencyContactName() : null)
                .emergencyContactPhone(profile != null ? profile.getEmergencyContactPhone() : null)
                .emergencyContactRelation(profile != null ? profile.getEmergencyContactRelation() : null)
                .hasProfilePhoto(hasPhoto)
                .profilePhotoUrl(photoUrl)
                .documents(docDtos)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    public EmployeeDocumentDto mapToDocumentDto(EmployeeDocument doc) {
        if (doc == null) return null;
        return EmployeeDocumentDto.builder()
                .id(doc.getId())
                .documentType(doc.getDocumentType())
                .documentNumberMasked(doc.getDocumentNumberMasked())
                .originalFileName(doc.getOriginalFileName())
                .mimeType(doc.getMimeType())
                .fileSize(doc.getFileSize())
                .status(doc.getStatus())
                .uploadedAt(doc.getUploadedAt())
                .verifiedAt(doc.getVerifiedAt())
                .verifiedByName(doc.getVerifiedBy() != null ? doc.getVerifiedBy().getFullName() : null)
                .rejectionReason(doc.getRejectionReason())
                .version(doc.getVersion())
                .current(doc.isCurrent())
                .build();
    }

    private String getFileExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        return (dotIndex == -1) ? "" : fileName.substring(dotIndex + 1);
    }
}
