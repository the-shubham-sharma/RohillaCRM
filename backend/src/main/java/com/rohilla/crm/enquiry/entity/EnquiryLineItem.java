package com.rohilla.crm.enquiry.entity;

import com.rohilla.crm.enquiry.enums.*;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "enquiry_line_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnquiryLineItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enquiry_id", nullable = false)
    private Enquiry enquiry;

    @Column(nullable = false, length = 100)
    private String serviceName;

    // Dimensions
    @Column(precision = 10, scale = 2)
    private BigDecimal width;

    @Column(precision = 10, scale = 2)
    private BigDecimal height;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private DimensionUnit dimensionUnit = DimensionUnit.FEET;

    @Column(nullable = false)
    @Builder.Default
    private boolean siteMeasurementRequired = false;

    // Quantity
    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    @Builder.Default
    private QuantityUnit quantityUnit = QuantityUnit.PIECE;

    // Printing details
    @Enumerated(EnumType.STRING)
    @Column(length = 25)
    @Builder.Default
    private PrintSides printSides = PrintSides.SINGLE_SIDED;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    @Builder.Default
    private PrintingType printingType = PrintingType.FULL_COLOUR;

    // Calculated Area
    @Column(precision = 12, scale = 2)
    private BigDecimal areaPerSideSqFt;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalAreaSqFt;

    @Column(precision = 12, scale = 2)
    private BigDecimal areaPerSideSqM;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalAreaSqM;

    // Installation & Site
    @Column(nullable = false)
    @Builder.Default
    private boolean installationRequired = false;

    @Column(length = 255)
    private String installationLocation;

    @Column(nullable = false)
    @Builder.Default
    private boolean siteInspectionRequired = false;

    private LocalDate deliveryDate;

    // Design requirement per item
    @Enumerated(EnumType.STRING)
    @Column(length = 40)
    @Builder.Default
    private DesignRequirementStatus designStatus = DesignRequirementStatus.CLIENT_PROVIDED;

    // Predefined materials selected
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "enquiry_line_item_materials", joinColumns = @JoinColumn(name = "line_item_id"))
    @Column(name = "material_name")
    @Builder.Default
    private List<String> selectedMaterials = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private boolean materialConfirmedByManager = false;

    // Finishing requirements
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "enquiry_line_item_finishing", joinColumns = @JoinColumn(name = "line_item_id"))
    @Column(name = "finishing_requirement")
    @Builder.Default
    private List<String> finishingRequirements = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String remarks;
}
