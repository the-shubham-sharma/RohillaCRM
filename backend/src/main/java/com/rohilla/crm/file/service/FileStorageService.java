package com.rohilla.crm.file.service;

import com.rohilla.crm.audit.service.AuditService;
import com.rohilla.crm.client.entity.Client;
import com.rohilla.crm.common.exception.FileValidationException;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.security.entity.Permission;

import com.rohilla.crm.design.entity.DesignFile;
import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.audit.enums.AuditAction;
import com.rohilla.crm.security.enums.RoleType;
import com.rohilla.crm.common.exception.FileValidationException;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.design.repository.DesignFileRepository;
import com.rohilla.crm.project.repository.ProjectRepository;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.security.authorization.SecurityUtils;
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
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private final DesignFileRepository designFileRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final Tika tika = new Tika();

    @Value("${app.storage.upload-dir:./uploads}")
    private String uploadDirPath;

    private Path rootStoragePath;

    public enum FileCategory {
        DESIGN("design"),
        PRODUCTION("production"),
        QC("qc"),
        DISPATCH("dispatch"),
        INSTALLATION("installation");

        private final String folderName;

        FileCategory(String folderName) {
            this.folderName = folderName;
        }

        public String getFolderName() {
            return folderName;
        }
    }

    /**
     * Generates a safe, predictable storage key adhering to the standard directory layout:
     * projects/{projectId}/{category}/{uuid}_{sanitizedFilename}
     *
     * Files are stored outside source code in the designated storage root (./uploads),
     * preventing path traversal and protecting client confidentiality.
     */
    public String generateStorageKey(UUID projectId, String category, String originalFilename) {
        String sanitizedCategory = (category != null && !category.isBlank())
                ? category.toLowerCase().replaceAll("[^a-z0-9_-]", "")
                : "design";
        String safeName = (originalFilename != null && !originalFilename.isBlank())
                ? originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_")
                : "unnamed_file";
        while (safeName.contains("..")) {
            safeName = safeName.replace("..", "_");
        }
        return "projects/" + projectId + "/" + sanitizedCategory + "/" + UUID.randomUUID() + "_" + safeName;
    }

    // Allowed file extensions for Advertising CRM (designs, artworks, proofs, photos)
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "ai", "psd", "cdr", "png", "jpg", "jpeg", "tiff", "zip"
    );

    // Disallowed MIME types (Executables, Scripts, HTML, SVG XSS risks)
    private static final List<String> DANGEROUS_MIME_TYPES = Arrays.asList(
            "application/x-dosexec", "application/x-executable", "application/x-sh",
            "application/javascript", "text/javascript", "text/html", "image/svg+xml",
            "application/x-msdownload", "application/octet-stream; type=exe"
    );

    @PostConstruct
    public void init() {
        try {
            this.rootStoragePath = Paths.get(uploadDirPath).toAbsolutePath().normalize();
            Files.createDirectories(this.rootStoragePath);
            log.info("Secure file storage initialized at: {}", this.rootStoragePath);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize file storage directory", e);
        }
    }

    @Transactional
    public DesignFile storeDesignFile(UUID projectId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileValidationException("Uploaded file is empty");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new FileValidationException("Invalid file name");
        }

        // 1. Extension Validation
        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new FileValidationException("File type '." + extension + "' is not permitted. Allowed: " + ALLOWED_EXTENSIONS);
        }

        // 2. Magic Bytes / MIME Type Inspection via Apache Tika
        String detectedMimeType;
        try (InputStream is = file.getInputStream()) {
            detectedMimeType = tika.detect(is, originalFilename);
        } catch (IOException e) {
            throw new FileValidationException("Failed to inspect file magic bytes: " + e.getMessage());
        }

        if (detectedMimeType != null) {
            for (String dangerous : DANGEROUS_MIME_TYPES) {
                if (detectedMimeType.equalsIgnoreCase(dangerous)) {
                    log.warn("Blocked potentially malicious file upload: name={}, detectedMime={}",
                            originalFilename, detectedMimeType);
                    throw new FileValidationException("File rejected due to security policy: detected " + detectedMimeType);
                }
            }
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        User uploader = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // 3. Generate standardized, randomized storage key: projects/{projectId}/design/{uuid}_{safeName}
        String storageKey = generateStorageKey(projectId, FileCategory.DESIGN.getFolderName(), originalFilename);

        try {
            Path targetLocation = this.rootStoragePath.resolve(storageKey).normalize();
            // Prevent path traversal
            if (!targetLocation.startsWith(this.rootStoragePath)) {
                throw new FileValidationException("Invalid storage destination");
            }

            Files.createDirectories(targetLocation.getParent());
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Compute version number
            List<DesignFile> existingFiles = designFileRepository.findAllByProjectIdOrderByVersionNumberDesc(projectId);
            int nextVersion = existingFiles.isEmpty() ? 1 : existingFiles.get(0).getVersionNumber() + 1;

            DesignFile designFile = DesignFile.builder()
                    .project(project)
                    .originalFileName(originalFilename)
                    .storageKey(storageKey)
                    .fileSizeBytes(file.getSize())
                    .mimeType(detectedMimeType != null ? detectedMimeType : "application/octet-stream")
                    .versionNumber(nextVersion)
                    .uploadedBy(uploader)
                    .isProductionApproved(false)
                    .isLocked(false)
                    .build();

            DesignFile saved = designFileRepository.save(designFile);

            auditService.publishAudit(
                    uploader.getId(),
                    uploader.getEmail(),
                    uploader.getRoles().iterator().next().getName().name(),
                    AuditAction.DESIGN_UPLOADED,
                    "DESIGN_FILE",
                    saved.getId().toString(),
                    null,
                    "Uploaded " + originalFilename + " (v" + nextVersion + ", " + file.getSize() + " bytes)",
                    null,
                    null
            );

            return saved;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalFilename, ex);
        }
    }

    @Transactional(readOnly = true)
    public Resource loadFileAsResource(UUID fileId) {
        DesignFile designFile = designFileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found: " + fileId));

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));

        // Check if user has access to project
        boolean canAccess = currentUser.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals(RoleType.ROLE_ADMIN.name()) ||
                a.getAuthority().equals(RoleType.ROLE_MANAGER.name())
        ) || projectRepository.isUserAssignedToProject(designFile.getProject().getId(), currentUser.getId());

        if (!canAccess) {
            throw new UnauthorizedActionException("You do not have permission to download this project file");
        }

        try {
            Path filePath = this.rootStoragePath.resolve(designFile.getStorageKey()).normalize();
            Resource resource = new FileSystemResource(filePath.toFile());
            if (resource.exists() && resource.isReadable()) {
                auditService.publishAudit(
                        currentUser.getId(),
                        currentUser.getUsername(),
                        "USER",
                        AuditAction.FILE_DOWNLOADED,
                        "DESIGN_FILE",
                        fileId.toString(),
                        null,
                        "Downloaded file: " + designFile.getOriginalFileName(),
                        null,
                        null
                );
                return resource;
            } else {
                throw new ResourceNotFoundException("File not found on disk: " + designFile.getOriginalFileName());
            }
        } catch (Exception ex) {
            throw new ResourceNotFoundException("File not found: " + designFile.getOriginalFileName());
        }
    }

    private static final long MAX_PUBLIC_FILE_SIZE_BYTES = 50 * 1024 * 1024L; // 50MB

    public String storePublicCustomerFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileValidationException("Uploaded file is empty");
        }

        if (file.getSize() > MAX_PUBLIC_FILE_SIZE_BYTES) {
            throw new FileValidationException("File size exceeds maximum permitted limit of 50MB");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new FileValidationException("Invalid file name");
        }

        // 1. Extension Validation
        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new FileValidationException("File type '." + extension + "' is not permitted. Allowed: " + ALLOWED_EXTENSIONS);
        }

        // 2. Magic Bytes / MIME Type Inspection via Apache Tika
        String detectedMimeType;
        try (InputStream is = file.getInputStream()) {
            detectedMimeType = tika.detect(is, originalFilename);
        } catch (IOException e) {
            throw new FileValidationException("Failed to inspect file magic bytes: " + e.getMessage());
        }

        if (detectedMimeType != null) {
            for (String dangerous : DANGEROUS_MIME_TYPES) {
                if (detectedMimeType.equalsIgnoreCase(dangerous)) {
                    log.warn("Blocked potentially malicious public customer file upload: name={}, detectedMime={}",
                            originalFilename, detectedMimeType);
                    throw new FileValidationException("File rejected due to security policy: detected " + detectedMimeType);
                }
            }
        }

        String safeName = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        while (safeName.contains("..")) {
            safeName = safeName.replace("..", "_");
        }
        String storageKey = "customer_uploads/" + UUID.randomUUID() + "_" + safeName;

        try {
            Path targetLocation = this.rootStoragePath.resolve(storageKey).normalize();
            if (!targetLocation.startsWith(this.rootStoragePath)) {
                throw new FileValidationException("Invalid storage destination");
            }
            Files.createDirectories(targetLocation.getParent());
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return storageKey;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store customer file: " + originalFilename, ex);
        }
    }

    private String getFileExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        return (dotIndex == -1) ? "" : fileName.substring(dotIndex + 1);
    }
}
