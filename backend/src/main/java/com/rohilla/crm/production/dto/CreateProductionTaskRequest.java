package com.rohilla.crm.production.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateProductionTaskRequest {

    @NotBlank(message = "Task name is required")
    private String taskName;

    private String materialSpecification;

    private String machineType;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private UUID assignedToId;

    private String notes;
}
