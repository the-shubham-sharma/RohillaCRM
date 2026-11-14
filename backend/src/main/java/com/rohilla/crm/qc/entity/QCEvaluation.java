package com.rohilla.crm.qc.entity;

import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.project.entity.Project;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "qc_evaluations", indexes = {
    @Index(name = "idx_qc_project", columnList = "project_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QCEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inspector_id", nullable = false)
    private User inspector;

    @Column(nullable = false)
    private boolean passed;

    @Column(nullable = false)
    private int colorAccuracyScore; // 1-10

    @Column(nullable = false)
    private int dimensionAccuracyScore; // 1-10

    @Column(nullable = false)
    private int finishingScore; // 1-10

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(columnDefinition = "TEXT")
    private String defectsNotes;

    @Column(length = 255)
    private String inspectionPhotoStorageKey;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
