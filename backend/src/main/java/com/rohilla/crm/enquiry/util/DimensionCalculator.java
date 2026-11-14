package com.rohilla.crm.enquiry.util;

import com.rohilla.crm.enquiry.enums.DimensionUnit;
import com.rohilla.crm.enquiry.enums.PrintSides;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class DimensionCalculator {

    private static final BigDecimal INCHES_TO_FEET = new BigDecimal("12");
    private static final BigDecimal MM_TO_FEET = new BigDecimal("304.8");
    private static final BigDecimal METRES_TO_FEET = new BigDecimal("3.280839895");
    private static final BigDecimal SQFT_TO_SQM = new BigDecimal("10.7639104");

    private DimensionCalculator() {}

    public static class AreaResult {
        private final BigDecimal areaPerSideSqFt;
        private final BigDecimal totalAreaSqFt;
        private final BigDecimal areaPerSideSqM;
        private final BigDecimal totalAreaSqM;

        public AreaResult(BigDecimal areaPerSideSqFt, BigDecimal totalAreaSqFt, BigDecimal areaPerSideSqM, BigDecimal totalAreaSqM) {
            this.areaPerSideSqFt = areaPerSideSqFt;
            this.totalAreaSqFt = totalAreaSqFt;
            this.areaPerSideSqM = areaPerSideSqM;
            this.totalAreaSqM = totalAreaSqM;
        }

        public BigDecimal getAreaPerSideSqFt() { return areaPerSideSqFt; }
        public BigDecimal getTotalAreaSqFt() { return totalAreaSqFt; }
        public BigDecimal getAreaPerSideSqM() { return areaPerSideSqM; }
        public BigDecimal getTotalAreaSqM() { return totalAreaSqM; }
    }

    public static AreaResult calculateArea(BigDecimal width, BigDecimal height, DimensionUnit unit, PrintSides printSides) {
        if (width == null || height == null || width.compareTo(BigDecimal.ZERO) <= 0 || height.compareTo(BigDecimal.ZERO) <= 0) {
            return new AreaResult(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        }

        DimensionUnit safeUnit = unit != null ? unit : DimensionUnit.FEET;
        BigDecimal widthInFeet = toFeet(width, safeUnit);
        BigDecimal heightInFeet = toFeet(height, safeUnit);

        BigDecimal areaPerSideSqFt = widthInFeet.multiply(heightInFeet).setScale(2, RoundingMode.HALF_UP);
        BigDecimal sideMultiplier = (printSides == PrintSides.DOUBLE_SIDED) ? new BigDecimal("2") : BigDecimal.ONE;
        BigDecimal totalAreaSqFt = areaPerSideSqFt.multiply(sideMultiplier).setScale(2, RoundingMode.HALF_UP);

        BigDecimal areaPerSideSqM = areaPerSideSqFt.divide(SQFT_TO_SQM, 4, RoundingMode.HALF_UP).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAreaSqM = totalAreaSqFt.divide(SQFT_TO_SQM, 4, RoundingMode.HALF_UP).setScale(2, RoundingMode.HALF_UP);

        return new AreaResult(areaPerSideSqFt, totalAreaSqFt, areaPerSideSqM, totalAreaSqM);
    }

    private static BigDecimal toFeet(BigDecimal value, DimensionUnit unit) {
        return switch (unit) {
            case FEET -> value;
            case INCHES -> value.divide(INCHES_TO_FEET, 6, RoundingMode.HALF_UP);
            case METRES -> value.multiply(METRES_TO_FEET);
            case MILLIMETRES -> value.divide(MM_TO_FEET, 6, RoundingMode.HALF_UP);
        };
    }
}
