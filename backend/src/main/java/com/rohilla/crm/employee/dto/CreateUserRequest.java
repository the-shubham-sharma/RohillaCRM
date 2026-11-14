package com.rohilla.crm.employee.dto;

import com.rohilla.crm.employee.enums.UserStatus;
import com.rohilla.crm.security.entity.Role;

import com.rohilla.crm.common.enums.DepartmentType;
import com.rohilla.crm.security.enums.RoleType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUserRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String password;

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String phone;

    @NotNull(message = "Department is required")
    private DepartmentType department;

    @NotEmpty(message = "At least one role is required")
    private Set<RoleType> roles;

    @Builder.Default
    private com.rohilla.crm.employee.enums.UserStatus status = com.rohilla.crm.employee.enums.UserStatus.ACTIVE;
}
