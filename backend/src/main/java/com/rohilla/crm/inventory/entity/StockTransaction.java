package com.rohilla.crm.inventory.entity;

import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.enquiry.entity.Enquiry;
import com.rohilla.crm.inventory.enums.StockTransactionType;
import com.rohilla.crm.project.entity.Project;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "stock_transactions", indexes = {
    @Index(name = "idx_stx_code", columnList = "transactionCode", unique = true),
    @Index(name = "idx_stx_item", columnList = "inventory_item_id"),
    @Index(name = "idx_stx_type", columnList = "transactionType"),
    @Index(name = "idx_stx_project", columnList = "project_id"),
    @Index(name = "idx_stx_created_at", columnList = "createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String transactionCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 35)
    private StockTransactionType transactionType;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Column(nullable = false, length = 50)
    private String unit;

    @Column(precision = 12, scale = 2)
    private BigDecimal balanceBefore;

    @Column(precision = 12, scale = 2)
    private BigDecimal balanceAfter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enquiry_id")
    private Enquiry enquiry;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "performed_by_id", nullable = false)
    private User performedBy;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
