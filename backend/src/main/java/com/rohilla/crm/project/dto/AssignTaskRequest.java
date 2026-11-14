package com.rohilla.crm.project.dto;

import com.rohilla.crm.project.entity.Project;

import com.rohilla.crm.common.enums.DepartmentType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignTaskRequest {

    @NotNull(message = "Department is required")
    private DepartmentType department;

    @NotNull(message = "Employee ID is required")
    private UUID employeeId;

    private String notes;
}
