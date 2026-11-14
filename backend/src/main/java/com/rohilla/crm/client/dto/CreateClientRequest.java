package com.rohilla.crm.client.dto;

import com.rohilla.crm.client.entity.Client;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateClientRequest {

    @NotBlank(message = "Client name is required")
    @Size(min = 2, max = 150, message = "Client name must be between 2 and 150 characters")
    private String companyName;

    private String contactPerson;

    @Email(message = "Please enter a valid email address")
    private String email;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Mobile number must contain exactly 10 digits")
    private String phone;

    @NotBlank(message = "Client address is required")
    private String address;

    private String gstNumber;

    private Map<String, String> customFields;
}

