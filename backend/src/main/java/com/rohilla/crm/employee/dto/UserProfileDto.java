package com.rohilla.crm.employee.dto;

import com.rohilla.crm.common.enums.DepartmentType;
import com.rohilla.crm.security.enums.RoleType;
import com.rohilla.crm.employee.enums.UserStatus;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDto {
    private UUID id;
    private String employeeId;
    private String email;
    private String fullName;
    private String phone;
    private DepartmentType department;
    private UserStatus status;
    private List<RoleType> roles;
    private LocalDate joiningDate;
    private String address;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String emergencyContactRelation;
    private boolean hasProfilePhoto;
    private String profilePhotoUrl;
    private List<EmployeeDocumentDto> documents;
    private Instant createdAt;
    private Instant updatedAt;
}
