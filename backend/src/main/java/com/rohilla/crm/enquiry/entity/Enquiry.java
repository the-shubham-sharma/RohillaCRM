package com.rohilla.crm.enquiry.entity;

import com.rohilla.crm.client.entity.Client;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.enquiry.enums.*;
import com.rohilla.crm.project.entity.Project;
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
@Table(name = "enquiries", indexes = {
    @Index(name = "idx_enquiry_number", columnList = "enquiryNumber", unique = true),
    @Index(name = "idx_enquiry_status", columnList = "status"),
    @Index(name = "idx_enquiry_phone", columnList = "phone"),
    @Index(name = "idx_enquiry_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Enquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String enquiryNumber; // e.g. ENQ-2026-0001

    @Column(nullable = false)
    @Builder.Default
    private LocalDate enquiryDate = LocalDate.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    // Client snapshot information
    @Column(nullable = false, length = 150)
    private String clientName;

    @Column(length = 150)
    private String companyName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 20)
    private String alternatePhone;

    @Column(length = 150)
    private String email;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(length = 50)
    private String gstNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private LeadSource leadSource = LeadSource.WALK_IN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by_id", nullable = false)
    private User recordedBy; // Logged-in front desk / employee

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 35)
    @Builder.Default
    private EnquiryStatus status = EnquiryStatus.SUBMITTED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EnquiryPriority priority = EnquiryPriority.NORMAL;

    private LocalDate expectedCompletionDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private QuotationStatus quotationStatus = QuotationStatus.PENDING;

    @Column(precision = 12, scale = 2)
    private BigDecimal estimatedAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    @Builder.Default
    private DesignRequirementStatus designStatus = DesignRequirementStatus.CLIENT_PROVIDED;

    @Column(columnDefinition = "TEXT")
    private String customerRemarks;

    @Column(columnDefinition = "TEXT")
    private String internalRemarks;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "converted_project_id", unique = true)
    private Project convertedProject;

    @OneToMany(mappedBy = "enquiry", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<EnquiryLineItem> lineItems = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    public void addLineItem(EnquiryLineItem item) {
        lineItems.add(item);
        item.setEnquiry(this);
    }

    public void removeLineItem(EnquiryLineItem item) {
        lineItems.remove(item);
        item.setEnquiry(null);
    }
}
