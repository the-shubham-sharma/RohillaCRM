package com.rohilla.crm.lead.dto;

import com.rohilla.crm.lead.entity.Lead;
import com.rohilla.crm.project.entity.Project;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerEnquiryRequest {

    @NotBlank(message = "Customer name is required")
    private String name;

    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^(?:\\+91|91|0)?[6-9]\\d{9}$",
        message = "Please provide a valid 10-digit Indian mobile number (e.g. 9810001111)"
    )
    private String phone;

    private String email;

    private String company;

    @NotBlank(message = "Project requirement description is required")
    private String requirement;

    @NotBlank(message = "Product/service category is required")
    private String productService;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    @NotBlank(message = "Size dimensions are required (e.g., 10x4 ft, A4, 3x6 ft)")
    private String size;

    @NotBlank(message = "Delivery/installation location is required")
    private String location;

    @Builder.Default
    private Boolean designRequired = false;

    private String designFileStorageKey;

    private String designFileName;

    private String notes;
}
