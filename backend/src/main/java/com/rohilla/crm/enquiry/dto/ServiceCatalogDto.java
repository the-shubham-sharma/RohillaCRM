package com.rohilla.crm.enquiry.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceCatalogDto {
    private String serviceName;
    private List<String> materials;
    private List<String> finishingOptions;
    private List<String> defaultUnits;
}
