package com.rohilla.crm.workspace.dto;

import com.rohilla.crm.project.entity.Project;

import com.rohilla.crm.project.dto.ProjectResponseDto;

import com.rohilla.crm.common.enums.DepartmentType;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentWorkspaceDto {
    private DepartmentType department;
    private String userFullName;
    private String userRole;

    @Builder.Default
    private List<ProjectResponseDto> activeWork = new ArrayList<>();

    @Builder.Default
    private List<ProjectResponseDto> waitingWork = new ArrayList<>();

    @Builder.Default
    private List<ProjectResponseDto> recentWork = new ArrayList<>();
}
