package com.rohilla.crm.dispatch.entity;

import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.project.entity.Project;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "dispatch_records", indexes = {
    @Index(name = "idx_dispatch_project", columnList = "project_id"),
    @Index(name = "idx_dispatch_tracking", columnList = "trackingNumber")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispatchRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private LocalDate dispatchDate;

    @Column(nullable = false, length = 100)
    private String courierPartner;

    @Column(nullable = false, length = 100)
    private String trackingNumber;

    @Column(nullable = false, length = 100)
    private String recipientName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String destinationAddress;

    @Column(length = 255)
    private String podPhotoStorageKey; // Proof of delivery photo

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dispatched_by_id", nullable = false)
    private User dispatchedBy;

    @Column(columnDefinition = "TEXT")
    private String dispatchNotes;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
