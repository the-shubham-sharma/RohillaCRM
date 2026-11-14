package com.rohilla.crm.production.entity;

import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.project.entity.Project;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "production_tasks", indexes = {
    @Index(name = "idx_prod_project", columnList = "project_id"),
    @Index(name = "idx_prod_assigned", columnList = "assigned_to_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionTask {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 150)
    private String taskName;

    @Column(length = 255)
    private String materialSpecification;

    @Column(length = 100)
    private String machineType;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "PENDING"; // PENDING, IN_PROGRESS, COMPLETED

    private Instant startedAt;

    private Instant completedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
