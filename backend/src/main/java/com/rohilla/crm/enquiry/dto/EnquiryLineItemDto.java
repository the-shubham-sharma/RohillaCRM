package com.rohilla.crm.enquiry.dto;

import com.rohilla.crm.enquiry.enums.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnquiryLineItemDto {
    private UUID id;
    private String serviceName;
    private BigDecimal width;
    private BigDecimal height;
    private DimensionUnit dimensionUnit;
    private boolean siteMeasurementRequired;
    private Integer quantity;
    private QuantityUnit quantityUnit;
    private PrintSides printSides;
    private PrintingType printingType;
    private BigDecimal areaPerSideSqFt;
    private BigDecimal totalAreaSqFt;
    private BigDecimal areaPerSideSqM;
    private BigDecimal totalAreaSqM;
    private boolean installationRequired;
    private String installationLocation;
    private boolean siteInspectionRequired;
    private LocalDate deliveryDate;
    private DesignRequirementStatus designStatus;
    private List<String> selectedMaterials;
    private boolean materialConfirmedByManager;
    private List<String> finishingRequirements;
    private String remarks;
}
