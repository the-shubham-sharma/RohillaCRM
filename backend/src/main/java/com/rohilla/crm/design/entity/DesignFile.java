package com.rohilla.crm.design.entity;

import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.project.entity.Project;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "design_files", indexes = {
    @Index(name = "idx_design_project", columnList = "project_id"),
    @Index(name = "idx_design_storage_key", columnList = "storageKey", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DesignFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 255)
    private String originalFileName;

    @Column(nullable = false, unique = true, length = 255)
    private String storageKey;

    @Column(nullable = false)
    private Long fileSizeBytes;

    @Column(nullable = false, length = 100)
    private String mimeType;

    @Column(nullable = false)
    @Builder.Default
    private Integer versionNumber = 1;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by_id", nullable = false)
    private User uploadedBy;

    // Path A: Machine / Production Technical Compatibility Check
    @Column
    private Boolean technicalCheckPassed;

    @Column(columnDefinition = "TEXT")
    private String compatibilityNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technical_checked_by_id")
    private User technicalCheckedBy;

    // Path B: Customer Approval
    @Column
    private Boolean approvedByCustomer;

    @Column(columnDefinition = "TEXT")
    private String customerFeedback;

    // Path B: Manager Approval
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_manager_id")
    private User approvedByManager;

    @Column
    private Instant managerApprovedAt;

    // Final Production Lock
    @Column(nullable = false)
    @Builder.Default
    private boolean isProductionApproved = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean isLocked = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
