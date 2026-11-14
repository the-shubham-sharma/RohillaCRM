package com.rohilla.crm.client.dto;

import com.rohilla.crm.client.entity.Client;

import lombok.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientDto {
    private UUID id;
    private String companyName;
    private String contactPerson;
    private String email;
    private String phone;
    private String formattedWhatsAppPhone;
    private String address;
    private String gstNumber;
    private Map<String, String> customFields;
    private Instant createdAt;
}

