package com.rohilla.crm.client.service;

import com.rohilla.crm.audit.service.AuditService;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.common.util.PhoneUtils;

import com.rohilla.crm.client.entity.Client;
import com.rohilla.crm.audit.enums.AuditAction;
import com.rohilla.crm.security.enums.RoleType;
import com.rohilla.crm.client.dto.ClientDto;
import com.rohilla.crm.client.dto.CreateClientRequest;
import com.rohilla.crm.client.dto.UpdateClientRequest;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.client.repository.ClientRepository;
import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.security.authorization.SecurityUtils;
import com.rohilla.crm.common.util.PhoneUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final AuditService auditService;

    public boolean isCurrentCallerPrivileged() {
        return SecurityUtils.getCurrentUserDetails()
                .map(u -> u.getAuthorities().stream().anyMatch(a ->
                        a.getAuthority().equals(RoleType.ROLE_ADMIN.name()) ||
                        a.getAuthority().equals(RoleType.ROLE_MANAGER.name()) ||
                        a.getAuthority().equals("client:read:all")
                ))
                .orElse(false);
    }

    public void validateClientData(String name, String phone, String address, String email) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Client name is required");
        }
        if (phone == null || phone.trim().isEmpty()) {
            throw new IllegalArgumentException("Mobile number is required");
        }
        String cleanPhone = PhoneUtils.cleanPhoneNumber(phone);
        if (cleanPhone == null || !cleanPhone.matches("^[0-9]+$")) {
            throw new IllegalArgumentException("Please enter a valid 10-digit mobile number.");
        }
        if (cleanPhone.length() != 10) {
            throw new IllegalArgumentException("Mobile number must contain exactly 10 digits.");
        }
        if (address == null || address.trim().isEmpty()) {
            throw new IllegalArgumentException("Client address is required");
        }
        if (email != null && !email.trim().isEmpty()) {
            String cleanEmail = email.trim();
            if (!cleanEmail.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                throw new IllegalArgumentException("Please enter a valid email address");
            }
        }
    }

    @Transactional(readOnly = true)
    public List<ClientDto> getAllClients() {
        boolean isPrivileged = isCurrentCallerPrivileged();
        return clientRepository.findAllByOrderByCompanyNameAsc().stream()
                .map(c -> mapToDto(c, isPrivileged))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ClientDto getClientById(UUID id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found: " + id));
        boolean isPrivileged = isCurrentCallerPrivileged();
        return mapToDto(client, isPrivileged);
    }

    @Transactional
    public ClientDto createClient(CreateClientRequest request) {
        validateClientData(request.getCompanyName(), request.getPhone(), request.getAddress(), request.getEmail());

        String cleanedPhone = PhoneUtils.cleanPhoneNumber(request.getPhone());
        String cleanedName = request.getCompanyName().trim();
        String cleanedAddress = request.getAddress().trim();
        String cleanedEmail = (request.getEmail() != null && !request.getEmail().trim().isEmpty())
                ? request.getEmail().trim() : null;

        Map<String, String> customMap = new LinkedHashMap<>();
        if (request.getCustomFields() != null) {
            request.getCustomFields().forEach((k, v) -> {
                if (k != null && !k.trim().isEmpty() && v != null) {
                    customMap.put(k.trim(), v.trim());
                }
            });
        }

        Client client = Client.builder()
                .companyName(cleanedName)
                .contactPerson(request.getContactPerson() != null ? request.getContactPerson().trim() : null)
                .email(cleanedEmail)
                .phone(cleanedPhone)
                .address(cleanedAddress)
                .gstNumber(request.getGstNumber() != null ? request.getGstNumber().trim() : null)
                .customFields(customMap)
                .build();

        Client saved = clientRepository.save(client);

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails().orElse(null);
        UUID actorId = currentUser != null ? currentUser.getId() : null;
        String actorEmail = currentUser != null ? currentUser.getUsername() : "SYSTEM";
        String actorRole = currentUser != null && !currentUser.getAuthorities().isEmpty()
                ? currentUser.getAuthorities().iterator().next().getAuthority() : "ADMIN";

        auditService.publishAudit(
                actorId,
                actorEmail,
                actorRole,
                AuditAction.CLIENT_CREATED,
                "CLIENT",
                saved.getId().toString(),
                null,
                "Created client " + saved.getCompanyName() + " with mobile " + saved.getPhone(),
                null,
                null
        );

        return mapToDto(saved, true);
    }

    @Transactional
    public ClientDto updateClient(UUID clientId, UpdateClientRequest request) {
        if (!isCurrentCallerPrivileged()) {
            throw new UnauthorizedActionException("Only Admins and Managers can edit client details.");
        }

        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found: " + clientId));

        validateClientData(request.getCompanyName(), request.getPhone(), request.getAddress(), request.getEmail());

        String oldPhone = client.getPhone();
        String oldName = client.getCompanyName();
        String oldAddress = client.getAddress();
        String oldEmail = client.getEmail();

        String cleanedPhone = PhoneUtils.cleanPhoneNumber(request.getPhone());
        String cleanedName = request.getCompanyName().trim();
        String cleanedAddress = request.getAddress().trim();
        String cleanedEmail = (request.getEmail() != null && !request.getEmail().trim().isEmpty())
                ? request.getEmail().trim() : null;

        client.setCompanyName(cleanedName);
        client.setPhone(cleanedPhone);
        client.setAddress(cleanedAddress);
        client.setEmail(cleanedEmail);
        if (request.getContactPerson() != null) {
            client.setContactPerson(request.getContactPerson().trim());
        }
        if (request.getGstNumber() != null) {
            client.setGstNumber(request.getGstNumber().trim());
        }

        if (request.getCustomFields() != null) {
            Map<String, String> customMap = new LinkedHashMap<>();
            request.getCustomFields().forEach((k, v) -> {
                if (k != null && !k.trim().isEmpty() && v != null) {
                    customMap.put(k.trim(), v.trim());
                }
            });
            client.setCustomFields(customMap);
        }

        Client updated = clientRepository.save(client);

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails().orElse(null);
        UUID actorId = currentUser != null ? currentUser.getId() : null;
        String actorEmail = currentUser != null ? currentUser.getUsername() : "SYSTEM";
        String actorRole = currentUser != null && !currentUser.getAuthorities().isEmpty()
                ? currentUser.getAuthorities().iterator().next().getAuthority() : "MANAGER";

        String oldSummary = String.format("Name: %s, Phone: %s, Address: %s, Email: %s", oldName, oldPhone, oldAddress, oldEmail);
        String newSummary = String.format("Name: %s, Phone: %s, Address: %s, Email: %s", cleanedName, cleanedPhone, cleanedAddress, cleanedEmail);

        auditService.publishAudit(
                actorId,
                actorEmail,
                actorRole,
                AuditAction.CLIENT_UPDATED,
                "CLIENT",
                updated.getId().toString(),
                oldSummary,
                newSummary,
                null,
                null
        );

        return mapToDto(updated, true);
    }

    public ClientDto mapToDto(Client client) {
        return mapToDto(client, isCurrentCallerPrivileged());
    }

    public ClientDto mapToDto(Client client, boolean isPrivileged) {
        if (client == null) {
            return null;
        }
        return ClientDto.builder()
                .id(client.getId())
                .companyName(client.getCompanyName())
                .contactPerson(client.getContactPerson())
                .email(isPrivileged ? client.getEmail() : null)
                .phone(isPrivileged ? client.getPhone() : null)
                .formattedWhatsAppPhone(isPrivileged ? client.getNormalizedWhatsAppPhone() : null)
                .address(client.getAddress())
                .gstNumber(isPrivileged ? client.getGstNumber() : null)
                .customFields(isPrivileged ? new LinkedHashMap<>(client.getCustomFields()) : null)
                .createdAt(client.getCreatedAt())
                .build();
    }
}


