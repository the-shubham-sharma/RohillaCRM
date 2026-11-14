package com.rohilla.crm.project.dto;

import com.rohilla.crm.project.entity.Project;

import com.rohilla.crm.project.enums.ProjectStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StateTransitionRequest {

    @NotNull(message = "Target status is required")
    private ProjectStatus targetStatus;

    private String remarks;
}
