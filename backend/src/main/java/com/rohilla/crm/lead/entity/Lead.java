package com.rohilla.crm.lead.entity;

import com.rohilla.crm.common.util.PhoneUtils;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.project.entity.Project;

import com.rohilla.crm.lead.enums.LeadStatus;
import com.rohilla.crm.common.util.PhoneUtils;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "leads", indexes = {
    @Index(name = "idx_lead_code", columnList = "leadCode", unique = true),
    @Index(name = "idx_lead_status", columnList = "status"),
    @Index(name = "idx_lead_phone", columnList = "phone"),
    @Index(name = "idx_lead_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String leadCode; // e.g. LEAD-2026-0001

    @Column(nullable = false, length = 150)
    private String customerName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 150)
    private String email;

    @Column(length = 150)
    private String companyName;

    @Column(nullable = false, length = 255)
    private String requirement;

    @Column(nullable = false, length = 100)
    private String productService; // e.g. Outdoor Advertising, Flex Printing, Standee, etc.

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, length = 100)
    private String size;

    @Column(nullable = false, length = 200)
    private String location;

    @Column(nullable = false)
    @Builder.Default
    private boolean designRequired = false;

    @Column(length = 255)
    private String designFileStorageKey;

    @Column(length = 255)
    private String designFileName;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 35)
    @Builder.Default
    private LeadStatus status = LeadStatus.NEW_LEAD;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_manager_id")
    private User assignedManager;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "converted_project_id")
    private Project convertedProject;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public String getNormalizedWhatsAppPhone() {
        return PhoneUtils.toWhatsAppFormat(this.phone);
    }
}
