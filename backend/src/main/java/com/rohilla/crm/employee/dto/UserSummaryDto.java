package com.rohilla.crm.employee.dto;

import com.rohilla.crm.common.enums.DepartmentType;
import com.rohilla.crm.employee.enums.DocumentVerificationStatus;
import com.rohilla.crm.security.enums.RoleType;
import com.rohilla.crm.employee.enums.UserStatus;
import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSummaryDto {
    private UUID id;
    private String employeeId;
    private String email;
    private String fullName;
    private String phone;
    private DepartmentType department;
    private UserStatus status;
    private List<RoleType> roles;
    private List<String> permissions;
    private boolean mustChangePassword;
    private String temporaryPassword;
    private LocalDate joiningDate;
    private boolean hasProfilePhoto;
    private DocumentVerificationStatus aadhaarStatus;
    private DocumentVerificationStatus panStatus;
}
