package com.rohilla.crm.inventory.entity;

import com.rohilla.crm.inventory.enums.RequirementStatus;
import com.rohilla.crm.project.entity.Project;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_material_requirements", indexes = {
    @Index(name = "idx_pmr_project", columnList = "project_id"),
    @Index(name = "idx_pmr_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectMaterialRequirement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id")
    private InventoryItem inventoryItem;

    @Column(nullable = false, length = 150)
    private String materialName;

    @Column(length = 100)
    private String serviceName; // associated service e.g. Flex Printing, Sign Board

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal requiredQuantity = BigDecimal.ONE;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String unit = "Piece";

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal reservedQuantity = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal issuedQuantity = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 35)
    @Builder.Default
    private RequirementStatus status = RequirementStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
