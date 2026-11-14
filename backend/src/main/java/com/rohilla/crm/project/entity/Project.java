package com.rohilla.crm.project.entity;

import com.rohilla.crm.client.entity.Client;
import com.rohilla.crm.design.entity.DesignFile;
import com.rohilla.crm.dispatch.entity.DispatchRecord;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.lead.entity.Lead;
import com.rohilla.crm.production.entity.ProductionTask;
import com.rohilla.crm.qc.entity.QCEvaluation;

import com.rohilla.crm.common.enums.Priority;
import com.rohilla.crm.enquiry.entity.Enquiry;
import com.rohilla.crm.inventory.entity.ProjectMaterialRequirement;
import com.rohilla.crm.project.enums.ProjectStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "projects", indexes = {
    @Index(name = "idx_project_code", columnList = "projectCode", unique = true),
    @Index(name = "idx_project_status", columnList = "status"),
    @Index(name = "idx_project_designer", columnList = "assigned_designer_id"),
    @Index(name = "idx_project_production", columnList = "assigned_production_id"),
    @Index(name = "idx_project_qc", columnList = "assigned_qc_id"),
    @Index(name = "idx_project_dispatch", columnList = "assigned_dispatch_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String projectCode;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 35)
    @Builder.Default
    private ProjectStatus status = ProjectStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    /**
     * Path A: customerProvidedDesign = true (Designer only does machine/compatibility check)
     * Path B: customerProvidedDesign = false (Design required: Designer creates design, requires Customer + Manager approval)
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean customerProvidedDesign = false;

    /**
     * References the locked & immutable DesignFile approved for production
     */
    @Column
    private UUID approvedDesignFileId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_designer_id")
    private User assignedDesigner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_production_id")
    private User assignedProduction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_qc_id")
    private User assignedQc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_dispatch_id")
    private User assignedDispatch;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id")
    private Lead lead;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enquiry_id")
    private Enquiry enquiry;

    private LocalDate dueDate;

    @Column(precision = 12, scale = 2)
    private BigDecimal budget;

    // Installation fields
    @Column(nullable = false)
    @Builder.Default
    private boolean installationRequired = true;

    private LocalDate installationDate;

    @Column(columnDefinition = "TEXT")
    private String installationNotes;

    @Column(length = 255)
    private String installationPhotoStorageKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "installation_completed_by_id")
    private User installationCompletedBy;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DesignFile> designFiles = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductionTask> productionTasks = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QCEvaluation> qcEvaluations = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DispatchRecord> dispatchRecords = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectLineItem> lineItems = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectMaterialRequirement> materialRequirements = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
