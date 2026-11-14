package com.rohilla.crm.enquiry.dto;

import com.rohilla.crm.enquiry.enums.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnquiryLineItemRequest {

    @NotBlank(message = "Service name is required")
    private String serviceName;

    private BigDecimal width;
    private BigDecimal height;

    @Builder.Default
    private DimensionUnit dimensionUnit = DimensionUnit.FEET;

    @Builder.Default
    private boolean siteMeasurementRequired = false;

    @Builder.Default
    private Integer quantity = 1;

    @Builder.Default
    private QuantityUnit quantityUnit = QuantityUnit.PIECE;

    @Builder.Default
    private PrintSides printSides = PrintSides.SINGLE_SIDED;

    @Builder.Default
    private PrintingType printingType = PrintingType.FULL_COLOUR;

    @Builder.Default
    private boolean installationRequired = false;

    private String installationLocation;

    @Builder.Default
    private boolean siteInspectionRequired = false;

    private LocalDate deliveryDate;

    @Builder.Default
    private DesignRequirementStatus designStatus = DesignRequirementStatus.CLIENT_PROVIDED;

    @Builder.Default
    private List<String> selectedMaterials = new ArrayList<>();

    @Builder.Default
    private boolean materialConfirmedByManager = false;

    @Builder.Default
    private List<String> finishingRequirements = new ArrayList<>();

    private String remarks;
}
